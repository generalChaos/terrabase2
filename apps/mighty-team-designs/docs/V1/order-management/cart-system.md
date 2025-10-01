# Order Management - V1 (Simplified)

## 🛒 **Overview**

A simplified order management system for V1 that collects user information and sends order details via email. This is **NOT** a full cart system - just a simple order form that captures the final generated assets and user contact information.

**Note**: Full cart system moved to V2 ideas. V1 focuses on simple email-based ordering.

## 🎯 **Simplified V1 Order System**

### **Order Data Structure**
```typescript
interface OrderRequest {
  flow_id: string;
  team_name: string;
  sport: string;
  selected_logo: {
    id: string;
    url: string;
    description: string;
  };
  generated_assets: {
    logo_clean: string;        // Cleaned logo URL
    tshirt_front: string;      // T-shirt front with logo
    tshirt_back: string;       // T-shirt back with roster
    banner: string;            // Team banner with logo and roster
  };
  contact_info: {
    name: string;
    email: string;
    phone?: string;
  };
  order_details: {
    requested_items: string[]; // What they want to order
    special_requests?: string;
    estimated_quantity?: number;
  };
  created_at: string;
}
```

### **Simple Order Form**
```typescript
interface OrderFormData {
  // Contact Information
  name: string;
  email: string;
  phone?: string;
  
  // Order Details
  requested_items: {
    logo_download: boolean;
    tshirts: boolean;
    banner: boolean;
    quantity_estimate?: number;
  };
  
  // Special Requests
  special_requests?: string;
  
  // Team Information (auto-filled)
  team_name: string;
  sport: string;
  selected_logo_id: string;
}
```

## 🎨 **UI Components**

### **Get Shirts CTA Button**
```typescript
// "Get Shirts" button next to shirt picker
<div className="flex items-center gap-4">
  <ShirtPicker 
    selectedColor={selectedColor}
    selectedSize={selectedSize}
    onColorChange={setSelectedColor}
    onSizeChange={setSelectedSize}
  />
  <Button 
    onClick={() => setShowOrderForm(true)}
    className="bg-blue-600 hover:bg-blue-700"
  >
    Get Shirts
  </Button>
</div>
```

### **Order Form Modal**
```typescript
// Simple order form modal
<OrderFormModal 
  isOpen={showOrderForm}
  onClose={() => setShowOrderForm(false)}
  teamData={teamData}
  generatedAssets={generatedAssets}
  onSubmit={handleOrderSubmit}
/>
```

### **Shirt Picker Component**
```typescript
// Simple shirt picker for color and size
<div className="space-y-3">
  <div>
    <label>Color</label>
    <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
      <option value="black">Black</option>
      <option value="white">White</option>
    </select>
  </div>
  <div>
    <label>Size</label>
    <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
      <option value="S">S</option>
      <option value="M">M</option>
      <option value="L">L</option>
      <option value="XL">XL</option>
      <option value="XXL">XXL</option>
      <option value="XXXL">XXXL</option>
    </select>
  </div>
</div>
```

### **Order Form Fields**
```typescript
// Simple form fields (phone not required)
<div className="space-y-4">
  <div>
    <label>Name *</label>
    <input type="text" required />
  </div>
  <div>
    <label>Email *</label>
    <input type="email" required />
  </div>
  <div>
    <label>Phone</label>
    <input type="tel" />
  </div>
  <div>
    <label>Estimated Quantity</label>
    <input type="number" placeholder="e.g., 12 t-shirts" />
  </div>
  <div>
    <label>Special Requests</label>
    <textarea placeholder="Any specific requirements..." />
  </div>
</div>
```

## 📧 **Order Management**

### **Simplified Order Flow**
1. **User completes logo generation** - Team name, sport, style, colors, mascot
2. **Assets are generated** - Logo, t-shirt front/back, banner
3. **User picks shirt color/size** - Simple shirt picker on results page
4. **User clicks "Get Shirts"** - Opens order form with pre-filled shirt details
5. **User fills out form** - Contact info, quantity, special requests
6. **Order is submitted** - Data is stored and email is sent
7. **Success page shown** - User sees confirmation and can download small assets

