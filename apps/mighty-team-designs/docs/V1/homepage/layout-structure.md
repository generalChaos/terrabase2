# Layout Structure - Homepage V1

## 📱 **Mobile-First Layout**

### **Above the Fold (Mobile)**
```
┌─────────────────────────────────────┐
│                                     │
│        [TEAM CHEER LOGO]            │
│         (Hero Example)              │
│                                     │
│    "Professional team logos         │
│     in just 3 simple steps"         │
│                                     │
│      [CREATE NEW TEAM]              │
│        (Primary CTA)                │
│                                     │
└─────────────────────────────────────┘
```

### **Below the Fold (Mobile)**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ LOGO│ │ LOGO│ │ LOGO│ │ LOGO│   │
│  │  1  │ │  2  │ │  3  │ │  4  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ LOGO│ │ LOGO│ │ LOGO│ │ LOGO│   │
│  │  5  │ │  6  │ │  7  │ │  8  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│        [START NOW]                  │
│        (Secondary CTA)              │
│                                     │
└─────────────────────────────────────┘
```

## 📱 **Responsive Breakpoints**

### **Mobile (320px - 639px)**
- **Layout**: Single column, stacked
- **Grid**: 2x4 (2 columns, 4 rows)
- **Spacing**: 16px between elements
- **Touch Targets**: 44px+ height

### **Tablet (640px - 1023px)**
- **Layout**: Centered with more whitespace
- **Grid**: 3x3 (3 columns, 3 rows)
- **Spacing**: 24px between elements
- **Touch Targets**: 48px+ height

### **Desktop (1024px+)**
- **Layout**: Centered with max-width
- **Grid**: 4x2 (4 columns, 2 rows)
- **Spacing**: 32px between elements
- **Hover States**: Interactive elements

## 🎨 **Spacing System**

### **Vertical Spacing**
- **Section Spacing**: 48px between major sections
- **Element Spacing**: 24px between related elements
- **Card Spacing**: 16px between grid items
- **Button Spacing**: 32px from surrounding content

### **Horizontal Spacing**
- **Page Margins**: 16px on mobile, 24px on tablet, 32px on desktop
- **Card Padding**: 24px internal padding
- **Grid Gaps**: 16px on mobile, 24px on tablet, 32px on desktop

### **Typography Spacing**
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Paragraph Spacing**: 16px between paragraphs
- **Heading Spacing**: 24px above, 16px below

## 🎯 **Content Hierarchy**

### **Hero Section**
1. **Logo**: 200px max height, centered
2. **Value Prop**: 24px font size, centered
3. **CTA Button**: 48px height, full-width on mobile

### **Examples Grid**
1. **Grid Title**: "See what teams have created" (optional)
2. **Logo Cards**: 150px x 150px, centered
3. **Secondary CTA**: 48px height, centered

### **Visual Flow**
- **Eye Path**: Logo → Text → CTA → Examples → CTA
- **Progressive Disclosure**: Information revealed as user scrolls
- **Clear Actions**: Two distinct CTAs with different purposes

## 📱 **Mobile-Specific Considerations**

### **Touch Optimization**
- **Button Size**: Minimum 44px height
- **Touch Zones**: 48px minimum between interactive elements
- **Thumb Reach**: Primary CTA in easy thumb reach
- **Swipe Gestures**: Natural mobile interactions

### **Performance**
- **Image Loading**: Lazy load examples below fold
- **Critical Path**: Hero content loads first
- **Bundle Size**: Minimal JavaScript for mobile
- **Network**: Optimized for 3G connections

### **Accessibility**
- **Screen Readers**: Proper heading hierarchy
- **Keyboard Navigation**: Tab through interactive elements
- **Color Contrast**: WCAG AA compliant
- **Focus States**: Clear focus indicators

## 🎨 **Design Tokens**

### **Spacing Scale**
```css
--space-xs: 4px;   /* 0.25rem */
--space-sm: 8px;   /* 0.5rem */
--space-md: 16px;  /* 1rem */
--space-lg: 24px;  /* 1.5rem */
--space-xl: 32px;  /* 2rem */
--space-2xl: 48px; /* 3rem */
```

### **Breakpoints**
```css
--mobile: 320px;
--tablet: 640px;
--desktop: 1024px;
--wide: 1280px;
```

### **Grid System**
```css
--grid-mobile: repeat(2, 1fr);
--grid-tablet: repeat(3, 1fr);
--grid-desktop: repeat(4, 1fr);
--grid-gap: var(--space-md);
```

## 🚀 **Implementation Notes**

### **CSS Grid**
- **Mobile**: `grid-template-columns: repeat(2, 1fr)`
- **Tablet**: `grid-template-columns: repeat(3, 1fr)`
- **Desktop**: `grid-template-columns: repeat(4, 1fr)`

### **Flexbox Fallback**
- **Mobile**: `flex-direction: column`
- **Tablet**: `flex-wrap: wrap`
- **Desktop**: `flex-direction: row`

### **Responsive Images**
- **Hero Logo**: `max-height: 200px`
- **Grid Logos**: `aspect-ratio: 1/1`
- **Loading**: Lazy loading for performance
