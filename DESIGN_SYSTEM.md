# Party Game Design System

## 🎯 **Button Design System**

### **Overview**
A unified button system that provides consistent styling, sizing, and interactions across the entire app. Built with `class-variance-authority` for maintainable variants.

### **Core Principles**
- **Semantic variants** for different action types
- **Consistent sizing scale** from xs to xl
- **Unified hover animations** and interactions
- **Accessible focus states** with proper contrast
- **Responsive design** that works across devices

### **Button Variants**

#### **Primary Actions** (`variant="primary"`)
- **Use case**: Main game buttons, form submissions, primary CTAs
- **Style**: Teal-to-cyan gradient with shadow
- **Example**: Create Room, Join Room, Play Now

#### **Secondary Actions** (`variant="secondary"`)
- **Use case**: Utility buttons, secondary actions
- **Style**: Semi-transparent slate with border
- **Example**: Randomize, Cancel, Back

#### **Game-Specific** (`variant="game"`)
- **Use case**: Dynamic game-colored buttons
- **Style**: Custom gradient colors with shadow
- **Example**: Game-specific "Play Now" buttons

#### **Success Actions** (`variant="success"`)
- **Use case**: Apply, confirm, save actions
- **Style**: Green with shadow
- **Example**: Apply Changes, Save, Confirm

#### **Danger Actions** (`variant="danger"`)
- **Use case**: Delete, remove, destructive actions
- **Style**: Red with shadow
- **Example**: Delete, Remove, Cancel

#### **Info Actions** (`variant="info"`)
- **Use case**: Help, information, learn more
- **Style**: Blue with shadow
- **Example**: Learn More, Help, Info

#### **Warning Actions** (`variant="warning"`)
- **Use case**: Caution, alerts, proceed with care
- **Style**: Yellow with shadow
- **Example**: Proceed with Caution, Warning

#### **Ghost Actions** (`variant="ghost"`)
- **Use case**: Minimal, subtle actions
- **Style**: Transparent with white border
- **Example**: Cancel, Close, Minimal actions

#### **Outline Actions** (`variant="outline"`)
- **Use case**: Bordered, subtle actions
- **Style**: Transparent with slate border
- **Example**: Save Draft, Secondary actions

### **Button Sizes**

#### **Extra Small** (`size="xs"`)
- **Dimensions**: `h-7 px-3 py-1.5`
- **Text**: `text-xs`
- **Use case**: Small utility buttons, inline actions

#### **Small** (`size="sm"`)
- **Dimensions**: `h-8 px-4 py-2`
- **Text**: `text-sm`
- **Use case**: Compact buttons, secondary actions

#### **Medium** (`size="md"`) - **Default**
- **Dimensions**: `h-10 px-6 py-2.5`
- **Text**: `text-base`
- **Use case**: Standard buttons, most common size

#### **Large** (`size="lg"`)
- **Dimensions**: `h-12 px-8 py-3`
- **Text**: `text-lg`
- **Use case**: Primary actions, main CTAs

#### **Extra Large** (`size="xl"`)
- **Dimensions**: `h-14 px-10 py-4`
- **Text**: `text-xl`
- **Use case**: Hero buttons, very prominent actions

#### **Icon** (`size="icon"`)
- **Dimensions**: `h-10 w-10 p-0`
- **Use case**: Icon-only buttons, navigation

### **Button Animations**

#### **Lift** (`animation="lift"`) - **Default**
- **Effect**: Hover lifts button up with shadow
- **Use case**: Most buttons, provides depth

#### **Scale** (`animation="scale"`)
- **Effect**: Hover scales button up/down
- **Use case**: Interactive elements, cards

#### **Glow** (`animation="glow"`)
- **Effect**: Hover increases brightness
- **Use case**: Game buttons, special effects

#### **None** (`animation="none"`)
- **Effect**: No animation
- **Use case**: Disabled states, minimal interactions

### **Usage Examples**

