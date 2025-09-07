# Magic Marker Documentation

AI-powered image analysis and generation tool with advanced computer vision capabilities and creative AI features.

## 📋 **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Disambiguation Strategy](#disambiguation-strategy)
- [Database Schema](#database-schema)
- [Setup Guide](#setup-guide)
- [API Reference](#api-reference)
- [Development](#development)
- [Debug Endpoints](#debug-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Development Log](#development-log)

## 🎯 **Overview**

Magic Marker is a full-stack Next.js application that helps children bring their character drawings to life as professional illustrations. The system uses AI to understand, disambiguate, and enhance children's creative visions through an engaging question-and-answer flow.

### **Key Capabilities**
- **Character Analysis**: GPT-4o analyzes children's character drawings with conversational, enthusiastic analysis
- **Disambiguation Questions**: AI generates simple, fun questions to clarify ambiguous elements
- **Interactive Q&A**: Children answer questions about their character design and personality
- **Professional Image Generation**: DALL-E 3 creates polished illustrations based on clarified character details
- **Schema Enforcement**: Robust JSON schema validation ensures consistent AI responses
- **Secure Storage**: All images and data stored in Supabase with comprehensive flow tracking

## ✨ **Features**

### **Core Features**
- ✅ **Character Drawing Upload**: Intuitive drag & drop interface for character drawings
- ✅ **Conversational Analysis**: GPT-4o provides enthusiastic, understanding analysis of children's drawings
- ✅ **Smart Disambiguation**: AI identifies ambiguities and generates fun, simple questions
- ✅ **Interactive Character Q&A**: Children answer questions about their character's design and personality
- ✅ **Professional Illustration**: DALL-E 3 creates polished character illustrations
- ✅ **Schema-Enforced AI**: Robust JSON schema validation ensures consistent AI responses
- ✅ **Flow Tracking**: Complete analysis flow tracking with context management
- ✅ **Result Display**: Beautiful comparison of original drawing and final illustration

### **Admin Features**
- ✅ **Admin Dashboard**: Centralized management interface
- ✅ **Prompt Management**: Create, edit, and reorder AI prompts
- ✅ **Prompt Tester**: Interactive testing interface with real-time validation
- ✅ **Conversational Q&A Testing**: Step-by-step conversation flow testing with visual progress tracking
- ✅ **Image Gallery**: Browse and manage all generated images with statistics
- ✅ **Analytics Dashboard**: Performance metrics and usage statistics
- ✅ **System Status**: Health monitoring and configuration validation
- ✅ **Database Prompts**: Dynamic prompt system with fallback support

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
│   ├── admin/                 # Admin interface
│   │   ├── page.tsx          # Admin dashboard
│   │   ├── prompts/          # Prompt management
│   │   ├── images/           # Image gallery
│   │   ├── analytics/        # Analytics dashboard
│   │   └── status/           # System status
│   ├── api/                   # API routes
│   │   ├── admin/            # Admin API endpoints
│   │   │   ├── prompts/      # Prompt management API
│   │   │   ├── analytics/    # Analytics API
│   │   │   └── status/       # System status API
│   │   ├── upload/           # Image upload endpoint
│   │   ├── images/           # Image management endpoints
│   │   ├── test-openai/      # OpenAI testing endpoint
│   │   └── test-errors/      # Error testing endpoint
│   ├── result/               # Result display page
│   ├── page.tsx              # Main application page
│   └── layout.tsx            # Root layout
├── components/                # React components
│   ├── AdminLayout.tsx       # Admin navigation layout
│   ├── ImageUpload.tsx       # Upload interface
│   ├── QuestionFlow.tsx      # Question answering flow
│   ├── ImageGallery.tsx      # Image browsing
│   └── LoadingSpinner.tsx    # Loading states
└── lib/                      # Utilities and services
    ├── openai.ts             # OpenAI service
    ├── supabase.ts           # Supabase client
    ├── promptService.ts      # Prompt management service
    ├── types.ts              # TypeScript types
    └── error-handler.ts      # Error handling utilities
```

### **Backend (Next.js API Routes)**
- **`/api/upload`**: Handles image upload, analysis, and storage
- **`/api/images`**: Lists all uploaded images
- **`/api/images/[id]`**: Retrieves specific image data
- **`/api/images/generate`**: Generates new images based on answers
- **`/api/admin/prompts`**: CRUD operations for prompt management
- **`/api/admin/analytics`**: Returns prompt performance analytics
- **`/api/admin/status`**: System health and configuration status
- **`/api/test-openai`**: Tests OpenAI API connectivity
- **`/api/test-errors`**: Tests error handling scenarios

### **Database Schema (Supabase)**
```sql
-- Prompt definitions table for AI prompt management
CREATE TABLE prompt_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  prompt_text TEXT NOT NULL,
  model VARCHAR DEFAULT 'gpt-4o' NOT NULL,
  response_format VARCHAR DEFAULT 'json_object' NOT NULL,
  max_tokens INTEGER,
  temperature NUMERIC(2,1),
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table for storing character drawings and generated illustrations
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_result TEXT NOT NULL,
  image_type VARCHAR NOT NULL, -- 'original', 'additional', 'final'
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis flows table for tracking complete character analysis sessions
CREATE TABLE analysis_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  original_image_id UUID NOT NULL,
  additional_image_ids UUID[] DEFAULT '{}',
  final_image_id UUID,
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  current_step VARCHAR,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  context_data JSONB DEFAULT '{}',
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image processing steps table for detailed step tracking
CREATE TABLE image_processing_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  step_type VARCHAR NOT NULL,
  step_order INTEGER NOT NULL,
  prompt_id VARCHAR,
  prompt_content TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  response_time_ms INTEGER DEFAULT 0,
  tokens_used INTEGER,
  model_used VARCHAR NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **External Services**
- **Supabase**: Database, file storage, and authentication
- **OpenAI**: GPT-4o for image analysis, GPT-5 for conversational tasks, DALL-E 3 for image generation

## 🎨 **Disambiguation Strategy**

Magic Marker uses a sophisticated disambiguation strategy to help children bring their character drawings to life. The approach focuses on making children feel like creative directors of their own characters.

### **Core Philosophy**
- **Child as Creative Director**: Children make important decisions about their character
- **Preserve Original Vision**: Final image feels like "their character, but better"
- **Transform Ambiguities into Strengths**: Unclear elements become creative opportunities

### **Three-Phase Flow**
1. **Analysis Phase**: Decode the child's creative vision with enthusiastic understanding
2. **Disambiguation Phase**: Generate simple, fun questions to clarify ambiguous elements
3. **Image Synthesis Phase**: Create professional illustration preserving the child's vision

### **Key Principles**
- **Visual disambiguation first** (shapes, colors, features)
- **Character concepts second** (personality, mood, abilities)
- **Simple, fun questions** that feel like a creative game
- **Show enthusiasm** and understanding of their vision

For detailed strategy documentation, see [Disambiguation Strategy Guide](DISAMBIGUATION_STRATEGY.md).

## 🗄️ **Database Schema**

Magic Marker uses a comprehensive database schema designed for character drawing analysis and flow tracking.

### **Core Tables**

#### **`prompt_definitions`**
Stores AI prompt configurations with input/output schemas:
- **`image_analysis`**: Analyzes character drawings with conversational tone
- **`questions_generation`**: Generates disambiguation questions
- **`image_generation`**: Creates professional illustrations

#### **`analysis_flows`**
Tracks complete character analysis sessions:
- Session management and progress tracking
- Question and answer storage
- Context data and flow state
- Cost and token usage tracking

#### **`images`**
Stores all image data:
- Original character drawings
- Generated illustrations
- File metadata and storage paths

#### **`image_processing_steps`**
Detailed step-by-step processing logs:
- Input/output data for each AI interaction
- Response times and token usage
- Error tracking and debugging information

### **Schema Enforcement**
All AI interactions use strict JSON schema validation:
- **Input schemas**: Define required parameters for each prompt type
- **Output schemas**: Validate AI responses before processing
- **Type safety**: Full TypeScript integration with database schemas

### **Context Management**
Simplified context structure for better AI performance:
- `imageAnalysis`: Results from analysis step
- `previousAnswers`: User responses to questions
- `stepResults`: Output from each processing step
- `conversationHistory`: Context across interactions
- `flow_summary`: Complete flow summary for image generation

For detailed database documentation, see [Database Schema Guide](DATABASE_SCHEMA.md).

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

## 🎛️ **Admin Interface**

The admin interface provides comprehensive management tools for the Magic Marker application:

### **Admin Dashboard (`/admin`)**
- **Overview**: System status and quick actions
- **Navigation**: Access to all admin functions
- **Quick Actions**: Test prompts and run diagnostics

### **Prompt Management (`/admin/prompts`)**
- **Create Prompts**: Add new AI prompts with custom content
- **Edit Prompts**: Modify existing prompt content and settings
- **Reorder Prompts**: Drag and drop to change prompt priority
- **Toggle Active**: Enable/disable prompts for A/B testing
- **Database Integration**: Dynamic prompt system with fallback support

### **Prompt Tester (`/admin/prompt-tester`)**
- **Interactive Testing**: Test any prompt with real inputs and see live results
- **Schema Validation**: Real-time input/output validation with detailed error messages
- **Image Upload**: Direct image upload for image-based prompts with base64 conversion
- **Conversational Q&A Flow**: Specialized testing interface for conversational prompts
  - **Step-by-step Instructions**: Clear guidance on how to test conversation flows
  - **Visual Progress Tracking**: Progress bar and question status indicators
  - **Answer Selection**: Interactive multiple-choice question answering
  - **Conversation Summary**: AI-generated summary when conversation completes
  - **Statistics Dashboard**: Track questions asked, answered, and completion status
  - **Reset Functionality**: Start new conversations for repeated testing

### **Image Gallery (`/admin/images`)**
- **Browse Images**: View all uploaded and generated images
- **Statistics**: Total, completed, and in-progress image counts
- **Image Details**: View original and generated images side by side
- **Management**: Organize and manage image collections

### **Analytics Dashboard (`/admin/analytics`)**
- **Performance Metrics**: Success rates, response times, token usage
- **Usage Statistics**: Request counts and prompt popularity
- **Visual Charts**: Progress bars and performance indicators
- **Historical Data**: Track performance over time

### **System Status (`/admin/status`)**
- **Health Monitoring**: Database, OpenAI, and Supabase connectivity
- **Configuration Validation**: Environment variables and setup
- **Storage Status**: File upload and storage availability
- **Quick Diagnostics**: Test system components and troubleshoot issues

## 📚 **API Reference**

### **Production API Endpoints**

The following are the main production API endpoints for the Magic Marker application:

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

#### **Using Debug Endpoints**
```bash
# Test system health
curl http://localhost:3002/api/debug/deployment

# Test OpenAI connectivity
curl http://localhost:3002/api/debug/openai

# Test error handling
curl "http://localhost:3002/api/debug/errors?type=openai"

# Test analysis flow system
curl "http://localhost:3002/api/debug/analysis-flows?type=all"
```

#### **Production API Testing**
```bash
# Test image upload (use Postman or similar)
curl -X POST -F "image=@test-image.jpg" http://localhost:3002/api/upload

# Test conversational Q&A flow
curl -X POST http://localhost:3002/api/test-prompt \
  -H "Content-Type: application/json" \
  -d '{"promptName": "conversational_question", "input": {"prompt": "I want to create an image. Help me discover my artistic preferences through a fun conversation."}}'
```

For comprehensive debug endpoint documentation, see the [Debug Endpoints](#debug-endpoints) section.

### **Conversational Q&A Testing**
The admin interface includes a specialized testing tool for conversational prompts:

1. **Navigate to `/admin/prompt-tester`**
2. **Select "conversational_question"** from the prompt list
3. **Click "Run Test"** to start the conversation
4. **Answer questions** by clicking on the provided options
5. **Click "Next Question"** to generate follow-up questions
6. **Watch the conversation evolve** as the AI learns about preferences
7. **View the summary** when the conversation completes

**Features:**
- **Real-time Progress**: Visual progress bar and question status
- **Interactive UI**: Click to answer questions and advance the conversation
- **Conversation Tracking**: See all questions and answers in one place
- **AI Summary**: Get a summary of what the AI learned
- **Reset & Restart**: Start new conversations for repeated testing

## 🐛 **Debug Endpoints**

Magic Marker includes a comprehensive set of debug API endpoints for development, troubleshooting, and system validation. These endpoints are designed to be called directly from the terminal, browser, or admin interface.

### **Available Debug Endpoints**

#### **System Health & Diagnostics**
- **`/api/debug/deployment`** - System health check and environment validation
- **`/api/debug/prompts`** - Prompt system validation and database connectivity
- **`/api/debug/errors`** - Error handling validation with various error scenarios

#### **OpenAI Integration Tests**
- **`/api/debug/openai`** - OpenAI API connectivity and basic functionality
- **`/api/debug/image-generation`** - Complete image generation pipeline test
- **`/api/debug/image-text`** - Image analysis and text extraction test

#### **Analysis Flow System**
- **`/api/debug/analysis-flows`** - Test the new analysis flow system
  - `?type=create` - Test creating new analysis flows
  - `?type=list` - Test listing analysis flows
  - `?type=active` - Test getting active analysis flows
  - `?type=all` - Run comprehensive analysis flow tests

### **Usage Examples**

#### **Quick System Check**
```bash
# Check system health
curl http://localhost:3002/api/debug/deployment

# Test prompt system
curl http://localhost:3002/api/debug/prompts

# Test OpenAI integration
curl http://localhost:3002/api/debug/openai
```

#### **Error Testing**
```bash
# Test different error scenarios
curl "http://localhost:3002/api/debug/errors?type=openai"
curl "http://localhost:3002/api/debug/errors?type=supabase"
curl "http://localhost:3002/api/debug/errors?type=timeout"
```

#### **Analysis Flow Testing**
```bash
# Test analysis flow system
curl "http://localhost:3002/api/debug/analysis-flows?type=all"
curl "http://localhost:3002/api/debug/analysis-flows?type=create"
```

### **Integration with Admin UI**

Debug endpoints are accessible through the admin interface:
- **Admin Dashboard** (`/admin`) - Quick action buttons for system tests
- **Admin Status Page** (`/admin/status`) - Detailed system diagnostics
- **Admin Prompt Tester** (`/admin/prompt-tester`) - Interactive prompt testing

### **Important Notes**

- **Development Only**: These endpoints are for development and debugging only
- **Not Production Ready**: Do not expose these endpoints in production
- **Sensitive Information**: May return sensitive system information
- **Manual Testing**: Designed for manual testing via curl, browser, or admin UI
- **Not Integration Tests**: These are debug tools, not automated integration tests

For more detailed information, see the [Debug Endpoints Documentation](../src/app/api/debug/README.md).

.a## 🚀 **Deployment**

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

# Verify all API endpoints work using debug endpoints
curl http://localhost:3002/api/debug/deployment
curl http://localhost:3002/api/debug/openai
curl http://localhost:3002/api/debug/prompts
```

## 🔧 **Troubleshooting**

### **Using Debug Endpoints for Troubleshooting**

The debug endpoints are invaluable for diagnosing issues:

```bash
# Comprehensive system health check
curl http://localhost:3002/api/debug/deployment

# Test specific components
curl http://localhost:3002/api/debug/openai
curl http://localhost:3002/api/debug/prompts
curl "http://localhost:3002/api/debug/errors?type=openai"
```

### **Common Issues**

**OpenAI API Errors:**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connectivity using debug endpoint
curl http://localhost:3002/api/debug/openai

# Test API connectivity directly
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**Supabase Connection Issues:**
```bash
# Verify environment variables
cat .env.local

# Test Supabase connectivity using debug endpoint
curl http://localhost:3002/api/debug/deployment

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
