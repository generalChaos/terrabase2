# Magic Marker Documentation

AI-powered image analysis and generation tool with advanced computer vision capabilities and creative AI features.

## 📋 **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Guide](#setup-guide)
- [API Reference](#api-reference)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Development Log](#development-log)

## 🎯 **Overview**

Magic Marker is a full-stack Next.js application that combines AI image analysis with creative image generation. Users can upload images, receive AI-generated questions about the content, answer those questions, and then generate new images based on their responses.

### **Key Capabilities**
- **Image Analysis**: GPT-4o analyzes uploaded images and generates 10 multiple-choice questions
- **Interactive Q&A**: Users answer questions about the image content
- **AI Image Generation**: DALL-E 3 creates new images based on user answers
- **Secure Storage**: All images and data stored in Supabase
- **Real-time Processing**: Fast AI processing with comprehensive error handling

## ✨ **Features**

### **Core Features**
- ✅ **Drag & Drop Upload**: Intuitive image upload interface
- ✅ **AI Image Analysis**: GPT-4o vision model analyzes image content
- ✅ **Dynamic Question Generation**: 10 contextually relevant questions per image
- ✅ **Interactive Question Flow**: Multiple-choice questions with validation
- ✅ **AI Image Generation**: DALL-E 3 creates images based on answers
- ✅ **Image Gallery**: Browse and manage uploaded images
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile

### **Technical Features**
- ✅ **Next.js API Routes**: Serverless backend functions
- ✅ **Supabase Integration**: Database, storage, and authentication
- ✅ **OpenAI Integration**: GPT-4o and DALL-E 3 APIs
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **E2E Testing**: Playwright test suite for full functionality
- ✅ **Performance Optimized**: Fast loading and efficient processing

## 🏗️ **Architecture**

### **Frontend (Next.js App Router)**
```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── upload/            # Image upload endpoint
│   │   ├── images/            # Image management endpoints
│   │   ├── test-openai/       # OpenAI testing endpoint
│   │   └── test-errors/       # Error testing endpoint
│   ├── page.tsx               # Main application page
│   └── layout.tsx             # Root layout
├── components/                 # React components
│   ├── ImageUpload.tsx        # Upload interface
│   ├── QuestionFlow.tsx       # Question answering flow
│   ├── ImageGallery.tsx       # Image browsing
│   └── LoadingSpinner.tsx     # Loading states
└── lib/                       # Utilities and services
    ├── openai.ts              # OpenAI service
    ├── supabase.ts            # Supabase client
    ├── types.ts               # TypeScript types
    └── error-handler.ts       # Error handling utilities
```

### **Backend (Next.js API Routes)**
- **`/api/upload`**: Handles image upload, analysis, and storage
- **`/api/images`**: Lists all uploaded images
- **`/api/images/[id]`**: Retrieves specific image data
- **`/api/images/generate`**: Generates new images based on answers
- **`/api/test-openai`**: Tests OpenAI API connectivity
- **`/api/test-errors`**: Tests error handling scenarios

### **Database Schema (Supabase)**
```sql
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_image_path TEXT NOT NULL,
  analysis_result TEXT,
  questions JSONB,
  answers JSONB,
  final_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **External Services**
- **Supabase**: Database, file storage, and authentication
- **OpenAI**: GPT-4o for image analysis, DALL-E 3 for image generation

## 🚀 **Setup Guide**

### **Prerequisites**
- Node.js 18+
- pnpm 8+
- Supabase account
- OpenAI API key

### **Environment Setup**

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com and create a new project
   # Get your project URL and anon key from Settings > API
   ```

2. **Set up Environment Variables**
   ```bash
   # Create .env.local file
   touch apps/magic-marker/web/.env.local
   ```

   Add the following content:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # OpenAI API Configuration
   OPENAI_API_KEY=sk-proj-your-openai-api-key
   ```

3. **Database Setup**
   ```sql
   -- Run this in your Supabase SQL editor
   CREATE TABLE IF NOT EXISTS images (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     original_image_path TEXT NOT NULL,
     analysis_result TEXT,
     questions JSONB,
     answers JSONB,
     final_image_path TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE images ENABLE ROW LEVEL SECURITY;

   -- Create policy for public access
   CREATE POLICY "Allow public access" ON images FOR ALL USING (true);
   ```

4. **Storage Setup**
   ```bash
   # In Supabase dashboard:
   # 1. Go to Storage
   # 2. Create a new bucket called "images"
   # 3. Set it to public
   ```

### **Installation**

```bash
# Install dependencies
cd apps/magic-marker/web
pnpm install

# Start development server
pnpm dev

# The app will be available at http://localhost:3002
```

## 📚 **API Reference**

### **Upload Image**
```http
POST /api/upload
Content-Type: multipart/form-data

FormData:
- image: File (required)
```

**Response:**
```json
{
  "success": true,
  "imageAnalysisId": "uuid",
  "questions": [
    {
      "id": "q_0",
      "text": "What is the main subject of this image?",
      "type": "multiple_choice",
      "options": ["Person", "Animal", "Object", "Landscape"],
      "required": true
    }
    // ... 9 more questions
  ]
}
```

### **Get All Images**
```http
GET /api/images
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "original_image_path": "https://...",
      "analysis_result": "This image shows...",
      "questions": [...],
      "answers": [...],
      "final_image_path": "https://...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### **Get Specific Image**
```http
GET /api/images/[id]
```

### **Generate Image**
```http
POST /api/images/generate
Content-Type: application/json

{
  "imageAnalysisId": "uuid",
  "answers": [
    {
      "questionId": "q_0",
      "answer": "Person"
    }
    // ... answers for all questions
  ]
}
```

**Response:**
```json
{
  "success": true,
  "finalImagePath": "https://..."
}
```

## 🧪 **Testing**

### **E2E Tests**
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run with browser visible
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug
```

### **Test Coverage**
- **Upload Flow**: File upload, validation, and processing
- **API Endpoints**: All API routes with various scenarios
- **Error Handling**: Network errors, API errors, validation errors
- **UI Components**: User interactions and state management
- **Integration**: Full user journey from upload to generation

### **Manual Testing**
```bash
# Test OpenAI connectivity
curl http://localhost:3002/api/test-openai

# Test error handling
curl http://localhost:3002/api/test-errors

# Test image upload (use Postman or similar)
curl -X POST -F "image=@test-image.jpg" http://localhost:3002/api/upload
```

## 🚀 **Deployment**

### **Vercel Deployment**
```bash
# Deploy to Vercel
cd apps/magic-marker/web
vercel --prod

# Or use Git integration for automatic deployments
```

### **Environment Variables (Production)**
Set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### **Build Verification**
```bash
# Test production build locally
pnpm build
pnpm start

# Verify all API endpoints work
curl http://localhost:3000/api/test-openai
```

## 🔧 **Troubleshooting**

### **Common Issues**

**OpenAI API Errors:**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**Supabase Connection Issues:**
```bash
# Verify environment variables
cat .env.local

# Check Supabase project status in dashboard
```

**Build Errors:**
```bash
# Clean and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

**Upload Issues:**
```bash
# Check file size limits (10MB max)
# Verify file types (JPEG, PNG, GIF, WebP)
# Check Supabase storage bucket configuration
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check browser console for client-side errors
# Check terminal for server-side errors
```

## 📝 **Development Log**

See [Development Log](devlog.md) for detailed history of development decisions, challenges, and solutions.

## 🤝 **Contributing**

This is a personal project, but feel free to explore the code and learn from the implementation.

## 📄 **License**

Private project - All rights reserved.