```tsx
import { Button } from '@/components/ui/button';

// Primary action (form submit, main actions)
<Button variant="primary" size="lg">Create Room</Button>

// Secondary action (utility, secondary actions)
<Button variant="secondary" size="md">Randomize</Button>

// Game-specific button (dynamic colors)
<Button variant="game" size="lg" className={`bg-gradient-to-r ${game.color}`}>
  Play Now
</Button>

// Success action (apply, confirm)
<Button variant="success" size="md">Apply Changes</Button>

// Danger action (delete, remove)
<Button variant="danger" size="sm">Delete</Button>

// Info action (help, info)
<Button variant="info" size="md">Learn More</Button>

// Warning action (caution, alert)
<Button variant="warning" size="md">Proceed with Caution</Button>

// Ghost action (minimal, subtle)
<Button variant="ghost" size="md">Cancel</Button>

// Outline action (bordered, subtle)
<Button variant="outline" size="md">Save Draft</Button>
```

### **Migration Guide**

#### **From Old Button Styles**
```tsx
// OLD: Inline styles
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"

// NEW: Unified system
<Button variant="info" size="sm">Button Text</Button>

// OLD: Custom game buttons
className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r ${game.color} hover:brightness-110`}

// NEW: Game variant
<Button variant="game" size="lg" className={`bg-gradient-to-r ${game.color}`}>
  Play Now
</Button>
```

### **Accessibility Features**
- **Focus states**: Visible teal ring with proper contrast
- **Disabled states**: Reduced opacity and no pointer events
- **Keyboard navigation**: Proper tab order and focus management
- **Screen readers**: Proper ARIA labels and descriptions
- **Color contrast**: Meets WCAG AA standards

### **Performance Considerations**
- **CSS-in-JS**: Uses Tailwind classes for optimal performance
- **No runtime styles**: All styles are compiled at build time
- **Minimal bundle impact**: Leverages existing Tailwind utilities
- **Tree-shaking**: Only used variants are included in final bundle

## 🎨 **Color System**

### **Primary Colors**
- **Teal**: `from-teal-500 to-cyan-500` (primary actions)
- **Slate**: `slate-700/50` (secondary actions)
- **White**: `text-white` (button text)

### **Semantic Colors**
- **Success**: `green-600` (positive actions)
- **Danger**: `red-600` (destructive actions)
- **Info**: `blue-600` (informational actions)
- **Warning**: `yellow-600` (caution actions)

### **Neutral Colors**
- **Background**: `slate-900` (dark theme)
- **Borders**: `slate-600` (subtle borders)
- **Text**: `text-white` (primary text)

## 📱 **Responsive Design**

### **Breakpoint Strategy**
- **Mobile first**: Base styles for small screens
- **Tablet**: `md:` prefix for medium screens
- **Desktop**: `lg:` prefix for large screens
- **Large desktop**: `xl:` prefix for extra large screens

### **Touch Considerations**
- **Minimum touch target**: 44px × 44px
- **Hover states**: Work on both touch and mouse
- **Active states**: Provide visual feedback on touch

## 🔧 **Implementation Notes**

### **File Structure**
```
src/
  components/
    ui/
      button.tsx          # Main button component
      button-variants.ts  # Button variant definitions
      index.ts           # Component exports
```

### **Dependencies**
- `class-variance-authority`: For variant management
- `@radix-ui/react-slot`: For polymorphic components
- `tailwindcss`: For utility classes
- `clsx`: For conditional class names

### **Testing Strategy**
- **Unit tests**: Component variants and props
- **Integration tests**: Button interactions and accessibility
- **Visual regression**: Button appearance across variants
- **Accessibility tests**: Screen reader and keyboard navigation

## 📚 **Resources**

### **Related Components**
- `Card`: Container component with consistent styling
- `Input`: Form input component
- `Dialog`: Modal component with button integration

### **Design Tokens**
- **Spacing**: Consistent padding and margin scales
- **Typography**: Unified font weights and sizes
- **Shadows**: Consistent depth and elevation
- **Transitions**: Unified animation durations and easing

### **Future Enhancements**
- **Loading states**: Built-in loading spinners
- **Icon support**: Better icon integration
- **Group buttons**: Button group components
- **Split buttons**: Dropdown integration
- **Custom themes**: Dynamic color schemes
