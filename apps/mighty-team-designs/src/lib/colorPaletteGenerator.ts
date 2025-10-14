// Color Palette Generator for Web UI
// Converts analyzed colors into a complete UI color system

export interface ColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  accent: string;
  neutral: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  shadow: string;
  gradients: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  interactive: {
    primary: {
      hover: string;
      active: string;
      disabled: string;
    };
    secondary: {
      hover: string;
      active: string;
      disabled: string;
    };
    success: {
      hover: string;
      active: string;
      disabled: string;
    };
    warning: {
      hover: string;
      active: string;
      disabled: string;
    };
    error: {
      hover: string;
      active: string;
      disabled: string;
    };
  };
  // Enhanced state information using OKLCH
  states: {
    primary: ColorStates;
    secondary: ColorStates;
    success: ColorStates;
    warning: ColorStates;
    error: ColorStates;
    info: ColorStates;
    accent: ColorStates;
  };
  // Advanced gradient recipes
  gradientRecipes: {
    primary: GradientRecipe[];
    secondary: GradientRecipe[];
    accent: GradientRecipe[];
  };
  // Theme information
  theme: 'light' | 'dark';
  isDarkTheme: boolean;
}

export interface ColorAnalysis {
  // Dominant palette (top 5-8 colors)
  dominantPalette: DominantColor[];
  
  // Overall image stats
  totalPixels: number;
  uniqueColors: number;
  hasTransparency: boolean;
  
  // Perceptual analysis
  averageLightness: number;
  averageChroma: number;
  colorTemperature: 'warm' | 'cool' | 'neutral';
  
  // Contrast analysis
  contrastRatios: {
    white: number;
    black: number;
    maxInternal: number;
    minInternal: number;
  };
  
  // Role candidates
  roleCandidates: {
    dominant: string[];
    background: string[];
    accent: string[];
    text: string[];
  };
  
  // Systematic color selection following best practices
  systematicSelection: {
    baseColor: string;           // Primary brand color
    complementaryColor: string;  // Opposite on color wheel
    neutralColors: string[];     // Grays, whites, blacks
    colorHierarchy: {
      primary: string;    // 60% - backgrounds, large areas
      secondary: string;  // 30% - headers, subheaders
      accent: string;     // 10% - buttons, CTAs
    };
    harmonyValidation: {
      complementary: boolean;
      analogous: boolean;
      triadic: boolean;
      harmonyScore: number;
    };
    accessibilityScore: {
      aa: boolean;
      aaa: boolean;
      contrastRatio: number;
      overallScore: number;
    };
  };
}

export interface DominantColor {
  hex: string;
  oklch: { L: number; C: number; h: number };
  
  // Proportions
  percentage: number;
  pixelCount: number;
  
  // Perceptual stats
  lightness: number; // 0-1
  chroma: number; // 0-0.4 (practical range)
  hue: number; // 0-360
  
  // Contrast scores
  contrastWhite: number;
  contrastBlack: number;
  
  // Role suitability scores (0-1)
  roleScores: {
    dominant: number;
    background: number;
    accent: number;
    text: number;
  };
  
  // Color relationships
  complementary?: string;
  analogous?: string[];
  triadic?: string[];
  
  // Samples from color grouping
  samples?: string[];
}

export interface AnalyzedColor {
  type: string;
  hex: string;
  percentage: number;
  count: number;
  samples?: string[]; // Individual color samples from the group
  lightness: number; // 0-100 (HSL lightness)
  brightness: number; // 0-255 (perceived brightness)
  saturation: number; // 0-100 (HSL saturation)
  complementary?: string; // Complementary color hex
  analogous?: string[]; // Analogous colors
  triadic?: string[]; // Triadic colors
  oklch?: { L: number; C: number; h: number }; // OKLCH values for perceptual manipulation
}

export interface ColorStates {
  base: string;
  hover: string;
  pressed: string;
  focus: string;
  selected: string;
  disabled: string;
  outline: string;
  textOnFill: string;
}

export interface GradientRecipe {
  type: 'sheen' | 'analogous' | 'depth' | 'palette-safe';
  start: string;
  end: string;
  direction: string;
  description: string;
}

