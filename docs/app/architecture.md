# Terrabase2 Architecture Overview

## 🏗️ **System Architecture**

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Terrabase2 Portfolio                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Vercel)                    │  Backend (Railway)      │
│  ┌─────────────────┐                  │  ┌─────────────────┐    │
│  │     Portal      │                  │  │  Party Game     │    │
│  │   (Next.js)     │                  │  │     API         │    │
│  │  Port: 3000     │                  │  │  (NestJS)       │    │
│  └─────────────────┘                  │  └─────────────────┘    │
│  ┌─────────────────┐                  │  ┌─────────────────┐    │
│  │  Party Game     │                  │  │  Magic Marker   │    │
│  │  Web (Next.js)  │                  │  │     API         │    │
│  │  Port: 3002     │                  │  │  (Express)      │    │
│  └─────────────────┘                  │  └─────────────────┘    │
│  ┌─────────────────┐                  │  ┌─────────────────┐    │
│  │  Magic Marker   │                  │  │   PostgreSQL    │    │
│  │  Web (Vite)     │                  │  │   Database      │    │
│  │  Port: 3004     │                  │  │                 │    │
│  └─────────────────┘                  │  └─────────────────┘    │
│                                       │  ┌─────────────────┐    │
│                                       │  │     Redis       │    │
│                                       │  │     Cache       │    │
│                                       │  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **Application Architecture**

### **Portal Application**
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Purpose**: Portfolio landing page
- **Features**: 
  - Space-themed design with custom background
  - Project showcase with links
  - Responsive design
  - Environment-aware configuration

### **Party Game Application**
- **Backend**: NestJS with WebSocket support
- **Frontend**: Next.js with real-time features
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Features**:
  - Real-time multiplayer gameplay
  - Room management
  - Game state synchronization
  - User authentication

### **Magic Marker Application**
- **Backend**: Express.js with AI integration
- **Frontend**: Vite + React
- **Database**: SQLite (development) / PostgreSQL (production)
- **Features**:
  - AI image analysis
  - Image generation
  - File upload handling
  - Question flow management

## 🔧 **Shared Architecture**

### **Shared Packages**
```
packages/
├── shared-types/           # Common TypeScript interfaces
├── shared-config/          # Configuration utilities
├── shared-ui/              # Reusable UI components
└── magic-marker-shared/    # Magic Marker specific types
```

### **Package Dependencies**
```
Portal → shared-types, shared-config, shared-ui
Party Game API → shared-types, shared-config
Party Game Web → shared-types, shared-config, shared-ui
Magic Marker API → magic-marker-shared
Magic Marker Web → magic-marker-shared
```

## 🌐 **Network Architecture**

### **Development Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Portal        │    │  Party Game     │    │  Magic Marker   │
│   :3000         │    │  API :3001      │    │  API :3003      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │  Party Game     │    │   PostgreSQL    │    │     Redis       │
         │  Web :3002      │    │   :5432         │    │   :6379         │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐
         │  Magic Marker   │    │     SQLite      │
         │  Web :3004      │    │   (Volume)      │
         └─────────────────┘    └─────────────────┘
```

### **Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Railway       │
│   - Portal      │    │   - Party Game  │    │   - Magic Marker│
│   - Party Game  │    │     API         │    │     API         │
│   - Magic Marker│    │   - PostgreSQL  │    │   - SQLite      │
│   (Frontend)    │    │   - Redis       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **Data Flow Architecture**

### **Portal Data Flow**
```
User Request → Portal (Vercel) → Static Content
                ↓
            Project Links → External Apps
```

### **Party Game Data Flow**
```
User → Party Game Web (Vercel) → Party Game API (Railway)
                                    ↓
                                PostgreSQL + Redis
```

### **Magic Marker Data Flow**
```
User → Magic Marker Web (Vercel) → Magic Marker API (Railway)
                                      ↓
                                  SQLite + AI Services
```

## 🛡️ **Security Architecture**

### **Network Security**
- **HTTPS**: All production traffic encrypted
- **CORS**: Configured for cross-origin requests
- **Environment Variables**: Sensitive data in environment configs

### **Application Security**
- **Input Validation**: All user inputs validated
- **Authentication**: JWT tokens for API access
- **Rate Limiting**: API rate limiting implemented
- **SQL Injection**: ORM prevents SQL injection

### **Infrastructure Security**
- **VPC**: Network isolation (AWS)
- **Security Groups**: Firewall rules
- **Encryption**: Data encrypted at rest and in transit

## 📊 **Performance Architecture**

### **Frontend Performance**
- **CDN**: Vercel global edge network
- **Image Optimization**: Next.js automatic optimization
- **Code Splitting**: Automatic code splitting
- **Caching**: Browser and CDN caching

### **Backend Performance**
- **Connection Pooling**: Database connection optimization
- **Caching**: Redis for session and data caching
- **Load Balancing**: Railway automatic scaling
- **Database Indexing**: Optimized database queries

## 🔍 **Monitoring Architecture**

### **Application Monitoring**
- **Logs**: Centralized logging
- **Metrics**: Performance metrics
- **Health Checks**: Service health monitoring
- **Error Tracking**: Error monitoring and alerting

### **Infrastructure Monitoring**
- **Resource Usage**: CPU, memory, disk monitoring
- **Network**: Traffic and latency monitoring
- **Database**: Query performance monitoring
- **Cost**: Cost tracking and optimization

## 🚀 **Scalability Architecture**

### **Horizontal Scaling**
- **Frontend**: Vercel automatic scaling
- **Backend**: Railway automatic scaling
- **Database**: Read replicas and connection pooling
- **Cache**: Redis clustering

### **Vertical Scaling**
- **Instance Types**: Easy resource upgrades
- **Storage**: Auto-scaling storage
- **Memory**: Dynamic memory allocation

## 🔄 **Deployment Architecture**

### **CI/CD Pipeline**
```
Git Push → GitHub Actions → Build → Test → Deploy
                                    ↓
                            Vercel (Frontend)
                                    ↓
                            Railway (Backend)
```

### **Environment Management**
- **Development**: Local Docker environment
- **Staging**: Vercel preview deployments
- **Production**: Vercel + Railway production

## 📈 **Future Architecture Considerations**

### **Microservices Evolution**
- **Service Mesh**: Istio for service communication
- **API Gateway**: Centralized API management
- **Event Streaming**: Kafka for event-driven architecture

### **Cloud-Native Features**
- **Kubernetes**: Container orchestration
- **Service Discovery**: Automatic service discovery
- **Config Management**: Centralized configuration
- **Secrets Management**: Secure secret handling

---

*This architecture document will be updated as the system evolves and new requirements emerge.*
