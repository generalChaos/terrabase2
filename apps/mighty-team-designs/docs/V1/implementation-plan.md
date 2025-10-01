# V1 Implementation Plan - Mighty Team Designs

## 🎯 **Overview**

This document outlines the complete implementation plan for the V1 version of the Mighty Team Designs app, focusing on mobile-first design and AI-driven logo generation.

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: Next.js 14+ (existing app)
- **State Management**: React Context with useReducer
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel

### **Backend Services**
- **API Routes**: Next.js API routes for web logic
- **Image Processing**: Existing Python FastAPI server (no changes needed)
- **AI Integration**: OpenAI (GPT-4o-mini + DALL-E)
- **Asset Generation**: Python-based image processing
- **Deployment**: Keep existing Python server running

### **Asset Management**
- **Storage**: Supabase Storage for generated assets
- **Processing**: Existing Python FastAPI server
- **Cleanup**: 7-day retention policy
- **CDN**: Vercel Edge Network for fast delivery
- **Upscaling**: Basic OpenCV upscaling (admin tool future)

## 📋 **Implementation Phases**

### **Phase 1: Core Flow Updates (Week 1-2)**

#### **1.1 Update Round1 Form**
**Current State**: Team name, sport, age group
**New Requirements**: Add logo style selection

**Tasks:**
- [ ] Add logo style selection component
- [ ] Create 4 visual style options with images
- [ ] Update form validation
- [ ] Add smooth transitions between questions
- [ ] Mobile-optimize layout

**Components to Build:**
```typescript
// New component: LogoStyleSelector
interface LogoStyle {
  id: string;
  name: string;
  description: string;
  image: string;
  characteristics: string[];
}
```

#### **1.2 Replace Round2 Form**
**Current State**: Dynamic questions based on sport/age
**New Requirements**: Color and mascot selection

**Tasks:**
- [ ] Build color selection interface
- [ ] Build mascot selection interface
- [ ] Integrate AI generation for options
- [ ] Add loading states for AI calls
- [ ] Implement option selection logic

**Components to Build:**
```typescript
// ColorSelection component
interface ColorOption {
  id: string;
  name: string;
  hex: string;
  description: string;
}

// MascotSelection component
interface MascotOption {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
}
```

#### **1.3 Build Enhanced Loading Component**
**Current State**: Simple loading spinner
**New Requirements**: 5-minute progress + player input

**Tasks:**
- [ ] Create progress counter component
- [ ] Add player input form
- [ ] Implement auto-redirect logic
- [ ] Add email/phone capture
- [ ] Create QR code generation
- [ ] Add session persistence

**Components to Build:**
```typescript
// LoadingScreen component
interface LoadingState {
  progress: number;
  timeRemaining: number;
  players: Player[];
  email: string;
  phone: string;
}
```

#### **1.4 Redesign Results Page**
**Current State**: Basic logo selection and download
**New Requirements**: 3-section layout as designed

**Tasks:**
- [ ] Implement Section 1: Team info + roster
- [ ] Implement Section 2: Asset customization
- [ ] Implement Section 3: Logo selection + download
- [ ] Add responsive design for mobile
- [ ] Integrate with asset generation

### **Phase 2: Asset Integration (Week 3-4)**

#### **2.1 Simplified API Integration**
**Decision**: Use existing Python server, skip complex compute functions

**Tasks:**
- [ ] Keep existing image-processor service running
- [ ] Add Supabase integration to existing services
- [ ] Update API client to use existing endpoints
- [ ] Add basic monitoring and error handling

**Current Working Endpoints:**
```python
# Already working in image-processor
POST /api/v1/process-logo/optimized    # Logo cleanup
POST /api/v1/generate-asset-pack       # Asset generation
POST /api/v1/generate-roster-banner    # Banner generation
POST /api/v1/upscale                   # Basic upscaling (OpenCV)
```

**API Client Updates:**
```typescript
// Simple API client for existing endpoints
const imageProcessor = {
  cleanLogo: (logoUrl: string) => fetch('/api/v1/process-logo/optimized', {...}),
  generateAssetPack: (data: AssetPackRequest) => fetch('/api/v1/generate-asset-pack', {...}),
  generateBanner: (data: BannerRequest) => fetch('/api/v1/generate-roster-banner', {...})
}
```

#### **2.2 API Client Configuration**
**Tasks:**
- [ ] Implement environment-based configuration
- [ ] Add basic retry logic for network errors
- [ ] Implement simple error handling
- [ ] Add request/response logging
- [ ] Set up basic monitoring

#### **2.3 Asset Pack Generation**
**Tasks:**
- [ ] Integrate with existing Python server
- [ ] Generate t-shirt front/back images
- [ ] Generate banner with roster
- [ ] Handle multiple logo variants
- [ ] Implement asset storage in Supabase

#### **2.4 Player Roster Management**
**Tasks:**
- [ ] Build player input form
- [ ] Add player editing capabilities
- [ ] Implement roster validation
- [ ] Add player deletion
- [ ] Sync with asset generation