export interface UIPaletteOptions {
  theme?: 'light' | 'dark' | 'auto';
  accessibility?: 'high' | 'medium' | 'low';
  brandColors?: string[]; // Colors to prioritize for primary/secondary
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// Helper function to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] | null {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Color type to UI role mapping
const colorTypeToUIRole: Record<string, string[]> = {
  'Red': ['primary', 'error'],
  'Orange': ['primary', 'warning'],
  'Yellow': ['warning'],
  'Green': ['success'],
  'Lime': ['success'],
  'Cyan': ['info'],
  'Teal': ['info'],
  'Blue': ['primary', 'info'],
  'Purple': ['accent'],
  'Magenta': ['accent'],
  'Pink': ['accent'],
  'Gray': ['neutral'],
  'Grayish-Blue': ['neutral'],
  'Brown': ['neutral'],
  'Dark': ['text', 'surface'],
  'Light': ['background', 'surface'],
  'White': ['background'],
  'Black': ['text']
};

// Create a default palette when no colors are available
function createDefaultPalette(): ColorPalette {
  return {
    primary: '#000000',
    secondary: '#666666',
    accent: '#3B82F6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: {
      primary: '#000000',
      secondary: '#666666',
      disabled: '#999999'
    },
    border: '#E5E5E5',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#F5F5F5',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradients: {
      primary: 'linear-gradient(135deg, #000000, #3B82F6)',
      secondary: 'linear-gradient(135deg, #666666, #F5F5F5)',
      background: 'linear-gradient(135deg, #FFFFFF, #F5F5F5)',
      surface: 'linear-gradient(135deg, #F5F5F5, #FFFFFF)'
    },
    interactive: {
      primary: {
        hover: '#333333',
        active: '#000000',
        disabled: 'rgba(0, 0, 0, 0.5)'
      },
      secondary: {
        hover: '#555555',
        active: '#444444',
        disabled: 'rgba(102, 102, 102, 0.5)'
      },
      success: {
        hover: '#059669',
        active: '#047857',
        disabled: 'rgba(16, 185, 129, 0.5)'
      },
      warning: {
        hover: '#D97706',
        active: '#B45309',
        disabled: 'rgba(245, 158, 11, 0.5)'
      },
      error: {
        hover: '#DC2626',
        active: '#B91C1C',
        disabled: 'rgba(239, 68, 68, 0.5)'
      }
    },
    states: {
      primary: {
        base: '#000000',
        hover: '#333333',
        pressed: '#000000',
        focus: '#000000',
        selected: '#000000',
        disabled: 'rgba(0, 0, 0, 0.5)',
        outline: '#000000',
        textOnFill: '#FFFFFF'
      },
      secondary: {
        base: '#666666',
        hover: '#555555',
        pressed: '#444444',
        focus: '#666666',
        selected: '#666666',
        disabled: 'rgba(102, 102, 102, 0.5)',
        outline: '#666666',
        textOnFill: '#FFFFFF'
      },
      success: {
        base: '#10B981',
        hover: '#059669',
        pressed: '#047857',
        focus: '#10B981',
        selected: '#10B981',
        disabled: 'rgba(16, 185, 129, 0.5)',
        outline: '#10B981',
        textOnFill: '#FFFFFF'
      },
      warning: {
        base: '#F59E0B',
        hover: '#D97706',
        pressed: '#B45309',
        focus: '#F59E0B',
        selected: '#F59E0B',
        disabled: 'rgba(245, 158, 11, 0.5)',
        outline: '#F59E0B',
        textOnFill: '#FFFFFF'
      },
      error: {
        base: '#EF4444',
        hover: '#DC2626',
        pressed: '#B91C1C',
        focus: '#EF4444',
        selected: '#EF4444',
        disabled: 'rgba(239, 68, 68, 0.5)',
        outline: '#EF4444',
        textOnFill: '#FFFFFF'
      },
      info: {
        base: '#3B82F6',
        hover: '#2563EB',
        pressed: '#1D4ED8',
        focus: '#3B82F6',
        selected: '#3B82F6',
        disabled: 'rgba(59, 130, 246, 0.5)',
        outline: '#3B82F6',
        textOnFill: '#FFFFFF'
      },
      accent: {
        base: '#3B82F6',
        hover: '#2563EB',
        pressed: '#1D4ED8',
        focus: '#3B82F6',
        selected: '#3B82F6',
        disabled: 'rgba(59, 130, 246, 0.5)',
        outline: '#3B82F6',
        textOnFill: '#FFFFFF'
      }
    },
    gradientRecipes: {
      primary: [
        {
          type: 'sheen',
          start: '#000000',
          end: '#333333',
          direction: '135deg',
          description: 'Subtle sheen effect for primary elements'
        }
      ],
      secondary: [
        {
          type: 'analogous',
          start: '#666666',
          end: '#F5F5F5',
          direction: '90deg',
          description: 'Analogous color harmony'
        }
      ],
      accent: [
        {
          type: 'depth',
          start: '#FFFFFF',
          end: '#F5F5F5',
          direction: '180deg',
          description: 'Depth and dimension for surfaces'
        }
      ]
    },
    theme: 'light',
    isDarkTheme: false
  };
}

// Interface for color combination suggestions
export interface ColorCombination {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  reasoning: string;
}

