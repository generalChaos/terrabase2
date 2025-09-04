# Component Library

## 🧩 **Shared Components**

### **Button Component**

#### **Props Interface**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onClick?: () => void
}
```

#### **Variants**

##### **Primary Button**
```tsx
// Frontend: Gradient with glow
<Button variant="primary" size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-lg">
  Generate Image
</Button>

// Admin: Solid blue
<Button variant="primary" size="md">
  Save Changes
</Button>
```

##### **Secondary Button**
```tsx
// Frontend: Glass morphism
<Button variant="secondary" size="md" className="bg-white/20 backdrop-blur-sm border border-white/30">
  Learn More
</Button>

// Admin: Gray with border
<Button variant="secondary" size="md">
  Cancel
</Button>
```

##### **Danger Button**
```tsx
<Button variant="danger" size="md">
  Delete
</Button>
```

#### **Sizes**
```tsx
<Button size="sm">Small</Button>    // h-8 px-3 py-1.5 text-sm
<Button size="md">Medium</Button>   // h-10 px-4 py-2 text-base
<Button size="lg">Large</Button>    // h-12 px-6 py-3 text-lg
```

### **Card Component**

#### **Props Interface**
```tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'glass' | 'outlined'
  padding?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}
```

#### **Variants**

##### **Default Card**
```tsx
// Admin: Clean white card
<Card variant="default" padding="md">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</Card>
```

##### **Glass Card**
```tsx
// Frontend: Glass morphism
<Card variant="glass" padding="lg" className="bg-white/10 backdrop-blur-sm border border-white/20">
  <h3 className="text-xl font-semibold text-white mb-4">Glass Card</h3>
  <p className="text-white/90">Transparent content</p>
</Card>
```

##### **Elevated Card**
```tsx
// Admin: Enhanced shadow
<Card variant="elevated" padding="lg">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Card</h3>
  <p className="text-gray-600">Elevated content</p>
</Card>
```

### **Input Component**

#### **Props Interface**
```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea'
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  value: string
  onChange: (value: string) => void
  className?: string
}
```

#### **Text Input**
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={setEmail}
  required
/>
```

#### **Textarea**
```tsx
<Input
  type="textarea"
  label="Description"
  placeholder="Enter description"
  value={description}
  onChange={setDescription}
  rows={4}
/>
```

### **Modal Component**

#### **Props Interface**
```tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to delete this item?</p>
  <div className="flex justify-end space-x-3 mt-6">
    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>
```

### **LoadingSpinner Component**

#### **Props Interface**
```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  text?: string
  className?: string
}
```

#### **Usage**
```tsx
// Default spinner
<LoadingSpinner />

// With text
<LoadingSpinner text="Loading..." />

// Custom size and color
<LoadingSpinner size="lg" color="white" text="Generating image..." />
```

## 🎨 **Frontend-Specific Components**

### **HeroSection Component**

#### **Props Interface**
```tsx
interface HeroSectionProps {
  title: string
  subtitle?: string
  background?: 'gradient' | 'image' | 'video'
  backgroundImage?: string
  children?: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<HeroSection
  title="Create Magic with AI"
  subtitle="Transform your ideas into stunning images through conversation"
  background="gradient"
>
  <Button variant="primary" size="lg">
    Get Started
  </Button>
</HeroSection>
```

### **GradientCard Component**

#### **Props Interface**
```tsx
interface GradientCardProps {
  gradient?: string
  glow?: boolean
  hover?: boolean
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<GradientCard
  gradient="from-purple-600 to-blue-600"
  glow={true}
  hover={true}
>
  <h3 className="text-xl font-semibold text-white mb-4">Feature Card</h3>
  <p className="text-white/90">Card content with gradient background</p>
</GradientCard>
```

### **AnimatedElement Component**

#### **Props Interface**
```tsx
interface AnimatedElementProps {
  animation?: 'fadeIn' | 'slideUp' | 'scale' | 'bounce'
  delay?: number
  duration?: number
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<AnimatedElement animation="fadeIn" delay={200} duration={600}>
  <div>Animated content</div>
</AnimatedElement>
```

## 📊 **Admin-Specific Components**

### **DataTable Component**

#### **Props Interface**
```tsx
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pagination?: boolean
  searchable?: boolean
  sortable?: boolean
  onRowClick?: (row: T) => void
  className?: string
}

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}
```

#### **Usage**
```tsx
const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
  { key: 'actions', label: 'Actions', render: (_, row) => <ActionButtons user={row} /> }
]

<DataTable
  data={users}
  columns={columns}
  pagination={true}
  searchable={true}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
/>
```

### **StatsCard Component**

#### **Props Interface**
```tsx
interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red'
  className?: string
}
```

#### **Usage**
```tsx
<StatsCard
  title="Total Users"
  value="1,234"
  change={{ value: 12, type: 'increase', period: 'vs last month' }}
  icon={<UsersIcon className="w-6 h-6" />}
  color="blue"
/>
```

### **StatusBadge Component**

#### **Props Interface**
```tsx
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

#### **Usage**
```tsx
<StatusBadge status="active" size="md" />
<StatusBadge status="error" size="sm" />
```

### **Sidebar Component**

#### **Props Interface**
```tsx
interface SidebarProps {
  items: SidebarItem[]
  activeItem?: string
  onItemClick?: (item: SidebarItem) => void
  className?: string
}

interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  badge?: string | number
  children?: SidebarItem[]
}
```

#### **Usage**
```tsx
const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, href: '/admin' },
  { id: 'users', label: 'Users', icon: <UsersIcon />, href: '/admin/users', badge: 5 },
  { id: 'settings', label: 'Settings', icon: <CogIcon />, href: '/admin/settings' }
]

<Sidebar
  items={sidebarItems}
  activeItem="dashboard"
  onItemClick={(item) => navigate(item.href)}
/>
```

## 🎯 **Layout Components**

### **Container Component**

#### **Props Interface**
```tsx
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<Container size="lg" padding="md">
  <h1>Page Content</h1>
</Container>
```

### **Grid Component**

#### **Props Interface**
```tsx
interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  responsive?: boolean
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<Grid cols={3} gap="md" responsive>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

## 🎨 **Utility Components**

### **Icon Component**

#### **Props Interface**
```tsx
interface IconProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}
```

#### **Usage**
```tsx
<Icon name="user" size="md" color="text-gray-600" />
<Icon name="check" size="sm" color="text-green-600" />
```

### **Tooltip Component**

#### **Props Interface**
```tsx
interface TooltipProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<Tooltip content="This is a helpful tooltip" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

### **Badge Component**

#### **Props Interface**
```tsx
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}
```

#### **Usage**
```tsx
<Badge variant="success" size="md">Active</Badge>
<Badge variant="error" size="sm">Error</Badge>
```

## 🚀 **Implementation Guidelines**

### **Component Structure**
```tsx
// Component file structure
src/
  components/
    ui/
      Button/
        Button.tsx
        Button.test.tsx
        Button.stories.tsx
        index.ts
    frontend/
      HeroSection/
        HeroSection.tsx
        HeroSection.test.tsx
        index.ts
    admin/
      DataTable/
        DataTable.tsx
        DataTable.test.tsx
        index.ts
```

### **Testing Strategy**
```tsx
// Component testing example
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### **Storybook Integration**
```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
}
```

---

## 📚 **Related Resources**

- [Main Design System](./DESIGN_SYSTEM.md)
- [Frontend Design Guide](./FRONTEND_DESIGN_GUIDE.md)
- [Admin Design Guide](./ADMIN_DESIGN_GUIDE.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
