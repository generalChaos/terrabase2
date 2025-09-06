# Accessibility Guide

## ♿ **Overview**

This guide ensures that Magic Marker is accessible to all users, including those with disabilities. We follow WCAG 2.1 AA standards and implement best practices for inclusive design.

## 🎯 **Accessibility Standards**

### **WCAG 2.1 AA Compliance**
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### **Key Principles**
- **Keyboard Navigation**: Full functionality via keyboard
- **Screen Reader Support**: Proper semantic markup and ARIA labels
- **Color Contrast**: Sufficient contrast ratios for all text
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Meaningful descriptions for images and media

## 🎨 **Color and Contrast**

### **Contrast Requirements**
```css
/* Minimum contrast ratios */
--contrast-normal: 4.5:1    /* Normal text (AA) */
--contrast-large: 3:1       /* Large text (AA) */
--contrast-enhanced: 7:1    /* Enhanced contrast (AAA) */
```

### **Color Usage Guidelines**

#### **Text Contrast**
```tsx
// ✅ Good: High contrast
<p className="text-gray-900">Primary text on white background</p>
<p className="text-white">White text on dark gradient</p>

// ❌ Bad: Low contrast
<p className="text-gray-400">Low contrast text</p>
<p className="text-gray-300">Very low contrast text</p>
```

#### **Status Colors**
```tsx
// ✅ Good: Color + text/icon
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
  <span className="text-sm text-gray-600">Online</span>
</div>

// ❌ Bad: Color only
<div className="w-2 h-2 bg-green-400 rounded-full"></div>
```

### **Color Blindness Considerations**
- Never rely solely on color to convey information
- Use patterns, icons, or text alongside color
- Test with color blindness simulators
- Provide alternative indicators for status

## ⌨️ **Keyboard Navigation**

### **Tab Order**
```tsx
// ✅ Good: Logical tab order
<div>
  <button tabIndex={1}>First Button</button>
  <input tabIndex={2} />
  <button tabIndex={3}>Second Button</button>
</div>

// ❌ Bad: Inconsistent tab order
<div>
  <button tabIndex={3}>First Button</button>
  <input tabIndex={1} />
  <button tabIndex={2}>Second Button</button>
</div>
```

### **Focus Management**
```tsx
// Focus trap in modals
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null)
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      firstElement?.focus()
      
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus()
              e.preventDefault()
            }
          }
        }
      }
      
      document.addEventListener('keydown', handleTabKey)
      return () => document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])
  
  return (
    <div ref={modalRef} className="modal">
      {children}
    </div>
  )
}
```

### **Skip Links**
```tsx
// Skip to main content
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

## 🗣️ **Screen Reader Support**

### **Semantic HTML**
```tsx
// ✅ Good: Semantic structure
<main>
  <header>
    <h1>Page Title</h1>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>
  
  <section aria-labelledby="content-heading">
    <h2 id="content-heading">Content Section</h2>
    <p>Content here</p>
  </section>
</main>

// ❌ Bad: Non-semantic structure
<div>
  <div>
    <div>Page Title</div>
    <div>
      <div><a href="/">Home</a></div>
      <div><a href="/about">About</a></div>
    </div>
  </div>
  <div>
    <div>Content Section</div>
    <div>Content here</div>
  </div>
</div>
```

### **ARIA Labels and Descriptions**
```tsx
// Button with descriptive label
<button 
  aria-label="Close dialog"
  aria-describedby="close-description"
  onClick={onClose}
>
  <XMarkIcon className="w-6 h-6" />
</button>
<span id="close-description" className="sr-only">
  Closes the current dialog and returns to the previous screen
</span>

// Form with proper labeling
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
    className="mt-1 block w-full border-gray-300 rounded-md"
  />
  {hasError && (
    <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
      Please enter a valid email address
    </p>
  )}
</div>
```

### **Live Regions**
```tsx
// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Announce urgent updates
<div aria-live="assertive" aria-atomic="true" className="sr-only">
  {errorMessage}
</div>
```

## 🖼️ **Images and Media**

### **Alternative Text**
```tsx
// ✅ Good: Descriptive alt text
<img 
  src="chart.png" 
  alt="Bar chart showing sales increased 25% from Q1 to Q2 2024"
  className="w-full h-auto"
/>

// Decorative images
<img 
  src="decoration.png" 
  alt=""
  className="w-full h-auto"
/>

// ❌ Bad: Generic or missing alt text
<img src="chart.png" alt="Chart" />
<img src="chart.png" />
```

### **Complex Images**
```tsx
// Image with long description
<img 
  src="complex-diagram.png" 
  alt="System architecture diagram"
  aria-describedby="diagram-description"
