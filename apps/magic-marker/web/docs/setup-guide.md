# Magic Marker Setup Guide

Complete setup guide for the Magic Marker application, including local development, deployment, and troubleshooting.

## 📋 **Prerequisites**

Before setting up Magic Marker, ensure you have the following:

### **Required Software**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

### **Required Accounts**
- **Supabase Account** - [Sign up here](https://supabase.com/)
- **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys)

### **System Requirements**
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space
- **Internet**: Stable connection for API calls

## 🚀 **Quick Start**

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/party-game.git
cd party-game
```

### **2. Install Dependencies**
```bash
pnpm install
```

### **3. Set Up Environment**
```bash
# Copy environment template
cp apps/magic-marker/web/.env.example apps/magic-marker/web/.env.local
```

### **4. Configure Services**
Follow the detailed setup sections below for Supabase and OpenAI.

### **5. Start Development**
```bash
cd apps/magic-marker/web
pnpm dev
```

The application will be available at `http://localhost:3002`.

## 🗄️ **Supabase Setup**

### **1. Create Supabase Project**

1. Go to [supabase.com](https://supabase.com/)
2. Click "Start your project"
3. Sign in with GitHub or create an account
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name**: `magic-marker` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your location
7. Click "Create new project"

### **2. Get Project Credentials**

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)

### **3. Set Up Database**

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Run the following SQL:

```sql
-- Create images table
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for your use case)
CREATE POLICY "Allow public access" ON images FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at 
    BEFORE UPDATE ON images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the SQL

### **4. Set Up Storage**

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Enter bucket details:
   - **Name**: `images`
   - **Public bucket**: ✅ **Check this box**
4. Click "Create bucket"
5. Go to **Storage** > **Policies**
6. Create a new policy for the `images` bucket:

```sql
-- Allow public access to images bucket
CREATE POLICY "Allow public access" ON storage.objects FOR ALL USING (bucket_id = 'images');
```

## 🤖 **OpenAI Setup**

### **1. Get API Key**

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign in or create an account
3. Go to **API Keys**
4. Click "Create new secret key"
5. Enter a name (e.g., "Magic Marker")
6. Copy the API key (starts with `sk-proj-...`)

### **2. Add Credits**

1. Go to **Billing** in your OpenAI dashboard
2. Add payment method if not already added
3. Add credits to your account (minimum $5 recommended)

### **3. Test API Key**

```bash
# Test your API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
```

You should see a JSON response with available models.

## ⚙️ **Environment Configuration**

### **1. Create Environment File**

```bash
cd apps/magic-marker/web
touch .env.local
```

### **2. Add Configuration**

Edit `.env.local` and add the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

### **3. Verify Configuration**

```bash
# Check if environment variables are loaded
cd apps/magic-marker/web
node -e "console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set')"
```

## 🧪 **Testing Setup**

### **1. Install Playwright**

```bash
cd apps/magic-marker/web
pnpm install
npx playwright install
```

### **2. Run Tests**

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run specific test
pnpm test:e2e --grep "upload"
```

### **3. Test API Endpoints**

```bash
# Test OpenAI connectivity
curl http://localhost:3002/api/test-openai

# Test error handling
curl http://localhost:3002/api/test-errors

# Test image upload (replace with actual image file)
curl -X POST -F "image=@test-image.jpg" http://localhost:3002/api/upload
```

## 🚀 **Development Workflow**

### **1. Start Development Server**

```bash
cd apps/magic-marker/web
pnpm dev
```

### **2. Verify Setup**

1. Open `http://localhost:3002`
2. Try uploading an image
3. Check browser console for errors
4. Check terminal for server logs

### **3. Common Development Tasks**

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Clean build artifacts
rm -rf .next
```

## 🌐 **Deployment Setup**

### **1. Vercel Deployment**

#### **Option A: Git Integration (Recommended)**

1. Go to [vercel.com](https://vercel.com/)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/magic-marker/web`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
7. Click "Deploy"

#### **Option B: CLI Deployment**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd apps/magic-marker/web
vercel --prod
```

### **2. Environment Variables (Production)**

Set these in your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-proj-your-openai-api-key
```

### **3. Verify Deployment**

1. Check your Vercel deployment URL
2. Test image upload functionality
3. Verify API endpoints work
4. Check error handling

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. "OpenAI API key not configured" Error**

**Problem**: Application shows OpenAI API key error.

**Solutions**:
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Verify .env.local file exists and has correct content
cat apps/magic-marker/web/.env.local

# Restart development server
pnpm dev
```

#### **2. Supabase Connection Issues**

**Problem**: Cannot connect to Supabase.

**Solutions**:
```bash
# Check Supabase URL and key
cat apps/magic-marker/web/.env.local

# Verify Supabase project is active
# Check Supabase dashboard for project status

# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
```

#### **3. Build Errors**

**Problem**: `pnpm build` fails.

**Solutions**:
```bash
# Clean and reinstall
rm -rf node_modules .next
pnpm install
pnpm build

# Check for TypeScript errors
pnpm type-check

# Check for linting errors
pnpm lint
```

#### **4. Port Already in Use**

**Problem**: Port 3002 is already in use.

**Solutions**:
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Or use different port
PORT=3003 pnpm dev
```

#### **5. File Upload Issues**

**Problem**: Image upload fails.

**Solutions**:
- Check file size (must be < 10MB)
- Verify file type (JPEG, PNG, GIF, WebP)
- Check Supabase storage bucket configuration
- Verify storage policies are set correctly

#### **6. OpenAI API Errors**

**Problem**: OpenAI API calls fail.

**Solutions**:
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check account billing
# Verify API key has sufficient credits
# Check rate limits in OpenAI dashboard
```

### **Debug Mode**

Enable debug logging:

```bash
# Enable debug mode
DEBUG=* pnpm dev

# Check browser console for client-side errors
# Check terminal for server-side errors
```

### **Logs and Monitoring**

```bash
# Check Vercel logs (if deployed)
vercel logs

# Check Supabase logs
# Go to Supabase dashboard > Logs

# Check OpenAI usage
# Go to OpenAI dashboard > Usage
```

## 📊 **Performance Optimization**

### **1. Image Optimization**

- Use appropriate image formats (WebP for best compression)
- Compress images before upload
- Implement client-side image resizing

### **2. API Optimization**

- Implement request caching
- Use connection pooling
- Optimize database queries

### **3. Frontend Optimization**

- Use Next.js Image component
- Implement lazy loading
- Optimize bundle size

## 🔒 **Security Considerations**

### **1. Environment Variables**

- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate API keys regularly

### **2. Supabase Security**

- Review and update RLS policies
- Use service role key only on server-side
- Implement proper authentication (future feature)

### **3. OpenAI Security**

- Monitor API usage and costs
- Implement rate limiting
- Validate all inputs

## 📚 **Additional Resources**

### **Documentation**
- [Magic Marker API Reference](api-reference.md)
- [Development Log](devlog.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### **Community**
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com/)
- [OpenAI Community](https://community.openai.com/)

### **Tools**
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Playwright](https://playwright.dev/)

---

*This setup guide is maintained and updated with each release.*
