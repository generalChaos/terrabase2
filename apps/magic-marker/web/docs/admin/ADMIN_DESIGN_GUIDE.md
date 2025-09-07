# Admin Design Guide

## 🎯 **Design Philosophy**

The Magic Marker admin interface is designed to be **clean, professional, and data-focused**. It should feel like a powerful dashboard where administrators can efficiently manage the system, monitor performance, and debug issues.

### **Core Principles**
- **Clarity First**: Information should be easy to scan and understand
- **Efficiency**: Common tasks should be quick to complete
- **Consistency**: Predictable patterns across all admin pages
- **Data Density**: Show relevant information without clutter
- **Professional**: Clean, trustworthy appearance

## 🎨 **Visual Identity**

### **Color Palette**

#### **Primary Colors**
```css
/* Background Colors */
--bg-primary: #f9fafb      /* Gray 50 - Main background */
--bg-secondary: #ffffff     /* White - Card backgrounds */
--bg-tertiary: #f3f4f6     /* Gray 100 - Subtle backgrounds */

/* Text Colors */
--text-primary: #111827     /* Gray 900 - Primary text */
--text-secondary: #4b5563   /* Gray 600 - Secondary text */
--text-tertiary: #6b7280   /* Gray 500 - Tertiary text */
--text-muted: #9ca3af      /* Gray 400 - Muted text */

/* Border Colors */
--border-primary: #e5e7eb   /* Gray 200 - Primary borders */
--border-secondary: #d1d5db /* Gray 300 - Secondary borders */
--border-focus: #3b82f6    /* Blue 500 - Focus borders */
```

#### **Accent Colors**
```css
/* Blue Accent (Primary) */
--accent-blue-50: #eff6ff
--accent-blue-100: #dbeafe
--accent-blue-500: #3b82f6
--accent-blue-600: #2563eb
--accent-blue-700: #1d4ed8

/* Status Colors */
--success-50: #f0fdf4
--success-500: #22c55e
--success-600: #16a34a

--error-50: #fef2f2
--error-500: #ef4444
--error-600: #dc2626

--warning-50: #fffbeb
--warning-500: #f59e0b
--warning-600: #d97706

--info-50: #eff6ff
--info-500: #3b82f6
--info-600: #2563eb
```

### **Typography**

#### **Font Hierarchy**
```css
/* Headlines */
--font-h1: 2.25rem / 1.2 / 700    /* 36px, bold */
--font-h2: 1.875rem / 1.25 / 600  /* 30px, semibold */
--font-h3: 1.5rem / 1.3 / 600     /* 24px, semibold */
--font-h4: 1.25rem / 1.4 / 600    /* 20px, semibold */

/* Body Text */
--font-body: 1rem / 1.6 / 400      /* 16px, normal */
--font-body-sm: 0.875rem / 1.5 / 400 /* 14px, normal */

/* UI Elements */
--font-button: 0.875rem / 1 / 500  /* 14px, medium */
--font-caption: 0.75rem / 1.4 / 500 /* 12px, medium */
--font-label: 0.875rem / 1.4 / 500  /* 14px, medium */
```

#### **Text Colors**
```css
/* Semantic text colors */
--text-heading: var(--text-primary)
--text-body: var(--text-secondary)
--text-caption: var(--text-tertiary)
--text-muted: var(--text-muted)
--text-link: var(--accent-blue-600)
--text-link-hover: var(--accent-blue-700)
```

## 🧩 **Component Patterns**

### **Layout Structure**

#### **Admin Layout**
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Navigation */}
  <nav className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navigation content */}
    </div>
  </nav>

  {/* Main Content */}
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    {/* Page Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
      <p className="mt-2 text-gray-600">Page description</p>
    </div>

    {/* Page Content */}
    {children}
  </div>
</div>
```

### **Card Components**

#### **Primary Card**
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### **Stats Card**
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Total Users</p>
      <p className="text-2xl font-bold text-gray-900">1,234</p>
    </div>
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <UsersIcon className="w-6 h-6 text-blue-600" />
    </div>
  </div>
</div>
```

#### **Data Card**
```tsx
<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Data Table</h3>
  </div>
  <div className="p-6">
    {/* Table content */}
  </div>
</div>
```

### **Form Components**

#### **Input Field**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Field Label
  </label>
  <input
    type="text"
    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Enter value"
  />
</div>
```

#### **Select Dropdown**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Select Option
  </label>
  <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

#### **Textarea**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Description
  </label>
  <textarea
    rows={4}
    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Enter description"
  />
</div>
```