/>
<div id="diagram-description" className="sr-only">
  The system architecture shows three main components: 
  the frontend React application, the Node.js API server, 
  and the PostgreSQL database. Data flows from the frontend 
  through the API to the database and back.
</div>
```

### **Video and Audio**
```tsx
// Video with captions and descriptions
<video controls>
  <source src="tutorial.mp4" type="video/mp4" />
  <track 
    kind="captions" 
    src="tutorial-captions.vtt" 
    srcLang="en" 
    label="English"
    default
  />
  <track 
    kind="descriptions" 
    src="tutorial-descriptions.vtt" 
    srcLang="en" 
    label="English Descriptions"
  />
  Your browser does not support the video tag.
</video>
```

## 📱 **Mobile Accessibility**

### **Touch Targets**
```css
/* Minimum 44px touch target */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Spacing between touch targets */
.touch-spacing {
  margin: 8px;
}
```

### **Orientation Support**
```tsx
// Support both portrait and landscape
<div className="min-h-screen flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1">
    {/* Main content */}
  </main>
</div>
```

### **Zoom Support**
```css
/* Support up to 200% zoom */
.container {
  max-width: 100%;
  overflow-x: auto;
}

/* Ensure text remains readable */
.text-responsive {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
}
```

## 🎭 **Animation and Motion**

### **Respect User Preferences**
```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### **Safe Animations**
```tsx
// Check for reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (event) => setPrefersReducedMotion(event.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return prefersReducedMotion
}

// Use in components
const AnimatedComponent = () => {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div 
      className={prefersReducedMotion ? '' : 'animate-fade-in-up'}
    >
      Content
    </div>
  )
}
```

## 🧪 **Testing and Validation**

### **Automated Testing**
```tsx
// Jest + Testing Library
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

test('should be keyboard navigable', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)
  
  const button = screen.getByRole('button', { name: /submit/i })
  await user.tab()
  expect(button).toHaveFocus()
})
```

### **Manual Testing Checklist**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Tab order is logical and intuitive
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announces content correctly
- [ ] Forms have proper labels and error messages
- [ ] Dynamic content changes are announced
- [ ] Modal dialogs trap focus appropriately
- [ ] Skip links work correctly

### **Tools and Resources**
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Color Oracle**: Color blindness simulator
- **NVDA/JAWS**: Screen readers for testing
- **VoiceOver**: Built-in macOS screen reader
- **Keyboard-only navigation**: Test with Tab, Shift+Tab, Enter, Space, Arrow keys

## 🎯 **Component-Specific Guidelines**

### **Buttons**
```tsx
// Accessible button component
const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  ariaLabel,
  ...props 
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={ariaLabel}
    aria-disabled={disabled || loading}
    className={`
      px-4 py-2 rounded-md font-medium
      ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `}
    {...props}
  >
    {loading && <LoadingSpinner className="mr-2" />}
    {children}
  </button>
)
```

### **Form Inputs**
```tsx
// Accessible input component
const Input = ({ 
  label, 
  error, 
  required = false, 
  id,
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${inputId}-error` : undefined
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
```

### **Modal Dialogs**
```tsx
// Accessible modal component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md' 
}) => {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)
  
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      modalRef.current?.focus()
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          ref={modalRef}
          className={`
            bg-white rounded-lg shadow-xl max-w-full
            ${size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}
          `}
          tabIndex={-1}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 📚 **Resources and References**

### **WCAG Guidelines**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Guidelines](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### **Testing Tools**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Color Oracle](https://colororacle.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### **Screen Readers**
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS)](https://www.apple.com/accessibility/vision/)
- [Orca (Linux)](https://help.gnome.org/users/orca/)

---

## 🎯 **Implementation Checklist**

### **Development Phase**
- [ ] Use semantic HTML elements
- [ ] Implement proper ARIA labels
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Verify color contrast ratios
- [ ] Add alternative text for images
- [ ] Implement focus management
- [ ] Test with reduced motion preferences

### **Testing Phase**
- [ ] Run automated accessibility tests
- [ ] Perform manual keyboard testing
- [ ] Test with screen readers
- [ ] Verify color contrast
- [ ] Test on mobile devices
- [ ] Validate with accessibility tools
- [ ] Get feedback from users with disabilities

### **Maintenance Phase**
- [ ] Regular accessibility audits
- [ ] Update documentation
- [ ] Train team on accessibility
- [ ] Monitor user feedback
- [ ] Keep up with WCAG updates
