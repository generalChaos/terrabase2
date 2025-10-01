# Result Page Layout Design - V1

## 🎯 **Overview**

The result page displays the generated logo options and allows users to customize and download their team assets. The layout is designed for both desktop and mobile with clear visual hierarchy.

## 📱 **Layout Structure**

### **Section 1: Team Information & Roster**
```
┌─────────────────────────────────────┐
│  ┌─────────┐  Team Name             │
│  │  LOGO   │  Sport                 │
│  └─────────┘                        │
│                                     │
│  Player Roster:                     │
│  ┌─────────────────────────────────┐ │
│  │ 9  Iggy                         │ │
│  │ 11 Marcelo                      │ │
│  │ 7  Val                          │ │
│  │ 6  Cash                         │ │
│  │ 8  Wolfie                       │ │
│  └─────────────────────────────────┘ │
│  [Add Player] →                     │
└─────────────────────────────────────┘
```

### **Section 2: Asset Customization**
```
┌─────────────────────────────────────┐
│  A) Banner Image                    │
│  ┌─────────────────────────────────┐ │
│  │    [BANNER PREVIEW]             │ │
│  └─────────────────────────────────┘ │
│  "Team roster banner for display"   │
│  [Add Banner] →                     │
│                                     │
│  ┌─────────┐  B) T-Shirt Image      │
│  │[SHIRT]  │  [See Back] →          │
│  │PREVIEW  │                        │
│  └─────────┘                        │
│                                     │
│              Color: [Black ▼]       │
│              Size:  [Large ▼]       │
│              [Add T-Shirts] →       │
└─────────────────────────────────────┘
```

### **Section 3: Logo Selection & Download**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────────┐ │
│  │        LARGE LOGO               │ │
│  │      Team Name                  │ │
│  └─────────────────────────────────┘ │
│  [Download Logo] →                  │
│                                     │
│  Other Options:                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ LOGO 2  │ │ LOGO 3  │            │
│  └─────────┘ └─────────┘            │
└─────────────────────────────────────┘
```

## 🎨 **Design Specifications**

### **Section 1: Team Information**
- **Logo**: 120px x 120px, left-aligned
- **Team Name**: Right-aligned next to logo, 24px font size
- **Sport**: Right-aligned below name, 18px font size
- **Spacing**: 24px between logo and text

### **Player Roster**
- **Container**: White background with border
- **Format**: "Number Name" (e.g., "9 Iggy")
- **Add Button**: Primary blue, right-aligned
- **Editable**: Click to edit, inline editing
- **Validation**: Number (1-99), Name (2-20 chars)

### **Section 2: Asset Customization**

#### **Banner Section**
- **Preview**: Full-width, 200px height
- **Description**: 16px text below preview
- **CTA Button**: "Add Banner" - secondary style

#### **T-Shirt Section**
- **Preview**: 150px x 150px, left-aligned (desktop)
- **Controls**: Right-aligned (desktop), below preview (mobile)
- **Color Picker**: Dropdown with Black/White options
- **Size Picker**: Dropdown with S, M, L, XL, XXL, XXXL
- **CTA Button**: "Add T-Shirts" - primary style

### **Section 3: Logo Selection**
- **Selected Logo**: 300px x 300px, centered
- **Team Name**: Below logo, 20px font size
- **Download Button**: Primary blue, centered
- **Alternative Logos**: 100px x 100px, side-by-side

## 📱 **Mobile Responsive Design**

### **Mobile Layout (320px - 639px)**
- **Single Column**: All sections stack vertically
- **T-Shirt Preview**: Full-width, centered
- **Controls**: Below preview, full-width
- **Touch Targets**: 44px minimum height

### **Tablet Layout (640px - 1023px)**
- **Two Column**: T-shirt preview and controls side-by-side
- **Larger Logos**: 200px x 200px for alternatives
- **Better Spacing**: 32px between sections

### **Desktop Layout (1024px+)**
- **Full Layout**: All sections as designed
- **Hover States**: Interactive elements
- **Larger Previews**: 400px x 400px for selected logo

## 🎨 **Color Specifications**

### **T-Shirt Colors (V1)**
- **Black**: `#000000` - Primary option
- **White**: `#FFFFFF` - Secondary option
- **Future**: Team colors in later versions

### **Size Options**
- **S**: Small (34-36" chest)
- **M**: Medium (38-40" chest)
- **L**: Large (42-44" chest)
- **XL**: Extra Large (46-48" chest)
- **XXL**: 2X Large (50-52" chest)
- **XXXL**: 3X Large (54-56" chest)

## 🎯 **User Interactions**

### **Player Roster Management**
- **Add Player**: Opens modal with number and name fields
- **Edit Player**: Click on existing player to edit
- **Delete Player**: Swipe or long-press to delete
- **Validation**: Real-time validation for inputs

### **Asset Customization**
- **Color Selection**: Dropdown with preview update
- **Size Selection**: Dropdown with preview update
- **Preview Updates**: Real-time preview changes
- **Order Form**: Simple form for asset requests
- **Email Orders**: Send order details via email

### **Logo Selection**
- **Select Logo**: Click to select different option
- **Download**: Download selected logo only
- **Preview**: Hover/click for larger preview

## 🚀 **Technical Implementation**

### **State Management**
- **Selected Logo**: Track which logo is currently selected
- **Player Roster**: Array of player objects
- **Customization**: Color, size, and quantity selections
- **Cart State**: Track selected assets

### **API Endpoints**
- **GET /api/result/{sessionId}**: Get generated assets
- **POST /api/players**: Add/edit player
- **POST /api/customize**: Update customization options
- **GET /api/download/{assetId}**: Download specific asset

### **Performance Considerations**
- **Lazy Loading**: Load asset previews as needed
- **Image Optimization**: WebP with PNG fallback
- **Caching**: Cache generated assets
- **Progressive Loading**: Show previews as they load

## 🎨 **Animation Specifications**

### **Section Transitions**
- **Fade In**: Each section fades in on scroll
- **Staggered**: 200ms delay between sections
- **Smooth**: 300ms ease-out transitions

### **Interactive Elements**
- **Hover States**: Scale and shadow effects
- **Click Feedback**: Scale down on press
- **Loading States**: Skeleton loading for previews

### **Mobile Gestures**
- **Swipe**: Between logo options
- **Tap**: Select and edit interactions
- **Long Press**: Delete players

This layout provides a comprehensive and user-friendly interface for managing team assets while maintaining the mobile-first approach.