### **Order Data Storage**
```typescript
interface StoredOrder {
  id: string; // Generated order ID (e.g., "MTD-2024-001")
  flow_id: string;
  team_name: string;
  sport: string;
  selected_logo: {
    id: string;
    url: string;
    description: string;
  };
  generated_assets: {
    logo_clean: string;
    tshirt_front: string;
    tshirt_back: string;
    banner: string;
  };
  contact_info: {
    name: string;
    email: string;
    phone?: string;
  };
  order_details: {
    requested_items: string[];
    special_requests?: string;
    estimated_quantity?: number;
  };
  status: 'submitted' | 'contacted' | 'completed';
  created_at: string;
  updated_at: string;
}
```

### **Order ID Generation**
```typescript
// Generate unique order ID
function generateOrderId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MTD-${year}-${random}`;
}
```

## 📧 **Email Order System**

### **Email Template**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Order Request - Mighty Team Designs</title>
</head>
<body>
  <h1>Order Request Received</h1>
  <p>Thank you for your interest in ordering team assets!</p>
  
  <h2>Order Details</h2>
  <p><strong>Order ID:</strong> MTD-2024-001</p>
  <p><strong>Team:</strong> Thunder Hawks</p>
  <p><strong>Sport:</strong> Soccer</p>
  <p><strong>Date:</strong> January 15, 2024</p>
  
  <h2>Contact Information</h2>
  <p><strong>Name:</strong> John Smith</p>
  <p><strong>Email:</strong> john@example.com</p>
  <p><strong>Phone:</strong> (555) 123-4567</p>
  
  <h2>Requested Items</h2>
  <ul>
    <li>Logo Download (High-res PNG)</li>
    <li>T-Shirts (Estimated: 12 pieces)</li>
    <li>Team Banner</li>
  </ul>
  
  <h2>Special Requests</h2>
  <p>Need delivery by next week for tournament</p>
  
  <h2>Generated Assets</h2>
  <p>Your team assets have been generated and are ready for review:</p>
  <ul>
    <li><a href="[logo_url]">Clean Logo</a></li>
    <li><a href="[tshirt_front_url]">T-Shirt Front</a></li>
    <li><a href="[tshirt_back_url]">T-Shirt Back</a></li>
    <li><a href="[banner_url]">Team Banner</a></li>
  </ul>
  
  <p>We'll contact you within 24 hours to discuss pricing and delivery options.</p>
  
  <p>Best regards,<br>Mighty Team Designs</p>
</body>
</html>
```

### **Email Service Integration**
```typescript
// Email service using Resend or similar
interface EmailService {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendOrderUpdate(order: Order, status: string): Promise<void>;
}

// Implementation
class ResendEmailService implements EmailService {
  async sendOrderConfirmation(order: Order): Promise<void> {
    await resend.emails.send({
      from: 'orders@mightyteams.com',
      to: order.contact_info.email,
      subject: `Order Confirmation - ${order.id}`,
      html: generateOrderEmailHTML(order)
    });
  }
}
```

## 🗄️ **Database Schema**

### **Orders Table (Simplified)**
```sql
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY, -- e.g., "MTD-2024-001"
  flow_id UUID REFERENCES flows(id),
  team_name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  selected_logo JSONB NOT NULL, -- {id, url, description}
  generated_assets JSONB NOT NULL, -- {logo_clean, tshirt_front, tshirt_back, banner}
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  requested_items JSONB NOT NULL, -- Array of requested items
  special_requests TEXT,
  estimated_quantity INTEGER,
  status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'contacted', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Order Status Tracking**
```sql
CREATE TABLE order_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) REFERENCES orders(id),
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 **Integration with Existing Flow**

