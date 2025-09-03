# 🎉 Confetti Pack Test Suite

A comprehensive testing environment for the party confetti pack assets, allowing you to experiment with different backgrounds, animations, and effects.

## 📁 Available Test Pages

### 1. **Main Test Page** (`/confetti-test`)
- **Purpose**: Comprehensive testing of all confetti patterns with live controls
- **Features**:
  - Background pattern selection (8 different confetti types)
  - Animation controls (speed, enable/disable)
  - Visual effects (hero glow, gradients)
  - Customization (tile size, background color)
  - Live preview with real-time updates
  - Generated CSS output
  - Asset gallery with thumbnails

### 2. **Individual Tests** (`/confetti-test/individual`)
- **Purpose**: Focused testing of individual confetti patterns
- **Features**:
  - Full-screen pattern previews
  - Detailed pattern information and color palettes
  - Granular animation controls
  - Background opacity and tile size adjustments
  - Pattern-specific customization options

### 3. **Animation Tests** (`/confetti-test/animation`)
- **Purpose**: Testing different animation effects and timing
- **Features**:
  - 6 animation presets (Drift, Bounce, Pulse, Wave, Spiral, Float)
  - Custom easing functions and timing
  - Animation direction and iteration controls
  - Real-time animation preview
  - Generated CSS with keyframes

### 4. **Hero Glow Test** (`/confetti-test/hero-glow`)
- **Purpose**: Testing the hero glow effect and its variations
- **Features**:
  - Glow intensity and color controls
  - Glow size and position adjustments
  - Preset glow configurations
  - Combined testing with confetti patterns

### 5. **Parallax Test** (`/confetti-test/parallax`)
- **Purpose**: Creating multi-layer parallax effects with falling confetti
- **Features**:
  - Multiple confetti layers with different patterns
  - Individual layer controls (size, speed, opacity, offset)
  - Falling animations with fade-out effects
  - Wind effects and directional controls
  - Real-time layer management (add/remove/enable)

## 🎨 Available Confetti Patterns

| Pattern | File | Description | Colors |
|---------|------|-------------|---------|
| **Sprinkles** | `confetti-sprinkles.svg` | Colorful confetti sprinkles | Yellow, Pink, Blue, Magenta |
| **Balloons** | `confetti-balloons.svg` | Floating balloons with strings | Blue, Pink, Green, Yellow |
| **Bubbles & Squiggles** | `confetti-bubbles-squiggles.svg` | Playful bubbles and squiggly lines | Purple, Yellow, Green, Pink |
| **Music & Lightning** | `confetti-music-lightning.svg` | Musical notes and lightning bolts | Yellow, Red, Purple, Cyan |
| **Party Hats** | `confetti-party-hats.svg` | Celebratory party hats | Red, Yellow, Green, Blue |
| **Ribbons & Stars** | `confetti-ribbons-stars.svg` | Elegant ribbons and stars | Pink, Purple, Yellow, Green |
| **Sparkles** | `confetti-sparkles.svg` | Shimmering sparkles and glitter | Yellow, Pink, Blue, Green |
| **Tile Pattern** | `confetti-tile-1.svg` | Geometric tile pattern | Gray scale |

## 🎭 Animation Presets

### Fall
- **Effect**: Falling down with fade out effect
- **Duration**: 25s (default)
- **Timing**: Linear
- **Best for**: Parallax backgrounds, celebration effects

### Drift
- **Effect**: Smooth diagonal drift animation
- **Duration**: 40s (default)
- **Timing**: Linear
- **Best for**: Subtle background movement

### Bounce
- **Effect**: Bouncy up and down movement
- **Duration**: 20s (default)
- **Timing**: Ease-in-out with bounce easing
- **Best for**: Playful, energetic backgrounds

### Pulse
- **Effect**: Gentle pulsing scale effect
- **Duration**: 15s (default)
- **Timing**: Ease-in-out
- **Best for**: Breathing, organic feel

### Wave
- **Effect**: Wave-like horizontal movement
- **Duration**: 25s (default)
- **Timing**: Smooth ease-in-out
- **Best for**: Flowing, liquid-like movement

### Spiral
- **Effect**: Spiral rotation effect
- **Duration**: 30s (default)
- **Timing**: Linear
- **Best for**: Hypnotic, mesmerizing backgrounds

### Float
- **Effect**: Gentle floating up and down
- **Duration**: 18s (default)
- **Timing**: Smooth ease-in-out
- **Best for**: Calm, peaceful backgrounds

## 🎛️ Control Options

### Animation Controls
- **Enable/Disable**: Toggle animation on/off
- **Speed**: Adjust animation duration (5s - 100s)
- **Easing**: Choose from preset easing functions
- **Direction**: Normal, reverse, alternate, alternate-reverse
- **Iteration**: Once, twice, three times, or infinite

### Parallax Controls
- **Multi-Layer Mode**: Enable multiple confetti layers
- **Layer Count**: Set number of layers (2-6)
- **Layer Management**: Add, remove, and configure individual layers
- **Falling Direction**: Up, down, left, or right
- **Wind Effect**: Add horizontal drift to falling motion
- **Fade Out Distance**: Control when confetti starts fading

