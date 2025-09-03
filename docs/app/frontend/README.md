# Frontend Documentation

## 📚 **Frontend Overview**

This directory contains documentation for all frontend applications in the Terrabase2 portfolio.

## 🎯 **Available Applications**

### **Portal**
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Purpose**: Portfolio landing page
- **Documentation**: [portal.md](./portal.md)

### **Party Game Web**
- **Framework**: Next.js with WebSocket client
- **Styling**: Tailwind CSS
- **Purpose**: Real-time multiplayer game interface
- **Documentation**: [party-game-web.md](./party-game-web.md)

### **Magic Marker Web**
- **Framework**: Vite + React
- **Styling**: Tailwind CSS
- **Purpose**: AI image generation interface
- **Documentation**: [magic-marker-web.md](./magic-marker-web.md)

## 🏗️ **Frontend Architecture**

### **Common Patterns**
- **Component-Based**: Reusable React components
- **Responsive Design**: Mobile-first approach
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS utility classes
- **Type Safety**: TypeScript throughout

### **Shared Components**
```typescript
// Shared UI components
import { Button, Card, Input } from '@tb2/shared-ui'

// Shared types
import { User, GameState } from '@tb2/shared-types'

// Shared configuration
import { config } from '@tb2/shared-config'
```

## 🎨 **Design System**

### **Color Palette**
```css
/* Primary Colors */
--primary: #3b82f6;      /* Blue */
--secondary: #8b5cf6;    /* Purple */
--accent: #f59e0b;       /* Amber */

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-900: #111827;
--white: #ffffff;
```

### **Typography**
```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
```

### **Spacing**
```css
/* Spacing Scale */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-8: 2rem;
--space-16: 4rem;
```

## 🔧 **Development Setup**

### **Local Development**
```bash
# Start specific app
pnpm dev:portal
pnpm dev:party-game
pnpm dev:magic-marker

# Start all apps
pnpm dev
```

### **Build Process**
```bash
# Build specific app
pnpm build --filter @tb2/portal
pnpm build --filter @tb2/party-game-web
pnpm build --filter @tb2/magic-marker-web

# Build all apps
pnpm build
```

## 🌐 **Deployment**

### **Vercel Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Deploy specific app
cd apps/portal && vercel --prod
```

### **Environment Configuration**
```typescript
// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isVercel = process.env.VERCEL === '1'

// API URLs
const apiUrl = isDevelopment 
  ? 'http://localhost:3001'
  : isVercel 
    ? 'https://party-game-api.railway.app'
    : 'https://party-game.terrabase2.com'
```

## 📱 **Responsive Design**

### **Breakpoints**
```css
/* Mobile First */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### **Component Examples**
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4">
      {item.content}
    </Card>
  ))}
</div>

// Responsive text
<h1 className="text-2xl md:text-4xl lg:text-6xl font-bold">
  Terrabase2
</h1>
```

## 🔄 **State Management**

### **React Hooks**
```tsx
// Local state
const [count, setCount] = useState(0)

// Context state
const { user, setUser } = useContext(UserContext)

// Custom hooks
const { data, loading, error } = useApi('/api/users')
```

### **State Patterns**
```tsx
// Form state
const [formData, setFormData] = useState({
  name: '',
  email: '',
  message: ''
})

// Game state
const [gameState, setGameState] = useState({
  players: [],
  currentPlayer: null,
  gamePhase: 'waiting'
})
```

## 🎯 **Performance Optimization**

### **Code Splitting**
```tsx
// Dynamic imports
const LazyComponent = lazy(() => import('./LazyComponent'))

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./Dashboard'))
  }
]
```

### **Image Optimization**
```tsx
// Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Terrabase2 Logo"
  width={200}
  height={80}
  priority
/>
```

### **Bundle Analysis**
```bash
# Analyze bundle size
pnpm build --analyze

# Check bundle composition
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

## 🧪 **Testing**

### **Unit Testing**
```tsx
// Component testing
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### **E2E Testing**
```tsx
// Playwright tests
import { test, expect } from '@playwright/test'

test('portal loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page.locator('h1')).toContainText('Terrabase2')
})
```

## 🔍 **Debugging**

### **Development Tools**
- **React DevTools**: Component inspection
- **Redux DevTools**: State debugging
- **Network Tab**: API request monitoring
- **Console**: Error logging and debugging

### **Error Boundaries**
```tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}
```

## 📊 **Analytics**

### **Performance Metrics**
- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: JavaScript and CSS size
- **Load Time**: First contentful paint
- **User Experience**: Interaction metrics

### **User Analytics**
- **Page Views**: Traffic analysis
- **User Behavior**: Click tracking
- **Conversion**: Goal completion
- **Retention**: User engagement

---

*Frontend documentation will be updated as new features are added.*
