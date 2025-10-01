# Simple Order Form - V1

## 🎯 **Overview**

A simple client-side order form that collects user information and sends an email with the generated assets. This is much simpler than a full cart system and perfect for V1.

## 📝 **Order Form Design**

### **Form Fields**
```typescript
interface OrderFormData {
  // Contact Information
  name: string;
  email: string;
  phone?: string;
  
  // Team Information
  team_name: string;
  sport: string;
  
  // Asset Requests
  logo_requested: boolean;
  tshirt_requested: boolean;
  tshirt_quantity: number;
  tshirt_sizes: string[]; // ["S", "M", "L", "XL"]
  banner_requested: boolean;
  
  // Additional Information
  special_requests?: string;
  delivery_address?: string;
}
```

### **Form Layout**
```
┌─────────────────────────────────────┐
│  Contact Information                │
│  ┌─────────────────────────────────┐ │
│  │ Name: [________________]        │ │
│  │ Email: [_______________]        │ │
│  │ Phone: [_______________]        │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Team Information                   │
│  ┌─────────────────────────────────┐ │
│  │ Team: Thunder Hawks             │ │
│  │ Sport: Soccer                   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Asset Requests                     │
│  ┌─────────────────────────────────┐ │
│  │ ☑ Logo Download ($5)            │ │
│  │ ☑ T-Shirts ($15 each)           │ │
│  │   Quantity: [2]                 │ │
│  │   Sizes: [S] [M] [L] [XL]       │ │
│  │ ☑ Banner ($25)                  │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Special Requests                   │
│  ┌─────────────────────────────────┐ │
│  │ [_____________________________] │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Send Order Request]               │
└─────────────────────────────────────┘
```

## 📧 **Email Template**

### **Order Request Email**
```html
<!DOCTYPE html>
<html>
<head>
  <title>New Team Asset Request - Mighty Team Designs</title>
</head>
<body>
  <h1>New Team Asset Request</h1>
  
  <h2>Contact Information</h2>
  <p><strong>Name:</strong> John Smith</p>
  <p><strong>Email:</strong> john@example.com</p>
  <p><strong>Phone:</strong> (555) 123-4567</p>
  
  <h2>Team Information</h2>
  <p><strong>Team:</strong> Thunder Hawks</p>
  <p><strong>Sport:</strong> Soccer</p>
  
  <h2>Asset Requests</h2>
  <ul>
    <li>✅ Logo Download ($5)</li>
    <li>✅ T-Shirts ($15 each) - Quantity: 2, Sizes: S, M</li>
    <li>✅ Banner ($25)</li>
  </ul>
  
  <h2>Special Requests</h2>
  <p>Please make the logo a bit larger on the t-shirts</p>
  
  <h2>Generated Assets</h2>
  <p>Assets are attached to this email or available at:</p>
  <ul>
    <li>Logo: [Download Link]</li>
    <li>T-Shirt Front: [Download Link]</li>
    <li>T-Shirt Back: [Download Link]</li>
    <li>Banner: [Download Link]</li>
  </ul>
  
  <h2>Next Steps</h2>
  <p>Please reply to this email to confirm the order and provide payment information.</p>
  
  <p>Thank you for choosing Mighty Team Designs!</p>
</body>
</html>
```

## 🔧 **Implementation**

### **Order Form Component**
```typescript
// components/OrderForm.tsx
interface OrderFormProps {
  teamName: string;
  sport: string;
  generatedAssets: {
    logo: string;
    tshirtFront: string;
    tshirtBack: string;
    banner: string;
  };
  onOrderSubmit: (orderData: OrderFormData) => Promise<void>;
}

export function OrderForm({ teamName, sport, generatedAssets, onOrderSubmit }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    email: '',
    phone: '',
    team_name: teamName,
    sport: sport,
    logo_requested: true,
    tshirt_requested: false,
    tshirt_quantity: 1,
    tshirt_sizes: [],
    banner_requested: false,
    special_requests: '',
    delivery_address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onOrderSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      {/* Asset Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Asset Requests</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.logo_requested}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_requested: e.target.checked }))}
            />
            <span>Logo Download ($5)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.tshirt_requested}
              onChange={(e) => setFormData(prev => ({ ...prev, tshirt_requested: e.target.checked }))}
            />
            <span>T-Shirts ($15 each)</span>
          </label>

          {formData.tshirt_requested && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.tshirt_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, tshirt_quantity: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Sizes</label>
                <div className="flex space-x-2 mt-1">
                  {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                    <label key={size} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={formData.tshirt_sizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, tshirt_sizes: [...prev.tshirt_sizes, size] }));
                          } else {
                            setFormData(prev => ({ ...prev, tshirt_sizes: prev.tshirt_sizes.filter(s => s !== size) }));
                          }
                        }}
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.banner_requested}
              onChange={(e) => setFormData(prev => ({ ...prev, banner_requested: e.target.checked }))}
            />
            <span>Banner ($25)</span>
          </label>
        </div>
      </div>

      {/* Special Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Special Requests</h3>
        <textarea
          value={formData.special_requests}
          onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
          placeholder="Any special requests or notes..."
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Send Order Request
      </Button>
    </form>
  );
}
```

### **Email Service**
```typescript
// lib/emailService.ts
export class EmailService {
  async sendOrderRequest(orderData: OrderFormData, generatedAssets: any): Promise<void> {
    const response = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderData,
        generatedAssets
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send order request');
    }
  }
}
```

### **API Route**
```typescript
// app/api/send-order/route.ts
export async function POST(request: Request) {
  const { orderData, generatedAssets } = await request.json();
  
  // Send email using Resend or similar service
  await resend.emails.send({
    from: 'orders@mightyteams.com',
    to: 'orders@mightyteams.com', // Your business email
    subject: `New Order Request - ${orderData.team_name}`,
    html: generateOrderEmailHTML(orderData, generatedAssets)
  });

  return Response.json({ success: true });
}
```

## 🎯 **Integration with Results Page**

### **Updated Section 3**
```
┌─────────────────────────────────────┐
│  Section 3: Order & Download       │
│  ┌─────────────────────────────────┐ │
│  │        LARGE LOGO               │ │
│  │      Team Name                  │ │
│  └─────────────────────────────────┘ │
│  [Download Logo] →                  │
│                                     │
│  Order Form:                        │
│  ┌─────────────────────────────────┐ │
│  │ [Contact Info]                  │ │
│  │ [Asset Requests]                │ │
│  │ [Special Requests]              │ │
│  │ [Send Order Request]            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Other Options:                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ LOGO 2  │ │ LOGO 3  │            │
│  └─────────┘ └─────────┘            │
└─────────────────────────────────────┘
```

## 🚀 **Benefits of Simple Approach**

1. **Quick Implementation**: No complex cart logic
2. **Easy Maintenance**: Simple form and email
3. **Personal Touch**: Direct email communication
4. **Flexible**: Easy to customize per request
5. **V1 Focused**: Perfect for MVP

This approach is much simpler and gets users to the ordering stage quickly while maintaining the personal touch of direct email communication!
