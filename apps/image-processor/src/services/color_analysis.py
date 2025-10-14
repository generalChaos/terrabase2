"""
Color Analysis Module - Production-ready color palette extraction
Based on systematic approach with OKLCH, background detection, and role assignment
"""

from PIL import Image, ImageOps, ImageDraw
import numpy as np
import math
import json
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# ---------- Color spaces & WCAG ----------
def _srgb_to_lin(c): 
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rel_lum(rgb):
    r, g, b = rgb
    lr, lg, lb = map(_srgb_to_lin, (r, g, b))
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb

def contrast(a, b):
    L1, L2 = rel_lum(a), rel_lum(b)
    L1, L2 = max(L1, L2), min(L1, L2)
    return (L1 + 0.05) / (L2 + 0.05)

def rgb_to_oklab(r, g, b):
    lr, lg, lb = map(_srgb_to_lin, (r, g, b))
    l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, a, b

def oklab_to_oklch(L, a, b):
    C = (a * a + b * b) ** 0.5
    h = (math.degrees(math.atan2(b, a)) + 360) % 360
    return L, C, h

def deltaE_oklab(c1, c2):
    """Quick ΔE in OKLab (euclidean)"""
    (L1, a1, b1), (L2, a2, b2) = c1, c2
    return ((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2) ** 0.5

# ---------- Data Structures ----------
@dataclass
class Swatch:
    hex: str
    rgb: Tuple[int, int, int]
    percent: float
    okL: float
    okC: float
    okh: float
    contrast_white: float
    contrast_black: float

@dataclass
class RoleAssignment:
    background: Swatch
    surface: Swatch
    primary: Swatch
    accent: Swatch
    confidence_scores: Dict[str, float]
    assignment_reasons: Dict[str, str]

@dataclass
class ColorAnalysisResult:
    k: int
    swatches: List[Swatch]
    roles: RoleAssignment
    background_candidate: Optional[Tuple[int, int, int]]
    reconstruction_error: float
    processing_time: float

# ---------- Helper Functions ----------
def _rgb_to_hex(t): 
    return "#{:02X}{:02X}{:02X}".format(*t)

def _to_rgb_tuple(x): 
    return (int(x[0]), int(x[1]), int(x[2]))

def _dilate_alpha_mask(alpha_array, dilation_pixels=1):
    """Dilate alpha mask to ignore thin outlines"""
    from scipy import ndimage
    try:
        # Use scipy if available
        dilated = ndimage.binary_dilation(alpha_array > 0, iterations=dilation_pixels)
        return dilated
    except ImportError:
        # Fallback: simple dilation
        h, w = alpha_array.shape
        result = alpha_array > 0
        for _ in range(dilation_pixels):
            new_result = result.copy()
            for y in range(1, h-1):
                for x in range(1, w-1):
                    if result[y, x]:
                        new_result[y-1:y+2, x-1:x+2] = True
            result = new_result
        return result

# ---------- Core Analysis Function ----------
def analyze_image(
    image_path: str,
    mode: str = "logo",
    max_edge: int = 1024,
    k_lo: int = 4,
    k_hi: int = 10,
    min_cluster_pct: float = 0.8,
    dilate_alpha: bool = True
) -> ColorAnalysisResult:
    """
    Analyze image and extract color palette with role assignments
    
    Args:
        image_path: Path to image file
        mode: "logo" or "photo" (affects heuristics)
        max_edge: Maximum dimension for downscaling
        k_lo: Minimum cluster count to try
        k_hi: Maximum cluster count to try
        min_cluster_pct: Minimum cluster percentage to keep
        dilate_alpha: Whether to dilate alpha mask for thin outlines
    
    Returns:
        ColorAnalysisResult with swatches and role assignments
    """
    import time
    start_time = time.time()
    
    logger.info(f"🎨 COLOR_ANALYSIS: Starting analysis of {image_path} (mode: {mode})")
    
    # Load & downscale deterministically
    img = Image.open(image_path)
    img = ImageOps.exif_transpose(img).convert("RGBA")
    w, h = img.size
    scale = max(w, h) / max_edge if max(w, h) > max_edge else 1.0
    
    if scale > 1:
        new_w, new_h = int(w / scale), int(h / scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        logger.info(f"🎨 COLOR_ANALYSIS: Downscaled from {w}x{h} to {new_w}x{new_h}")
    
    # Build sample set (skip fully transparent)
    arr = np.asarray(img)
    
    # Handle alpha channel with optional dilation
    if img.mode == 'RGBA':
        alpha_channel = arr[..., 3]
        if dilate_alpha and mode == "logo":
            # Dilate alpha mask to ignore thin outlines
            mask = _dilate_alpha_mask(alpha_channel, dilation_pixels=1)
            logger.info("🎨 COLOR_ANALYSIS: Applied alpha dilation for thin outlines")
        else:
            mask = alpha_channel > 0
        
        pixels = arr[..., :3][mask]
    else:
        pixels = arr.reshape(-1, 3)
    
    if pixels.size == 0:
        raise ValueError("No opaque pixels found")
    
    logger.info(f"🎨 COLOR_ANALYSIS: Analyzing {len(pixels)} pixels")
    logger.info(f"🎨 COLOR_ANALYSIS: Pixels shape: {pixels.shape}, dtype: {pixels.dtype}")
    
    # Background detection (logo mode)
    bg_candidate = None
    if mode == "logo":
        bg_candidate = _detect_background_candidate(arr, edge_width=2)
        if bg_candidate:
            logger.info(f"🎨 COLOR_ANALYSIS: Background candidate detected: {bg_candidate}")
    
    # Try multiple K via MMCQ with elbow selection
    best_k, best_cols, reconstruction_error = _find_optimal_clusters(
        pixels, k_lo, k_hi, min_cluster_pct
    )
    
    logger.info(f"🎨 COLOR_ANALYSIS: Selected K={best_k} clusters (error: {reconstruction_error:.2f})")
    
    # Convert to swatches
    swatches = _create_swatches(best_cols)
    
    # Merge near-duplicates
    swatches = _merge_near_duplicates(swatches)
    logger.info(f"🎨 COLOR_ANALYSIS: {len(swatches)} swatches after merging")
    
    # Assign roles
    roles = _assign_roles(swatches, bg_candidate, mode)
    
    processing_time = time.time() - start_time
    logger.info(f"🎨 COLOR_ANALYSIS: Analysis complete in {processing_time:.2f}s")
    
    return ColorAnalysisResult(
        k=best_k,
        swatches=swatches,
        roles=roles,
        background_candidate=bg_candidate,
        reconstruction_error=reconstruction_error,
        processing_time=processing_time
    )

def _detect_background_candidate(arr, edge_width=2):
    """Detect background candidate from edge pixels"""
    h, w = arr.shape[:2]
    
    # Sample edge pixels
    edge_pixels = np.concatenate([
        arr[:edge_width, :, :3].reshape(-1, 3),
        arr[-edge_width:, :, :3].reshape(-1, 3),
        arr[:, :edge_width, :3].reshape(-1, 3),
        arr[:, -edge_width:, :3].reshape(-1, 3),
    ], axis=0)
    
    if len(edge_pixels) == 0:
        return None
    
    # Coarse quantize edge to 3 colors
    edge_img = Image.fromarray(edge_pixels.reshape(-1, 1, 3), "RGB")
    edge_pal_img = edge_img.quantize(colors=3, method=Image.MEDIANCUT)
    
    # Get palette and counts
    pal = edge_pal_img.getpalette()[:9]
    counts = np.bincount(np.array(edge_pal_img).reshape(-1), minlength=3)
    
    # Find dominant edge color
    if len(counts) > 0 and counts.max() > 0:
        idx = int(counts.argmax())
        bg_rgb = (pal[idx*3], pal[idx*3+1], pal[idx*3+2])
        
        # Check if it's a reasonable background (light or dark, low chroma)
        L, a, b = rgb_to_oklab(*bg_rgb)
        Lc, C, h = oklab_to_oklch(L, a, b)
        
        if (Lc >= 0.9 or Lc <= 0.12) and C < 0.05:
            return _to_rgb_tuple(bg_rgb)
    
    return None

def _find_optimal_clusters(pixels, k_lo, k_hi, min_cluster_pct):
    """Find optimal number of clusters using elbow method"""
    
    def quantize(img_rgb, k):
        logger.info(f"🎨 QUANTIZE: Processing {img_rgb.shape} array for k={k}")
        logger.info(f"🎨 QUANTIZE: Array dtype: {img_rgb.dtype}, min: {img_rgb.min()}, max: {img_rgb.max()}")
        
        # Ensure the array is the right shape and type
        if len(img_rgb.shape) != 2 or img_rgb.shape[1] != 3:
            raise ValueError(f"Expected 2D array with 3 columns, got shape {img_rgb.shape}")
        
        if img_rgb.dtype != np.uint8:
            img_rgb = img_rgb.astype(np.uint8)
        
        # Reshape to 3D for PIL (height=1, width=pixels, channels=3)
        # This is a workaround since PIL expects 3D arrays
        height = int(np.sqrt(len(img_rgb)))
        width = len(img_rgb) // height
        
        if height * width != len(img_rgb):
            # If we can't make a perfect square, pad the array
            target_size = height * width
            if target_size < len(img_rgb):
                height += 1
                target_size = height * width
            
            # Pad with the last pixel
            padding_needed = target_size - len(img_rgb)
            if padding_needed > 0:
                padding = np.tile(img_rgb[-1:], (padding_needed, 1))
                img_rgb = np.vstack([img_rgb, padding])
        
        # Reshape to 3D
        img_3d = img_rgb[:height*width].reshape(height, width, 3)
        
        pal_img = Image.fromarray(img_3d, "RGB").quantize(colors=k, method=Image.MEDIANCUT)
        palette = pal_img.getpalette()
        if palette is None:
            # Fallback: get colors directly from the quantized image
            unique_colors = np.unique(pal_img.getdata())
            cols = []
            for color_idx in unique_colors:
                # Get the actual color from the quantized image
                mask = np.array(pal_img) == color_idx
                count = np.sum(mask)
                if count > 0:
                    # Find a representative pixel
                    y, x = np.where(mask)
                    if len(y) > 0:
                        rep_y, rep_x = y[0], x[0]
                        rgb = img_3d[rep_y, rep_x]
                        cols.append((_to_rgb_tuple(rgb), int(count)))
        else:
            # Use palette
            palette_len = len(palette) // 3
            actual_k = min(k, palette_len)
            idx_counts = np.bincount(np.array(pal_img).reshape(-1), minlength=actual_k)
            cols = [(_to_rgb_tuple((palette[i*3], palette[i*3+1], palette[i*3+2])), int(idx_counts[i]))
                    for i in range(actual_k)]
        
        cols.sort(key=lambda t: t[1], reverse=True)
        return cols
    
    def reconstruction_error(img_rgb, cols):
        """Mean distance to nearest palette color"""
        flat = img_rgb.reshape(-1, 3).astype(np.float32)
        pal = np.array([c for c, _ in cols], dtype=np.float32)
        d = ((flat[:, None, :] - pal[None, :, :]) ** 2).sum(2).min(1)
        return float((d.mean()) ** 0.5)
    
    # Try each K
    candidates = []
    for k in range(k_lo, k_hi + 1):
        cols = quantize(pixels, k)
        err = reconstruction_error(pixels, cols)
        candidates.append((k, err, cols))
    
    # Pick K by elbow method
    errs = [e for (_, e, _) in candidates]
    ks = [k for (k, _, _) in candidates]
    
    if len(errs) < 2:
        return candidates[0]
    
    diffs = [errs[i-1] - errs[i] for i in range(1, len(errs))]
    best_k = ks[0]
    best_score = -1e9
    
    for i in range(1, len(diffs)):
        score = diffs[i-1] - diffs[i]
        if score > best_score:
            best_score = score
            best_k = ks[i]
    
    # Filter tiny clusters
    chosen = [c for c in candidates if c[0] == best_k][0]
    k, err, cols = chosen
    total = sum(count for _, count in cols)
    
    cols = [(rgb, cnt) for (rgb, cnt) in cols if (100 * cnt / total) >= min_cluster_pct]
    
    return k, cols, err

def _create_swatches(cols):
    """Convert cluster results to Swatch objects"""
    total = sum(cnt for _, cnt in cols)
    swatches = []
    
    for (r, g, b), cnt in cols:
        L, a, b2 = rgb_to_oklab(r, g, b)
        Lc, C, h = oklab_to_oklch(L, a, b2)
        
        swatches.append(Swatch(
            hex=_rgb_to_hex((r, g, b)),
            rgb=(r, g, b),
            percent=round(100 * cnt / total, 2),
            okL=round(Lc, 3),
            okC=round(C, 3),
            okh=round(h, 1),
            contrast_white=round(contrast((r, g, b), (255, 255, 255)), 2),
            contrast_black=round(contrast((r, g, b), (0, 0, 0)), 2),
        ))
    
    return sorted(swatches, key=lambda s: -s.percent)

def _merge_near_duplicates(swatches):
    """Merge swatches that are too similar"""
    merged = []
    used = [False] * len(swatches)
    
    for i, si in enumerate(swatches):
        if used[i]:
            continue
        
        group_idx = [i]
        Li = rgb_to_oklab(*si.rgb)
        
        for j, sj in enumerate(swatches[i+1:], start=i+1):
            if used[j]:
                continue
            
            Lj = rgb_to_oklab(*sj.rgb)
            if deltaE_oklab(Li, Lj) < 2.0 and abs(si.okL - sj.okL) < 0.02:
                group_idx.append(j)
                used[j] = True
        
        # Combine proportions
        pct = sum(swatches[g].percent for g in group_idx)
        rep = swatches[group_idx[0]]
        merged.append(Swatch(
            rep.hex, rep.rgb, pct, rep.okL, rep.okC, rep.okh,
            rep.contrast_white, rep.contrast_black
        ))
        used[i] = True
    
    return sorted(merged, key=lambda s: -s.percent)

def _assign_roles(swatches, bg_candidate, mode):
    """Assign UI roles to swatches with explainable heuristics"""
    
    def is_neutral(s: Swatch):
        return s.okC < 0.06
    
    # Background selection
    bg = None
    bg_reason = ""
    bg_confidence = 0.0
    
    if bg_candidate is not None:
        # Find closest swatch to background candidate
        Lc = rgb_to_oklab(*bg_candidate)
        bg = min(swatches, key=lambda s: deltaE_oklab(rgb_to_oklab(*s.rgb), Lc))
        bg_reason = "Edge detection + lightness/chroma prior"
        bg_confidence = 0.9
    else:
        # Look for neutral with extreme lightness
        candidates = [s for s in swatches if is_neutral(s) and (s.okL >= 0.9 or s.okL <= 0.12)]
        if candidates:
            bg = candidates[0]
            bg_reason = "Largest neutral with extreme lightness"
            bg_confidence = 0.7
        else:
            bg = swatches[0]
            bg_reason = "Largest cluster (fallback)"
            bg_confidence = 0.5
    
    # Surface selection
    surface = None
    surface_reason = ""
    surface_confidence = 0.0
    
    for s in swatches:
        if s.hex == bg.hex:
            continue
        if is_neutral(s) and abs(s.okL - bg.okL) >= 0.08:
            surface = s
            surface_reason = f"Neutral with ΔL={abs(s.okL - bg.okL):.2f} from background"
            surface_confidence = 0.8
            break
    
    if surface is None:
        surface = swatches[1] if len(swatches) > 1 else bg
        surface_reason = "Second largest cluster (fallback)"
        surface_confidence = 0.4
    
    # Primary selection
    primary = None
    primary_reason = ""
    primary_confidence = 0.0
    
    for s in swatches:
        if s.hex in (bg.hex, surface.hex):
            continue
        if 0.10 <= s.okC <= 0.22 and 0.35 <= s.okL <= 0.70:
            primary = s
            primary_reason = f"Non-neutral with C={s.okC:.2f}, L={s.okL:.2f} (good for text)"
            primary_confidence = 0.8
            break
    
    if primary is None:
        # Fallback to most prominent non-neutral
        nn = [s for s in swatches if not is_neutral(s) and s.hex not in (bg.hex, surface.hex)]
        if nn:
            primary = nn[0]
            primary_reason = "Most prominent non-neutral (fallback)"
            primary_confidence = 0.6
        else:
            primary = surface
            primary_reason = "Surface color (fallback)"
            primary_confidence = 0.3
    
    # Accent selection
    accent = None
    accent_reason = ""
    accent_confidence = 0.0
    
    for s in swatches:
        if s.hex in (bg.hex, surface.hex, primary.hex):
            continue
        if s.okC >= 0.12:
            accent = s
            accent_reason = f"High chroma (C={s.okC:.2f}) remaining color"
            accent_confidence = 0.7
            break
    
    if accent is None:
        remaining = [s for s in swatches if s.hex not in (bg.hex, surface.hex, primary.hex)]
        if remaining:
            accent = remaining[0]
            accent_reason = "Largest remaining color (fallback)"
            accent_confidence = 0.4
        else:
            accent = primary
            accent_reason = "Primary color (fallback)"
            accent_confidence = 0.2
    
    return RoleAssignment(
        background=bg,
        surface=surface,
        primary=primary,
        accent=accent,
        confidence_scores={
            "background": bg_confidence,
            "surface": surface_confidence,
            "primary": primary_confidence,
            "accent": accent_confidence
        },
        assignment_reasons={
            "background": bg_reason,
            "surface": surface_reason,
            "primary": primary_reason,
            "accent": accent_reason
        }
    )

# ---------- Export Functions ----------
def analyze_image_to_dict(image_path: str, **kwargs) -> Dict[str, Any]:
    """Analyze image and return dictionary format for API responses"""
    result = analyze_image(image_path, **kwargs)
    
    return {
        "success": True,
        "data": {
            "k": result.k,
            "swatches": [s.__dict__ for s in result.swatches],
            "roles": {
                "background": result.roles.background.__dict__,
                "surface": result.roles.surface.__dict__,
                "primary": result.roles.primary.__dict__,
                "accent": result.roles.accent.__dict__,
            },
            "confidence_scores": result.roles.confidence_scores,
            "assignment_reasons": result.roles.assignment_reasons,
            "background_candidate": result.background_candidate,
            "reconstruction_error": result.reconstruction_error,
            "processing_time": result.processing_time
        }
    }

if __name__ == "__main__":
    # Test with a sample image
    import sys
    if len(sys.argv) > 1:
        result = analyze_image_to_dict(sys.argv[1])
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python color_analysis.py <image_path>")