// Generate smart color combination suggestions
export function generateColorSuggestions(analyzedColors: AnalyzedColor[]): ColorCombination[] {
  console.log('🎨 generateColorSuggestions: Input analyzedColors:', analyzedColors);
  if (analyzedColors.length === 0) {
    console.log('🎨 generateColorSuggestions: No colors, returning empty array');
    return [];
  }

  // Sort colors by percentage (most dominant first)
  const sortedColors = [...analyzedColors].sort((a, b) => b.percentage - a.percentage);
  
  // Find the most saturated (vibrant) color
  const mostSaturated = sortedColors.reduce((prev, current) => 
    current.saturation > prev.saturation ? current : prev
  );
  
  // Find the lightest color for backgrounds
  const lightest = sortedColors.reduce((prev, current) => 
    current.lightness > prev.lightness ? current : prev
  );
  
  // Find the darkest color for text
  const darkest = sortedColors.reduce((prev, current) => 
    current.lightness < prev.lightness ? current : prev
  );

  // Generate neutral colors - always create true neutral grays
  const generateNeutrals = (baseColor: string) => {
    console.log('🎨 generateNeutrals: Generating neutrals for base color:', baseColor);
    const rgb = hexToRgb(baseColor);
    if (!rgb) {
      console.log('🎨 generateNeutrals: Failed to convert hex to RGB, using defaults');
      return { light: '#F8F9FA', medium: '#E9ECEF', dark: '#6C757D' };
    }
    
    // Convert to HSL to work with saturation
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    if (!hsl) {
      console.log('🎨 generateNeutrals: Failed to convert RGB to HSL, using defaults');
      return { light: '#F8F9FA', medium: '#E9ECEF', dark: '#6C757D' };
    }
    
    console.log('🎨 generateNeutrals: RGB:', rgb, 'HSL:', hsl);
    
    // Create true neutral grays by using the base color's lightness but setting saturation to 0
    const lightness = hsl[2] / 100;
    
    // Always create proper light background neutrals (saturation = 0)
    const result = {
      light: hslToHex(0, 0, 96),   // Very light gray for backgrounds (#F5F5F5)
      medium: hslToHex(0, 0, 90),  // Light gray for surfaces (#E6E6E6)
      dark: hslToHex(0, 0, 20)     // Dark gray for text (#333333)
    };
    console.log('🎨 generateNeutrals: Generated proper light background neutrals:', result);
    return result;
  };

  // Check if we have good neutrals, if not generate them
  const hasGoodNeutrals = sortedColors.some(color => 
    color.type?.toLowerCase().includes('gray') || 
    color.type?.toLowerCase().includes('neutral') ||
    color.saturation < 20 // Low saturation = neutral
  );

  console.log('🎨 generateColorSuggestions: hasGoodNeutrals:', hasGoodNeutrals);
  console.log('🎨 generateColorSuggestions: lightest:', lightest);
  console.log('🎨 generateColorSuggestions: darkest:', darkest);

  // Always generate true neutral grays for background/surface, regardless of existing colors
  const neutrals = generateNeutrals(sortedColors[0].hex);

  console.log('🎨 generateColorSuggestions: Generated neutrals:', neutrals);

  const suggestions: ColorCombination[] = [];

  // Suggestion 1: Monochromatic (variations of dominant color)
  if (sortedColors.length >= 1) {
    const primary = sortedColors[0].hex;
    const background = neutrals.light;
    const surface = neutrals.medium;
    const text = neutrals.dark;
    
    suggestions.push({
      id: 'monochromatic',
      name: 'Monochromatic',
      description: 'Clean, professional look using variations of your dominant color',
      primary,
      secondary: adjustBrightness(primary, 15),
      accent: adjustBrightness(primary, -15),
      background,
      surface,
      text,
      reasoning: `Uses ${primary} as the base with generated neutral grays for backgrounds`
    });
  }

  // Suggestion 2: High Contrast (if we have good contrast colors)
  if (sortedColors.length >= 2) {
    const primary = mostSaturated.hex;
    const secondary = sortedColors[1].hex;
    
    // For high contrast, use dark background with light text, or light background with dark text
    const isPrimaryLight = getLightness(primary) > 0.5;
    const background = isPrimaryLight ? '#1A1A1A' : neutrals.light;  // Dark or light background
    const surface = isPrimaryLight ? '#2D2D2D' : neutrals.medium;    // Dark or light surface
    const text = isPrimaryLight ? '#FFFFFF' : neutrals.dark;         // Light or dark text
    
    suggestions.push({
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Bold, attention-grabbing design with strong color contrast',
      primary,
      secondary,
      accent: adjustBrightness(primary, -20),
      background,
      surface,
      text,
      reasoning: `Uses ${primary} with ${isPrimaryLight ? 'dark' : 'light'} background for maximum contrast`
    });
  }

  // Suggestion 3: Balanced (if we have 3+ colors)
  if (sortedColors.length >= 3) {
    const primary = sortedColors[0].hex;
    const secondary = sortedColors[1].hex;
    const accent = sortedColors[2].hex;
    const background = neutrals.light;
    const surface = neutrals.medium;
    const text = neutrals.dark;
    
    suggestions.push({
      id: 'balanced',
      name: 'Balanced',
      description: 'Harmonious blend of your top 3 analyzed colors',
      primary,
      secondary,
      accent,
      background,
      surface,
      text,
      reasoning: `Combines your top 3 colors: ${primary}, ${secondary}, ${accent} with neutral backgrounds`
    });
  }

  // Suggestion 4: Neutral-focused (if we don't have good neutrals)
  if (!hasGoodNeutrals && sortedColors.length >= 1) {
    const primary = sortedColors[0].hex;
    const background = neutrals.light;
    const surface = neutrals.medium;
    const text = neutrals.dark;
    
    suggestions.push({
      id: 'neutral-focused',
      name: 'Neutral-Focused',
      description: 'Professional design with generated neutral grays and one accent color',
      primary,
      secondary: neutrals.dark,
      accent: primary,
      background,
      surface,
      text,
      reasoning: `Generated neutral grays based on ${primary} with ${primary} as accent color`
    });
  }

  // Suggestion 4: Light & Airy (ultra-light neutrals)
  if (sortedColors.length >= 1) {
    const ultraLightNeutrals = {
      light: hslToHex(0, 0, 98),   // Ultra-light gray (#FAFAFA)
      medium: hslToHex(0, 0, 92),  // Very light gray (#EBEBEB)
      dark: hslToHex(0, 0, 15)     // Very dark gray (#262626)
    };
    
    suggestions.push({
      id: 'light-airy',
      name: 'Light & Airy',
      description: 'Clean, minimal design with ultra-light neutral backgrounds',
      primary: sortedColors[0].hex,
      secondary: ultraLightNeutrals.dark,
      accent: sortedColors[1]?.hex || sortedColors[0].hex,
      background: ultraLightNeutrals.light,
      surface: ultraLightNeutrals.medium,
      text: ultraLightNeutrals.dark,
      reasoning: `Ultra-light neutral backgrounds with ${sortedColors[0].hex} as primary accent`
    });
  }

  console.log('🎨 generateColorSuggestions: Generated suggestions:', suggestions);
  return suggestions;
}