#### **2.5 Simple Order Form**
**Tasks:**
- [ ] Create order form component
- [ ] Build contact information collection
- [ ] Implement asset request checkboxes
- [ ] Add special requests textarea
- [ ] Create email service integration
- [ ] Implement order email sending

#### **2.6 Download System**
**Tasks:**
- [ ] Implement logo download
- [ ] Implement asset pack download
- [ ] Add download progress tracking
- [ ] Handle large file downloads
- [ ] Add download error handling

### **Phase 3: Polish & Optimization (Week 5-6)**

#### **3.1 Mobile Optimization**
**Tasks:**
- [ ] Optimize touch interactions
- [ ] Improve mobile performance
- [ ] Add mobile-specific animations
- [ ] Test on various devices
- [ ] Optimize image loading

#### **3.2 Performance**
**Tasks:**
- [ ] Implement image lazy loading
- [ ] Add caching strategies
- [ ] Optimize bundle size
- [ ] Add performance monitoring
- [ ] Implement error boundaries

#### **3.3 Error Handling**
**Tasks:**
- [ ] Add comprehensive error states
- [ ] Implement retry mechanisms
- [ ] Add user-friendly error messages
- [ ] Handle network failures
- [ ] Add fallback options

#### **3.4 Testing**
**Tasks:**
- [ ] Write component tests
- [ ] Add integration tests
- [ ] Test AI integration
- [ ] Test asset generation
- [ ] Add E2E tests

## 🗂️ **File Structure**

```
party-game/
├── apps/
│   ├── mighty-team-designs/      # Next.js frontend app
│   └── image-processor/          # Python FastAPI server
├── packages/
│   ├── shared-image-processing/  # Python shared package
│   ├── shared-types/             # TypeScript shared types
│   └── shared-config/            # Shared configurations
├── apps/mighty-team-designs/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── compute/      # Python compute functions
│   │   │   │   ├── ai/           # AI integration
│   │   │   │   └── assets/       # Asset management
│   │   │   ├── components/
│   │   │   │   ├── creation/     # Creation flow components
│   │   │   │   ├── results/      # Results page components
│   │   │   │   └── shared/       # Shared components
│   │   │   └── contexts/
│   │   │       └── CreationContext.tsx
│   │   ├── lib/
│   │   │   ├── ai/               # AI service functions
│   │   │   ├── assets/           # Asset management
│   │   │   ├── compute/          # Compute function clients
│   │   │   ├── config.ts         # Environment configuration
│   │   │   └── apiClient.ts      # API client with retry logic
│   │   └── types/
│   │       └── creation.ts       # Creation flow types
```

## 🔧 **Development Setup**

### **Prerequisites**
- Node.js 18+
- Python 3.9+
- Supabase account
- OpenAI API key
- Vercel account

### **Environment Variables**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Image Processor
IMAGE_PROCESSOR_BASE_URL=http://localhost:8000/api/v1
IMAGE_PROCESSOR_TIMEOUT=30000
IMAGE_PROCESSOR_RETRIES=3
IMAGE_PROCESSOR_RETRY_DELAY=1000

# Vercel
VERCEL_PROJECT_ID=
```

### **Installation**
```bash
# Install all dependencies (including shared packages)
pnpm install

# Install Python dependencies for image-processor
cd apps/image-processor
pip install -r requirements.txt

# Install shared Python package
cd ../../packages/shared-image-processing
pip install -e .

# Set up Supabase
cd ../../apps/mighty-team-designs
npx supabase init
npx supabase start

# Run development server
pnpm dev
```

## 📊 **Success Metrics**

### **Technical Metrics**
- **Page Load Time**: < 2 seconds
- **Logo Generation Time**: < 5 minutes
- **Asset Generation Time**: < 30 seconds
- **Mobile Performance Score**: > 90
- **Error Rate**: < 1%

### **User Experience Metrics**
- **Completion Rate**: > 80%
- **User Satisfaction**: > 4.5/5
- **Mobile Usage**: > 70%
- **Return Rate**: > 40%

## 🚀 **Deployment Strategy**

### **Staging Environment**
- Deploy to Vercel preview
- Test with real AI generation
- Validate asset generation
- Test mobile experience

### **Production Deployment**
- Deploy to Vercel production
- Set up monitoring
- Configure error tracking
- Set up analytics

## 📝 **Next Steps**

1. **Start with Phase 1.1**: Update Round1 form with logo style selection
2. **Set up development environment**: Ensure all tools are configured
3. **Create component library**: Set up shadcn/ui components
4. **Begin AI integration**: Set up OpenAI API calls
5. **Integrate existing Python server**: Connect to working image processing endpoints
6. **Implement simple API client**: Basic retry logic and error handling

## 📚 **Related Documentation**

- [Scale Strategy](./scale-strategy.md) - Future scaling considerations and options
- [API Client Configuration](./api-client-configuration.md) - API client setup and configuration
- [Creation Process Decisions](../creation-process/decisions-summary.md) - Design decisions and user flow
- [Result Page Layout](../result-page/layout-design.md) - Results page design and implementation

This implementation plan provides a clear roadmap for building the V1 version of the Mighty Team Designs app with a focus on mobile-first design, AI-driven logo generation, and leveraging existing proven infrastructure.