### **Updated Results Page Layout**
```
┌─────────────────────────────────────┐
│  Section 1: Team Info & Roster     │
│  ┌─────────┐              Team Name │
│  │  LOGO   │              Sport     │
│  └─────────┘                        │
│  [Player Roster]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Section 2: Asset Customization    │
│  A) Banner: [Preview] [Download]    │
│  B) T-Shirt: [Preview] [Download]   │
│  C) Logo: [Preview] [Download]      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Section 3: Order Shirts            │
│  [Color: Black ▼] [Size: L ▼] [Get Shirts] │
│  [Download All] [Share] [Start Over]│
└─────────────────────────────────────┘
```

### **Order Service**
```typescript
class OrderService {
  async submitOrder(orderData: OrderFormData): Promise<{ success: boolean; orderId?: string }> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return response.json();
  }

  async getOrder(orderId: string): Promise<StoredOrder> {
    const response = await fetch(`/api/orders/${orderId}`);
    return response.json();
  }
}
```

### **Order Form Context**
```typescript
interface OrderFormContextType {
  isOpen: boolean;
  teamData: TeamData;
  generatedAssets: GeneratedAssets;
  formData: OrderFormData;
  setFormData: (data: Partial<OrderFormData>) => void;
  submitOrder: () => Promise<void>;
  closeForm: () => void;
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Order Form UI**
1. **Create Order Form Modal**: Simple form for contact info and order details
2. **Add Order Button**: "Get Quote / Order Now" button on results page
3. **Form Validation**: Basic validation for required fields
4. **Form State Management**: Handle form data and submission

### **Phase 2: Order Data Storage**
1. **Create Order Schema**: Database tables for storing order data
2. **Implement Order Service**: API endpoints for order submission
3. **Add Order ID Generation**: Generate unique order identifiers
4. **Store Generated Assets**: Save asset URLs with order data

### **Phase 3: Email Integration**
1. **Set up Email Service**: Resend or similar provider
2. **Create Email Templates**: Order request confirmation
3. **Implement Email Sending**: Send order confirmations
4. **Add Success Page**: Show confirmation with download links

### **Phase 4: Admin Tools (V1b)**
1. **Order Management Dashboard**: View and manage submitted orders
2. **Order Status Updates**: Mark orders as contacted, completed, etc.
3. **Customer Database**: View customer information and order history
4. **Analytics Dashboard**: Track popular teams, sports, and order patterns

## 📊 **Success Metrics**

### **Order Form Metrics**
- **Order Form Completion Rate**: > 70% of users who start the form
- **Form Abandonment**: < 30%
- **Order Submission Rate**: > 80% of form completions
- **Email Delivery Rate**: > 95%

### **Order Processing Metrics**
- **Order Response Time**: < 24 hours
- **Customer Satisfaction**: > 4.5/5
- **Order Conversion Rate**: > 40% of submitted orders
- **Repeat Order Rate**: > 20%

### **Data Storage Benefits**
- **Order History**: Track all order requests for analysis
- **Asset Preservation**: Keep generated assets for future reference
- **Contact Database**: Build customer database for marketing
- **Analytics**: Track popular team names, sports, and styles

## 🎉 **Success Page & Downloads**

### **Success Page Layout**
```
┌─────────────────────────────────────┐
│  ✅ Order Submitted Successfully!   │
│                                     │
│  Order ID: MTD-2024-001             │
│  We'll contact you within 24 hours  │
│                                     │
│  Download Small Assets:             │
│  [Logo] [T-Shirt Front] [Banner]    │
│                                     │
│  [Share Results] [Start Over]       │
└─────────────────────────────────────┘
```

### **Small Asset Downloads**
- **Logo**: Low-res PNG for social media sharing
- **T-Shirt Front**: Small preview image
- **Banner**: Small preview image
- **No high-res downloads** until order is confirmed

### **Admin Tools (V1b)**
- **Order Dashboard**: View all submitted orders
- **Order Management**: Update status, add notes
- **Customer Database**: Contact info and order history
- **Analytics**: Popular teams, sports, order patterns

This simplified order system provides a practical way for users to request team assets while keeping the implementation simple and focused on the core value proposition. The stored data will be valuable for future product development and customer relationship management.
