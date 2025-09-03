# Terrabase2 Configuration Strategy

## 🎯 **Environment-Based Configuration**

### **Development Environment (Local)**
- **Portal**: `http://localhost:3000`
- **Party Game**: `http://localhost:3001`
- **Magic Marker**: `http://localhost:3002`

### **Production Environment (Deployed)**
- **Portal**: `https://terrabase2.com`
- **Party Game**: `https://party-game.terrabase2.com`
- **Magic Marker**: `https://magic-marker.terrabase2.com`

## 🔧 **Configuration Implementation**

### **1. Environment Detection**
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
```

### **2. Dynamic URL Configuration**
```typescript
export const config = {
  urls: {
    partyGame: isDevelopment 
      ? 'http://localhost:3001'
      : 'https://party-game.terrabase2.com',
    
    magicMarker: isDevelopment 
      ? 'http://localhost:3002'
      : 'https://magic-marker.terrabase2.com',
  }
};
```

### **3. Port Configuration**
- **Portal**: `--port 3000` (Next.js)
- **Party Game**: `--port 3001` (Next.js)
- **Magic Marker**: `--port 3002` (Vite)

## 🚀 **Development Workflow**

### **Running Individual Apps**
```bash
# Portal (port 3000)
pnpm dev:portal

# Party Game (port 3001)
pnpm dev:party-game

# Magic Marker (port 3002)
pnpm dev:magic-marker
```

### **Running All Apps**
```bash
# All apps in parallel
pnpm dev
```

## 🌐 **Deployment Strategy**

### **Subdomain Strategy (Production)**
- Each app gets its own subdomain
- Independent deployment and scaling
- Clean separation of concerns

### **Port Strategy (Development)**
- Each app runs on a different port
- Easy local development
- No subdomain configuration needed

## 📁 **File Structure**
```
apps/
├── portal/           # Port 3000 (Development)
├── party-game/       # Port 3001 (Development)
└── magic-marker/     # Port 3002 (Development)
```

## 🔄 **Benefits**

1. **Environment Awareness**: Automatically detects dev vs production
2. **Port Management**: No conflicts between apps
3. **Deployment Ready**: Production URLs ready for deployment
4. **Developer Friendly**: Easy local development setup
5. **Scalable**: Each app can be deployed independently

## 🎨 **UI Changes**

- **Development**: Buttons show "Dev Server"
- **Production**: Buttons show "Live Demo"
- **Dynamic Links**: URLs change based on environment
