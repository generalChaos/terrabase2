# Cart System & Order Management - V2 Ideas

## 🛒 **Overview**

A comprehensive cart system that allows users to add generated assets to their cart and place orders via a full e-commerce experience. This would be implemented in V2 after the basic order form is working well.

## 🎯 **Cart System Design**

### **Product Types**
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  type: 'logo' | 'tshirt' | 'banner' | 'asset_pack';
  base_price: number;
  is_active: boolean;
  options: {
    colors?: string[];
    sizes?: string[];
    formats?: string[];
    [key: string]: any;
  };
}

interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  options: {
    color?: string;
    size?: string;
    variant?: string;
  };
  unit_price: number;
  total_price: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  updated_at: string;
}
```

### **Pricing Structure (V2)**
- **Logo Download**: $5 (high-res PNG)
- **T-Shirt**: $15 each (any size/color)
- **Banner**: $25 each
- **Asset Pack**: $35 (logo + t-shirt + banner)
- **Tax**: 8.5% (configurable)

## 🎨 **UI Components**

### **Cart Button**
```typescript
// Add to cart button for each asset
<Button 
  onClick={() => addToCart(item)}
  className="bg-blue-600 hover:bg-blue-700"
>
  Add to Cart - ${item.price}
</Button>
```

### **Cart Sidebar**
```typescript
// Cart sidebar that slides in from right
<CartSidebar 
  isOpen={cartOpen}
  onClose={() => setCartOpen(false)}
  items={cartItems}
  onUpdateQuantity={updateQuantity}
  onRemoveItem={removeItem}
  onCheckout={checkout}
/>
```

### **Order Summary**
```typescript
// Order summary in cart
<div className="border-t pt-4">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>${subtotal}</span>
  </div>
  <div className="flex justify-between">
    <span>Tax:</span>
    <span>${tax}</span>
  </div>
  <div className="flex justify-between font-bold text-lg">
    <span>Total:</span>
    <span>${total}</span>
  </div>
</div>
```

## 📧 **Order Management**

### **Order Flow**
1. **Add to Cart**: User adds assets to cart
2. **Review Cart**: User reviews items and quantities
3. **Checkout**: User provides contact information
4. **Order Confirmation**: Generate order ID and send email
5. **Order Tracking**: User can track order status

### **Order Data Structure**
```typescript
interface Order {
  id: string; // Generated order ID (e.g., "MTD-2024-001")
  flow_id: string;
  team_name: string;
  contact_info: {
    name: string;
    email: string;
    phone?: string;
  };
  items: CartItem[];
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
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
  <title>Order Confirmation - Mighty Team Designs</title>
</head>
<body>
  <h1>Order Confirmation</h1>
  <p>Thank you for your order!</p>
  
  <h2>Order Details</h2>
  <p><strong>Order ID:</strong> MTD-2024-001</p>
  <p><strong>Team:</strong> Thunder Hawks</p>
  <p><strong>Date:</strong> January 15, 2024</p>
  
  <h2>Items Ordered</h2>
  <table>
    <tr>
      <th>Item</th>
      <th>Description</th>
      <th>Quantity</th>
      <th>Price</th>
    </tr>
    <tr>
      <td>Logo Download</td>
      <td>High-res PNG</td>
      <td>1</td>
      <td>$5.00</td>
    </tr>
    <tr>
      <td>T-Shirt</td>
      <td>Black, Large</td>
      <td>12</td>
      <td>$180.00</td>
    </tr>
  </table>
  
  <h2>Total: $185.00</h2>
  
  <p>We'll process your order and send you the assets within 24 hours.</p>
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

### **Products Table**
```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'logo', 'tshirt', 'banner', 'asset_pack'
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  options JSONB, -- Available options like colors, sizes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default products
INSERT INTO products (id, name, description, type, base_price, options) VALUES
('logo-download', 'Logo Download', 'High-resolution PNG logo', 'logo', 5.00, '{"formats": ["PNG"], "resolution": "300 DPI"}'),
('tshirt-black', 'T-Shirt (Black)', 'Custom team t-shirt', 'tshirt', 15.00, '{"colors": ["black"], "sizes": ["S", "M", "L", "XL", "XXL", "XXXL"]}'),
('tshirt-white', 'T-Shirt (White)', 'Custom team t-shirt', 'tshirt', 15.00, '{"colors": ["white"], "sizes": ["S", "M", "L", "XL", "XXL", "XXXL"]}'),
('banner', 'Team Banner', 'Custom team roster banner', 'banner', 25.00, '{"sizes": ["standard"], "customization": true}'),
('asset-pack', 'Complete Asset Pack', 'Logo + T-shirt + Banner', 'asset_pack', 35.00, '{"includes": ["logo", "tshirt", "banner"]}');
```

### **Orders Table**
```sql
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY,
  flow_id UUID REFERENCES flows(id),
  team_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  items JSONB NOT NULL,
  pricing JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Cart Items Table**
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL,
  product_id VARCHAR(50) REFERENCES products(id),
  quantity INTEGER NOT NULL,
  options JSONB, -- Selected options like color, size
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
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
│  A) Banner: [Preview] [Add to Cart] │
│  B) T-Shirt: [Preview] [Add to Cart]│
│  C) Logo: [Preview] [Add to Cart]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Section 3: Cart & Checkout        │
│  [Cart: 3 items - $85.00] [Checkout]│
│  [Order History] [Download Assets]  │
└─────────────────────────────────────┘
```

### **Cart Context**
```typescript
interface CartContextType {
  items: CartItem[];
  products: Product[];
  addItem: (productId: string, options: any) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  loadProducts: () => Promise<void>;
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Basic Cart**
1. **Create Cart Context**: State management for cart items
2. **Add Cart UI**: Sidebar and cart buttons
3. **Implement Add/Remove**: Basic cart functionality
4. **Add Pricing Logic**: Calculate totals and tax

### **Phase 2: Order Management**
1. **Create Order Schema**: Database tables and types
2. **Build Checkout Form**: Contact information collection
3. **Implement Order ID**: Generate unique order identifiers
4. **Add Order Tracking**: View order status

### **Phase 3: Email Integration**
1. **Set up Email Service**: Resend or similar provider
2. **Create Email Templates**: Order confirmation and updates
3. **Implement Email Sending**: Send order confirmations
4. **Add Order Notifications**: Status update emails

## 📊 **Success Metrics**

### **Cart Metrics**
- **Add to Cart Rate**: > 60% of users
- **Cart Abandonment**: < 40%
- **Checkout Completion**: > 80% of cart users
- **Average Order Value**: $50+

### **Order Metrics**
- **Order Processing Time**: < 24 hours
- **Email Delivery Rate**: > 95%
- **Customer Satisfaction**: > 4.5/5
- **Repeat Order Rate**: > 30%

This cart system provides a comprehensive e-commerce experience for users to order their generated assets while maintaining the core value proposition of AI-driven logo generation.