// Generate palette from already analyzed colors (synchronous)
export function generatePaletteFromColors(analyzedColors: AnalyzedColor[], options: UIPaletteOptions = {}): ColorPalette {
  const { theme = 'light', accessibility = 'medium', brandColors = [] } = options;
  
  if (analyzedColors.length === 0) {
    return createDefaultPalette();
  }

  // Sort colors by percentage (most dominant first)
  const sortedColors = [...analyzedColors].sort((a, b) => b.percentage - a.percentage);
  
  // Extract color values
  const primaryColor = sortedColors[0]?.hex || '#000000';
  const secondaryColor = sortedColors[1]?.hex || sortedColors[0]?.hex || '#000000';
  const accentColor = sortedColors[2]?.hex || sortedColors[1]?.hex || sortedColors[0]?.hex || '#000000';
  const backgroundColor = sortedColors.find(c => c.type?.toLowerCase().includes('white') || c.type?.toLowerCase().includes('light'))?.hex || '#FFFFFF';
  const surfaceColor = sortedColors.find(c => c.type?.toLowerCase().includes('gray') || c.type?.toLowerCase().includes('neutral'))?.hex || sortedColors[1]?.hex || '#F5F5F5';

  // Create the palette
  const palette: ColorPalette = {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    background: backgroundColor,
    surface: surfaceColor,
    text: {
      primary: primaryColor,
      secondary: secondaryColor,
      disabled: '#999999'
    },
    border: surfaceColor,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral: surfaceColor,
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradients: {
      primary: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
      secondary: `linear-gradient(135deg, ${secondaryColor}, ${surfaceColor})`,
      background: `linear-gradient(135deg, ${backgroundColor}, ${surfaceColor})`,
      surface: `linear-gradient(135deg, ${surfaceColor}, ${backgroundColor})`
    },
    interactive: {
      primary: {
        hover: adjustBrightness(primaryColor, -15),
        active: adjustBrightness(primaryColor, -25),
        disabled: adjustOpacity(primaryColor, 0.5)
      },
      secondary: {
        hover: adjustBrightness(secondaryColor, -15),
        active: adjustBrightness(secondaryColor, -25),
        disabled: adjustOpacity(secondaryColor, 0.5)
      },
      success: {
        hover: adjustBrightness('#10B981', -15),
        active: adjustBrightness('#10B981', -25),
        disabled: adjustOpacity('#10B981', 0.5)
      },
      warning: {
        hover: adjustBrightness('#F59E0B', -15),
        active: adjustBrightness('#F59E0B', -25),
        disabled: adjustOpacity('#F59E0B', 0.5)
      },
      error: {
        hover: adjustBrightness('#EF4444', -15),
        active: adjustBrightness('#EF4444', -25),
        disabled: adjustOpacity('#EF4444', 0.5)
      }
    },
    states: {
      primary: {
        base: primaryColor,
        hover: adjustBrightness(primaryColor, -15),
        pressed: adjustBrightness(primaryColor, -25),
        focus: primaryColor,
        selected: primaryColor,
        disabled: adjustOpacity(primaryColor, 0.5),
        outline: primaryColor,
        textOnFill: '#FFFFFF'
      },
      secondary: {
        base: secondaryColor,
        hover: adjustBrightness(secondaryColor, -15),
        pressed: adjustBrightness(secondaryColor, -25),
        focus: secondaryColor,
        selected: secondaryColor,
        disabled: adjustOpacity(secondaryColor, 0.5),
        outline: secondaryColor,
        textOnFill: '#FFFFFF'
      },
      success: {
        base: '#10B981',
        hover: adjustBrightness('#10B981', -15),
        pressed: adjustBrightness('#10B981', -25),
        focus: '#10B981',
        selected: '#10B981',
        disabled: adjustOpacity('#10B981', 0.5),
        outline: '#10B981',
        textOnFill: '#FFFFFF'
      },
      warning: {
        base: '#F59E0B',
        hover: adjustBrightness('#F59E0B', -15),
        pressed: adjustBrightness('#F59E0B', -25),
        focus: '#F59E0B',
        selected: '#F59E0B',
        disabled: adjustOpacity('#F59E0B', 0.5),
        outline: '#F59E0B',
        textOnFill: '#FFFFFF'
      },
      error: {
        base: '#EF4444',
        hover: adjustBrightness('#EF4444', -15),
        pressed: adjustBrightness('#EF4444', -25),
        focus: '#EF4444',
        selected: '#EF4444',
        disabled: adjustOpacity('#EF4444', 0.5),
        outline: '#EF4444',
        textOnFill: '#FFFFFF'
      },
      info: {
        base: '#3B82F6',
        hover: adjustBrightness('#3B82F6', -15),
        pressed: adjustBrightness('#3B82F6', -25),
        focus: '#3B82F6',
        selected: '#3B82F6',
        disabled: adjustOpacity('#3B82F6', 0.5),
        outline: '#3B82F6',
        textOnFill: '#FFFFFF'
      },
      accent: {
        base: accentColor,
        hover: adjustBrightness(accentColor, -15),
        pressed: adjustBrightness(accentColor, -25),
        focus: accentColor,
        selected: accentColor,
        disabled: adjustOpacity(accentColor, 0.5),
        outline: accentColor,
        textOnFill: '#FFFFFF'
      }
    },
    gradientRecipes: {
      primary: [
        {
          type: 'sheen',
          start: primaryColor,
          end: adjustBrightness(primaryColor, 20),
          direction: '135deg',
          description: 'Subtle sheen effect for primary elements'
        }
      ],
      secondary: [
        {
          type: 'analogous',
          start: secondaryColor,
          end: surfaceColor,
          direction: '90deg',
          description: 'Analogous color harmony'
        }
      ],
      accent: [
        {
          type: 'depth',
          start: backgroundColor,
          end: surfaceColor,
          direction: '180deg',
          description: 'Depth and dimension for surfaces'
        }
      ]
    },
    theme: theme as 'light' | 'dark',
    isDarkTheme: theme === 'dark'
  };

  return palette;
}