### Visual Controls
- **Hero Glow**: Toggle the top radial gradient effect
- **Gradients**: Toggle all gradient overlays
- **Tile Size**: Adjust pattern tile size (100px - 500px)
- **Background Color**: Customize the base background color
- **Background Opacity**: Control pattern visibility (10% - 100%)

### Hero Glow Controls
- **Intensity**: Adjust glow opacity (1% - 50%)
- **Color**: Choose any glow color
- **Size**: Control glow radius (20% - 150%)
- **Position**: Adjust vertical position (0% - 100%)

## 🚀 Quick Start

1. **Navigate** to `/confetti-test` to access the main test suite
2. **Select** a confetti pattern from the dropdown or asset gallery
3. **Adjust** animation settings and visual effects
4. **Preview** changes in real-time
5. **Copy** generated CSS for use in your projects

## 💡 Usage Tips

### For Subtle Backgrounds
- Use **Drift** animation with low opacity
- Enable **Hero Glow** for depth
- Choose **Tile Pattern** for minimal visual impact

### For Party Themes
- Use **Bounce** or **Pulse** animations
- Enable all visual effects
- Choose colorful patterns like **Balloons** or **Party Hats**

### For Parallax Effects
- Use **Fall** animation for natural falling motion
- Enable **Multi-Layer Mode** for depth
- Vary layer sizes and speeds for parallax
- Add wind effects for realistic movement

### For Professional Use
- Use **Float** or **Wave** animations
- Disable gradients for cleaner look
- Choose **Ribbons & Stars** or **Tile Pattern**

### Performance Optimization
- Reduce tile size for better performance
- Use longer animation durations for smoother movement
- Disable animations on mobile devices if needed

## 🔧 Technical Details

### Architecture
The confetti test suite uses a **Tailwind-first approach** with CSS custom properties and performance optimizations:

1. **Static CSS File** (`confetti-animations.css`): Contains all keyframes and utility classes with mobile optimizations
2. **Custom Hook** (`useConfettiStyles`): Manages dynamic CSS custom properties with performance monitoring
3. **Performance Monitor** (`PerformanceMonitor.tsx`): Real-time FPS tracking and performance recommendations
4. **Tailwind Classes**: Used for layout, spacing, and basic styling
5. **CSS Custom Properties**: Handle dynamic values (sizes, colors, durations)
6. **Mobile Optimizations**: Adaptive settings based on device capabilities and battery level

### CSS Structure
The system uses CSS custom properties for dynamic values with performance optimizations:
```css
.confetti-bg {
  background-repeat: repeat;
  background-size: var(--tile-size) var(--tile-size);
  background-position: 0 0;
  /* Performance optimizations */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.animate-tile-drift {
  animation: tile-drift var(--animation-duration) linear infinite;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .confetti-bg {
    background-size: calc(var(--tile-size) * 0.8);
  }
}
```

### Key Benefits
- **Performance**: No inline styles or dynamic CSS generation, hardware-accelerated animations
- **Mobile Optimized**: Adaptive settings based on device capabilities and battery level
- **Performance Monitoring**: Real-time FPS tracking and performance recommendations
- **Maintainability**: Clean separation of concerns with centralized CSS
- **Reusability**: CSS classes can be used anywhere in your app
- **Tailwind Integration**: Leverages existing Tailwind infrastructure
- **Debugging**: Easy to inspect and modify styles in DevTools
- **Accessibility**: Respects `prefers-reduced-motion` preferences

### File Organization
- **SVG Assets**: Located in `/public/confetti-pack/`
- **CSS**: Generated dynamically based on user selections
- **Components**: React components with inline styles for real-time updates

### Browser Support
- **Modern Browsers**: Full support for all features
- **CSS Grid**: Used for responsive layouts
- **CSS Custom Properties**: Used for dynamic styling
- **CSS Animations**: Hardware-accelerated where possible

## 🎯 Use Cases

### Game Backgrounds
- Lobby screens with animated confetti
- Victory celebrations with bouncing effects
- Loading screens with subtle movement

### Party Applications
- Event websites with festive backgrounds
- Celebration pages with dynamic elements
- Interactive party planning tools

### UI Enhancement
- Subtle background animations for modern interfaces
- Loading states with engaging visuals
- Success/celebration feedback

## 🤝 Contributing

To add new confetti patterns:
1. Create SVG files in 280×280px format
2. Add them to the `confettiOptions` array
3. Update the pattern selection components
4. Test with different animation presets

To add new animation presets:
1. Define keyframes in the `generateKeyframes` function
2. Add preset to the `animationPresets` array
3. Test with different patterns and settings

## 📱 Responsive Design

All test pages are fully responsive and work on:
- **Desktop**: Full feature set with side-by-side controls
- **Tablet**: Stacked layout with touch-friendly controls
- **Mobile**: Optimized for small screens with simplified controls

## 🔍 Troubleshooting

### Animation Not Working
- Check if animation is enabled
- Verify browser supports CSS animations
- Try reducing tile size for better performance

### Pattern Not Visible
- Check background color contrast
- Verify pattern file exists
- Adjust tile size and opacity

### Performance Issues
- Reduce tile size
- Increase animation duration
- Disable gradients on mobile devices

---

**Happy Testing! 🎉✨**