### **Button Components**

#### **Primary Button**
```tsx
<button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Primary Action
</button>
```

#### **Secondary Button**
```tsx
<button className="px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Secondary Action
</button>
```

#### **Danger Button**
```tsx
<button className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
  Delete
</button>
```

### **Status Indicators**

#### **Status Badge**
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

#### **Status with Icon**
```tsx
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
  <span className="text-sm text-gray-600">Online</span>
</div>
```

### **Data Display**

#### **Key-Value Pairs**
```tsx
<div className="space-y-3">
  <div className="flex justify-between">
    <span className="text-sm font-medium text-gray-500">Created</span>
    <span className="text-sm text-gray-900">2024-01-15</span>
  </div>
  <div className="flex justify-between">
    <span className="text-sm font-medium text-gray-500">Status</span>
    <span className="text-sm text-gray-900">Active</span>
  </div>
</div>
```

#### **Progress Bar**
```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
    style={{ width: '75%' }}
  />
</div>
```

## 📊 **Data Visualization**

### **Tables**

#### **Basic Table**
```tsx
<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
  <table className="min-w-full divide-y divide-gray-300">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

#### **Table with Actions**
```tsx
<tr className="hover:bg-gray-50">
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
    Item Name
  </td>
  <td className="px-6 py-4 whitespace-nowrap">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  </td>
  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
    <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
    <button className="text-red-600 hover:text-red-900">Delete</button>
  </td>
</tr>
```

### **Charts and Graphs**

#### **Metric Cards**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">Total Users</p>
        <p className="text-2xl font-bold text-gray-900">1,234</p>
      </div>
    </div>
  </div>
</div>
```

## 🎛️ **Interactive Elements**

### **Modals and Dialogs**

#### **Modal Overlay**
```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
  <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">Modal Title</h3>
      <button className="text-gray-400 hover:text-gray-600">
        <XMarkIcon className="w-6 h-6" />
      </button>
    </div>
    {/* Modal content */}
  </div>
</div>
```

### **Tabs**

#### **Tab Navigation**
```tsx
<div className="border-b border-gray-200 mb-6">
  <nav className="-mb-px flex space-x-8">
    <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
      Overview
    </button>
    <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
      Details
    </button>
  </nav>
</div>
```

### **Pagination**

#### **Pagination Controls**
```tsx
<div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
  <div className="flex flex-1 justify-between sm:hidden">
    <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Previous
    </button>
    <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Next
    </button>
  </div>
  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
    <div>
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
        <span className="font-medium">97</span> results
      </p>
    </div>
    <div>
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
        {/* Pagination buttons */}
      </nav>
    </div>
  </div>
</div>
```

## 📱 **Responsive Design**

### **Breakpoint Strategy**
```css
/* Mobile First Approach */
--sm: 640px    /* Small tablets */
--md: 768px    /* Tablets */
--lg: 1024px   /* Laptops */
--xl: 1280px   /* Desktops */
--2xl: 1536px  /* Large desktops */
```

### **Responsive Grid**
```tsx
// Responsive grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Grid items */}
</div>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  {/* Responsive padding */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Title
</h1>
```

## 🎨 **Color Usage Guidelines**

### **Primary Actions**
- Use blue (`blue-600`) for primary actions
- Apply hover states (`hover:bg-blue-700`)
- Ensure sufficient contrast

### **Secondary Actions**
- Use gray (`gray-300`) for secondary actions
- Apply subtle hover states
- Maintain consistency

### **Status Colors**
- Green for success states
- Red for error/danger states
- Yellow for warning states
- Blue for informational states

### **Text Hierarchy**
- Gray 900 for primary text
- Gray 600 for secondary text
- Gray 500 for tertiary text
- Gray 400 for muted text

## 🚀 **Implementation Tips**

### **Performance Optimization**
- Use CSS classes instead of inline styles
- Implement proper loading states
- Optimize images and assets

### **Accessibility Considerations**
- Maintain color contrast ratios
- Provide proper focus indicators
- Use semantic HTML elements
- Include ARIA labels where needed

### **Consistency Patterns**
- Use consistent spacing scale
- Apply uniform border radius
- Maintain typography hierarchy
- Follow color usage guidelines

---

## 📚 **Related Resources**

- [Main Design System](./DESIGN_SYSTEM.md)
- [Frontend Design Guide](./FRONTEND_DESIGN_GUIDE.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