// Color palette generation using V2 API
export async function generateUIPalette(imageUrl: string): Promise<ColorPalette> {
  try {
    console.log('🎨 Starting V2 UI palette generation for:', imageUrl);
    
    // Call the new v2 color analysis API
    const response = await fetch('/api/color-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        max_colors: 15
      })
    });
    
    if (!response.ok) {
      throw new Error(`Color analysis failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Color analysis failed');
    }
    
    console.log('🎨 V2 Color analysis complete:', result.data);
    
    // Use the v2 systematic analysis results
    const roles = result.data.roles;
    const colors = result.data.colors || [];
    
    // Create a basic color palette using the v2 results
    const palette: ColorPalette = {
      primary: roles?.primary?.hex || colors[0]?.hex || '#000000',
      secondary: roles?.secondary?.hex || roles?.surface?.hex || colors[1]?.hex || colors[0]?.hex || '#000000',
      accent: roles?.accent?.hex || colors[2]?.hex || colors[0]?.hex || '#000000',
      background: roles?.background?.hex || colors[0]?.hex || '#FFFFFF',
      surface: roles?.surface?.hex || roles?.secondary?.hex || colors[1]?.hex || '#F5F5F5',
      text: {
        primary: roles?.primary?.hex || colors[0]?.hex || '#000000',
        secondary: roles?.secondary?.hex || roles?.surface?.hex || colors[1]?.hex || '#666666',
        disabled: '#999999'
      },
      border: roles?.surface?.hex || roles?.secondary?.hex || colors[1]?.hex || '#E5E5E5',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      neutral: roles?.surface?.hex || colors[1]?.hex || '#F5F5F5',
      shadow: 'rgba(0, 0, 0, 0.1)',
      gradients: {
        primary: `linear-gradient(135deg, ${roles?.primary?.hex || colors[0]?.hex || '#000000'}, ${roles?.accent?.hex || colors[2]?.hex || '#000000'})`,
        secondary: `linear-gradient(135deg, ${roles?.secondary?.hex || colors[1]?.hex || '#000000'}, ${roles?.surface?.hex || colors[1]?.hex || '#F5F5F5'})`,
        background: `linear-gradient(135deg, ${roles?.background?.hex || colors[0]?.hex || '#FFFFFF'}, ${roles?.surface?.hex || colors[1]?.hex || '#F5F5F5'})`,
        surface: `linear-gradient(135deg, ${roles?.surface?.hex || colors[1]?.hex || '#F5F5F5'}, ${roles?.background?.hex || colors[0]?.hex || '#FFFFFF'})`
      },
      interactive: {
        primary: {
          hover: adjustBrightness(roles?.primary?.hex || colors[0]?.hex || '#000000', -15),
          active: adjustBrightness(roles?.primary?.hex || colors[0]?.hex || '#000000', -25),
          disabled: adjustOpacity(roles?.primary?.hex || colors[0]?.hex || '#000000', 0.5)
        },
        secondary: {
          hover: adjustBrightness(roles?.secondary?.hex || colors[1]?.hex || '#000000', -15),
          active: adjustBrightness(roles?.secondary?.hex || colors[1]?.hex || '#000000', -25),
          disabled: adjustOpacity(roles?.secondary?.hex || colors[1]?.hex || '#000000', 0.5)
        },
        success: {
          hover: adjustBrightness('#10B981', -15),
          active: adjustBrightness('#10B981', -25),
          disabled: adjustOpacity('#10B981', 0.5)
        },
        warning: {
          hover: adjustBrightness('#F59E0B', -15),
          active: adjustBrightness('#F59E0B', -25),
          disabled: adjustOpacity('#F59E0B', 0.5)
        },
        error: {
          hover: adjustBrightness('#EF4444', -15),
          active: adjustBrightness('#EF4444', -25),
          disabled: adjustOpacity('#EF4444', 0.5)
        }
      },
      states: {
        primary: {
          base: roles?.primary?.hex || colors[0]?.hex || '#000000',
          hover: adjustBrightness(roles?.primary?.hex || colors[0]?.hex || '#000000', -15),
          pressed: adjustBrightness(roles?.primary?.hex || colors[0]?.hex || '#000000', -25),
          focus: roles?.primary?.hex || colors[0]?.hex || '#000000',
          selected: roles?.primary?.hex || colors[0]?.hex || '#000000',
          disabled: adjustOpacity(roles?.primary?.hex || colors[0]?.hex || '#000000', 0.5),
          outline: roles?.primary?.hex || colors[0]?.hex || '#000000',
          textOnFill: '#FFFFFF'
        },
        secondary: {
          base: roles?.secondary?.hex || colors[1]?.hex || '#000000',
          hover: adjustBrightness(roles?.secondary?.hex || colors[1]?.hex || '#000000', -15),
          pressed: adjustBrightness(roles?.secondary?.hex || colors[1]?.hex || '#000000', -25),
          focus: roles?.secondary?.hex || colors[1]?.hex || '#000000',
          selected: roles?.secondary?.hex || colors[1]?.hex || '#000000',
          disabled: adjustOpacity(roles?.secondary?.hex || colors[1]?.hex || '#000000', 0.5),
          outline: roles?.secondary?.hex || colors[1]?.hex || '#000000',
          textOnFill: '#FFFFFF'
        },
        success: {
          base: '#10B981',
          hover: adjustBrightness('#10B981', -15),
          pressed: adjustBrightness('#10B981', -25),
          focus: '#10B981',
          selected: '#10B981',
          disabled: adjustOpacity('#10B981', 0.5),
          outline: '#10B981',
          textOnFill: '#FFFFFF'
        },
        warning: {
          base: '#F59E0B',
          hover: adjustBrightness('#F59E0B', -15),
          pressed: adjustBrightness('#F59E0B', -25),
          focus: '#F59E0B',
          selected: '#F59E0B',
          disabled: adjustOpacity('#F59E0B', 0.5),
          outline: '#F59E0B',
          textOnFill: '#FFFFFF'
        },
        error: {
          base: '#EF4444',
          hover: adjustBrightness('#EF4444', -15),
          pressed: adjustBrightness('#EF4444', -25),
          focus: '#EF4444',
          selected: '#EF4444',
          disabled: adjustOpacity('#EF4444', 0.5),
          outline: '#EF4444',
          textOnFill: '#FFFFFF'
        },
        info: {
          base: '#3B82F6',
          hover: adjustBrightness('#3B82F6', -15),
          pressed: adjustBrightness('#3B82F6', -25),
          focus: '#3B82F6',
          selected: '#3B82F6',
          disabled: adjustOpacity('#3B82F6', 0.5),
          outline: '#3B82F6',
          textOnFill: '#FFFFFF'
        },
        accent: {
          base: roles?.accent?.hex || colors[2]?.hex || '#000000',
          hover: adjustBrightness(roles?.accent?.hex || colors[2]?.hex || '#000000', -15),
          pressed: adjustBrightness(roles?.accent?.hex || colors[2]?.hex || '#000000', -25),
          focus: roles?.accent?.hex || colors[2]?.hex || '#000000',
          selected: roles?.accent?.hex || colors[2]?.hex || '#000000',
          disabled: adjustOpacity(roles?.accent?.hex || colors[2]?.hex || '#000000', 0.5),
          outline: roles?.accent?.hex || colors[2]?.hex || '#000000',
          textOnFill: '#FFFFFF'
        }
      },
      gradientRecipes: {
        primary: [
          {
            type: 'sheen',
            start: roles?.primary?.hex || colors[0]?.hex || '#000000',
            end: adjustBrightness(roles?.primary?.hex || colors[0]?.hex || '#000000', 20),
            direction: '135deg',
            description: 'Subtle sheen effect for primary elements'
          }
        ],
        secondary: [
          {
            type: 'analogous',
            start: roles?.secondary?.hex || colors[1]?.hex || '#000000',
            end: roles?.surface?.hex || colors[1]?.hex || '#F5F5F5',
            direction: '90deg',
            description: 'Analogous color harmony'
          }
        ],
        accent: [
          {
            type: 'depth',
            start: roles?.background?.hex || colors[0]?.hex || '#FFFFFF',
            end: roles?.surface?.hex || colors[1]?.hex || '#F5F5F5',
            direction: '180deg',
            description: 'Depth and dimension for surfaces'
          }
        ]
      },
      theme: 'light',
      isDarkTheme: false
    };
    
    console.log('🎨 Generated V2 UI palette:', palette);
    return palette;
    
  } catch (error) {
    console.error('❌ Error generating V2 UI palette:', error);
    throw error;
  }
}

// Generate CSS custom properties for the palette
export function generateCSSVariables(palette: ColorPalette): string {
  return `
:root {
  /* Primary Colors */
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  
  /* Semantic Colors */
  --color-success: ${palette.success};
  --color-warning: ${palette.warning};
  --color-error: ${palette.error};
  --color-info: ${palette.info};
  --color-accent: ${palette.accent};
  
  /* Background & Surface */
  --color-background: ${palette.background};
  --color-surface: ${palette.surface};
  
  /* Text Colors */
  --color-text-primary: ${palette.text.primary};
  --color-text-secondary: ${palette.text.secondary};
  --color-text-disabled: ${palette.text.disabled};
  
  /* Border & Shadow */
  --color-border: ${palette.border};
  --color-shadow: ${palette.shadow};
  
  /* Gradients */
  --gradient-primary: ${palette.gradients.primary};
  --gradient-secondary: ${palette.gradients.secondary};
  --gradient-background: ${palette.gradients.background};
  --gradient-surface: ${palette.gradients.surface};
}

/* Interactive States */
.interactive-primary {
  background-color: ${palette.primary};
  color: ${palette.states.primary.textOnFill};
}

.interactive-primary:hover {
  background-color: ${palette.states.primary.hover};
}

.interactive-primary:active {
  background-color: ${palette.states.primary.pressed};
}

.interactive-primary:disabled {
  background-color: ${palette.states.primary.disabled};
  color: ${palette.states.primary.disabled};
}

.interactive-secondary {
  background-color: ${palette.secondary};
  color: ${palette.states.secondary.textOnFill};
}

.interactive-secondary:hover {
  background-color: ${palette.states.secondary.hover};
}

.interactive-secondary:active {
  background-color: ${palette.states.secondary.pressed};
}

.interactive-secondary:disabled {
  background-color: ${palette.states.secondary.disabled};
  color: ${palette.states.secondary.disabled};
}
`;
}

// Generate Tailwind config for the palette
export function generateTailwindConfig(palette: ColorPalette): object {
  return {
    theme: {
      extend: {
        colors: {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent,
          background: palette.background,
          surface: palette.surface,
          success: palette.success,
          warning: palette.warning,
          error: palette.error,
          info: palette.info,
          text: {
            primary: palette.text.primary,
            secondary: palette.text.secondary,
            disabled: palette.text.disabled
          },
          border: palette.border,
          shadow: palette.shadow
        },
        backgroundImage: {
          'gradient-primary': palette.gradients.primary,
          'gradient-secondary': palette.gradients.secondary,
          'gradient-background': palette.gradients.background,
          'gradient-surface': palette.gradients.surface
        }
      }
    }
  };
}

// Helper functions for color manipulation
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function adjustOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Enhanced color analysis function
export function analyzeImageColors(analyzedColors: AnalyzedColor[]): ColorAnalysis {
  // This is a simplified version - in a real implementation, this would be more sophisticated
  const dominantPalette = analyzedColors.slice(0, 8).map(color => ({
    hex: color.hex,
    oklch: { L: 0.5, C: 0.1, h: 180 }, // Simplified OKLCH values
    percentage: color.percentage,
    pixelCount: color.count,
    lightness: color.lightness / 100,
    chroma: 0.1,
    hue: 180,
    contrastWhite: 4.5,
    contrastBlack: 4.5,
    roleScores: {
      dominant: 0.8,
      background: 0.6,
      accent: 0.7,
      text: 0.5
    },
    samples: color.samples || [color.hex]
  }));

  return {
    dominantPalette,
    totalPixels: analyzedColors.reduce((sum, color) => sum + color.count, 0),
    uniqueColors: analyzedColors.length,
    hasTransparency: false,
    averageLightness: analyzedColors.reduce((sum, color) => sum + color.lightness, 0) / analyzedColors.length / 100,
    averageChroma: 0.1,
    colorTemperature: 'neutral',
    contrastRatios: {
      white: 4.5,
      black: 4.5,
      maxInternal: 7.0,
      minInternal: 3.0
    },
    roleCandidates: {
      dominant: analyzedColors.slice(0, 3).map(c => c.hex),
      background: analyzedColors.filter(c => c.lightness > 70).map(c => c.hex),
      accent: analyzedColors.filter(c => c.lightness < 70 && c.lightness > 30).map(c => c.hex),
      text: analyzedColors.filter(c => c.lightness < 30).map(c => c.hex)
    },
    systematicSelection: {
      baseColor: analyzedColors[0]?.hex || '#000000',
      complementaryColor: '#000000',
      neutralColors: ['#FFFFFF', '#F5F5F5', '#E5E5E5'],
      colorHierarchy: {
        primary: analyzedColors[0]?.hex || '#000000',
        secondary: analyzedColors[1]?.hex || '#000000',
        accent: analyzedColors[2]?.hex || '#000000'
      },
      harmonyValidation: {
        complementary: true,
        analogous: true,
        triadic: false,
        harmonyScore: 0.8
      },
      accessibilityScore: {
        aa: true,
        aaa: false,
        contrastRatio: 4.5,
        overallScore: 0.8
      }
    }
  };
}

// Generate interactive states for colors
export function generateInteractiveStates(colors: {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
}): {
  primary: ColorStates;
  secondary: ColorStates;
  success: ColorStates;
  warning: ColorStates;
  error: ColorStates;
} {
  return {
    primary: {
      base: colors.primary,
      hover: adjustBrightness(colors.primary, -15),
      pressed: adjustBrightness(colors.primary, -25),
      focus: colors.primary,
      selected: colors.primary,
      disabled: adjustOpacity(colors.primary, 0.5),
      outline: colors.primary,
      textOnFill: '#FFFFFF'
    },
    secondary: {
      base: colors.secondary,
      hover: adjustBrightness(colors.secondary, -15),
      pressed: adjustBrightness(colors.secondary, -25),
      focus: colors.secondary,
      selected: colors.secondary,
      disabled: adjustOpacity(colors.secondary, 0.5),
      outline: colors.secondary,
      textOnFill: '#FFFFFF'
    },
    success: {
      base: colors.success,
      hover: adjustBrightness(colors.success, -15),
      pressed: adjustBrightness(colors.success, -25),
      focus: colors.success,
      selected: colors.success,
      disabled: adjustOpacity(colors.success, 0.5),
      outline: colors.success,
      textOnFill: '#FFFFFF'
    },
    warning: {
      base: colors.warning,
      hover: adjustBrightness(colors.warning, -15),
      pressed: adjustBrightness(colors.warning, -25),
      focus: colors.warning,
      selected: colors.warning,
      disabled: adjustOpacity(colors.warning, 0.5),
      outline: colors.warning,
      textOnFill: '#FFFFFF'
    },
    error: {
      base: colors.error,
      hover: adjustBrightness(colors.error, -15),
      pressed: adjustBrightness(colors.error, -25),
      focus: colors.error,
      selected: colors.error,
      disabled: adjustOpacity(colors.error, 0.5),
      outline: colors.error,
      textOnFill: '#FFFFFF'
    }
  };
}

// Helper function to get lightness of a color (0-1)
export function getLightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  
  const [r, g, b] = rgb;
  // Convert to HSL and return lightness
  const hsl = rgbToHsl(r, g, b);
  if (!hsl) return 0.5;
  
  return hsl[2] / 100; // Convert from 0-100 to 0-1
}
