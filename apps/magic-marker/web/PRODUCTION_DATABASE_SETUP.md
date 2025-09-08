# Production Database Setup Guide

## 🎯 Overview
This guide outlines the steps needed to set up the production database for Magic Marker, including schema setup, data seeding, and environment configuration.

## 📋 Current Status
- **Local Development**: ✅ Working with clean migrations
- **Production Database**: ⚠️ Needs setup
- **Schema**: ✅ Ready (clean_database_setup.sql)
- **Data Seeding**: ✅ Ready (production_data.sql)

## 🗄️ Database Requirements

### **Schema Components**
1. **prompt_definitions** - AI prompt configurations
2. **images** - Image storage metadata
3. **analysis_flows** - Processing flow tracking
4. **image_processing_steps** - Step-by-step processing logs

### **Storage Requirements**
1. **Supabase Storage** - For image files
2. **Database** - For metadata and configurations
3. **Environment Variables** - For API keys and configuration

## 🚀 Production Setup Steps

### **Step 1: Supabase Project Setup**
```bash
# 1. Create new Supabase project
# 2. Get project URL and anon key
# 3. Set up environment variables
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### **Step 2: Database Schema Setup**
```bash
# Option A: Use Supabase CLI (Recommended)
npx supabase db reset --linked

# Option B: Manual SQL execution
# Run the clean_database_setup.sql migration
```

**Migration Files to Apply:**
- `20250906060000_clean_database_setup.sql` - Main schema
- `20250906052923_insert_production_data.sql` - Initial data

### **Step 3: Storage Bucket Setup**
```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true);

-- Set up storage policies
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'images');
```

### **Step 4: Data Seeding**
```sql
-- Insert prompt definitions
INSERT INTO prompt_definitions (name, type, input_schema, output_schema, prompt_text, model, response_format, max_tokens, temperature, active, sort_order) VALUES
('image_analysis', 'image_analysis', 
 '{"type": "object", "required": ["image", "prompt"], "properties": {"image": {"type": "string"}, "prompt": {"type": "string"}}}',
 '{"type": "object", "required": ["analysis"], "properties": {"analysis": {"type": "string"}}}',
 'You are an AI assistant analyzing a child''s character drawing...',
 'gpt-4o', 'json_object', 2000, 0.7, true, 10),
-- ... (other prompts)
```

## 🔧 Environment Configuration

### **Development Environment**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key
OPENAI_API_KEY=your_openai_key
```

### **Production Environment**
```env
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
OPENAI_API_KEY=your_openai_key
```

## 📊 Database Schema Details

### **prompt_definitions Table**
- **Purpose**: Stores AI prompt configurations
- **Key Fields**: name, type, input_schema, output_schema, prompt_text, model
- **Active Prompts**: 6 prompts (image_analysis, questions_generation, image_generation, etc.)

### **images Table**
- **Purpose**: Stores image metadata and processing results
- **Key Fields**: analysis_result, image_type, file_path, file_size
- **Types**: original, additional, final

### **analysis_flows Table**
- **Purpose**: Tracks complete analysis flows
- **Key Fields**: flow_id, status, context_data, step_results
- **Status**: pending, processing, completed, failed

### **image_processing_steps Table**
- **Purpose**: Logs individual processing steps
- **Key Fields**: flow_id, step_name, status, input_data, output_data
- **Steps**: image_analysis, questions_generation, image_generation

## 🔐 Security Considerations

### **Row Level Security (RLS)**
```sql
-- Enable RLS on all tables
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_processing_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Public read access" ON prompt_definitions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON images FOR SELECT USING (true);
```

### **API Key Security**
- Store sensitive keys in environment variables
- Use Supabase service role key for server-side operations
- Use anon key for client-side operations

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Storage bucket created
- [ ] Initial data seeded
- [ ] RLS policies configured

### **Post-Deployment**
- [ ] Test image upload
- [ ] Test AI analysis flow
- [ ] Test image generation
- [ ] Verify storage access
- [ ] Check error logs
- [ ] Monitor performance

## 🧪 Testing Production Setup

### **Test Scripts**
```bash
# Test database connection
curl -X GET "https://your-app.vercel.app/api/debug/test-database"

# Test AI functionality
curl -X POST "https://your-app.vercel.app/api/debug/test-new-prompt-system"

# Test image upload
curl -X POST "https://your-app.vercel.app/api/upload" \
  -F "image=@test_image.png"
```

### **Health Checks**
- Database connectivity
- OpenAI API access
- Supabase storage access
- Prompt execution
- Image processing pipeline

## 📈 Monitoring & Maintenance

### **Database Monitoring**
- Monitor query performance
- Track storage usage
- Monitor API rate limits
- Check error rates

### **Regular Maintenance**
- Clean up old analysis flows
- Archive completed images
- Monitor storage costs
- Update prompt definitions as needed

## 🆘 Troubleshooting

### **Common Issues**
1. **Database Connection**: Check environment variables
2. **Storage Access**: Verify bucket policies
3. **AI Errors**: Check OpenAI API key and rate limits
4. **Schema Issues**: Verify migrations applied correctly

### **Debug Endpoints**
- `/api/debug/test-database` - Database connectivity
- `/api/debug/test-openai` - OpenAI API access
- `/api/debug/test-image-generation` - Full flow test

## 📞 Support

If you encounter issues:
1. Check the debug endpoints
2. Review Supabase logs
3. Check Vercel function logs
4. Verify environment variables
5. Test with local development setup

---

**Next Steps**: Set up Supabase project and apply the clean database setup migration.
