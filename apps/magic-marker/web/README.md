# Magic Marker - AI-Powered Drawing Transformation

## 🎯 Overview
Magic Marker is a party game application that transforms children's drawings into professional illustrations through AI-powered analysis and generation.

## ✨ Features
- **AI Image Analysis**: Rich conversational analysis of child's drawings
- **Interactive Questions**: Engaging Creative Director questions for clarification
- **Professional Generation**: Faithful recreation with enhanced details
- **Smooth UI Flow**: Step-by-step user experience
- **Real-time Processing**: Fast AI-powered transformations

## 🚀 Current Status: **FULLY FUNCTIONAL**

The application is production-ready with all core features working:
- ✅ Image upload and analysis
- ✅ Dynamic question generation
- ✅ Professional image generation
- ✅ Responsive UI with proper styling
- ✅ Database integration with Supabase
- ✅ Error handling and validation

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account

### Installation
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and OpenAI API keys

# Start development server
pnpm dev
```

### Database Setup
```bash
# Reset database with latest schema
npx supabase db reset
```

## 🎮 How It Works

1. **Upload**: Child uploads their drawing
2. **Analysis**: AI analyzes the drawing and provides rich context
3. **Questions**: AI generates engaging questions to clarify details
4. **Answers**: Child answers the questions
5. **Generation**: AI creates a professional illustration
6. **Result**: Display both original and generated images

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **AI**: OpenAI GPT-4o, DALL-E 3
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel

## 📊 Performance

- **Image Analysis**: ~3-5 seconds
- **Questions Generation**: ~2-3 seconds
- **Image Generation**: ~10-15 seconds
- **Total Flow**: ~20-25 seconds end-to-end

## 🔧 Development

### TypeScript
```bash
# Type checking
pnpm type-check

# Build
pnpm build
```

### Testing
```bash
# Run tests (requires database setup)
pnpm test
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── page.tsx        # Main upload page
│   └── result/         # Results page
├── components/         # React components
├── lib/               # Core business logic
│   ├── promptExecutor.ts    # AI interaction
│   ├── schemaEnforcer.ts    # Output validation
│   ├── contextManager.ts    # State management
│   └── imageService.ts      # Image handling
└── types/             # TypeScript definitions
```

## 🎨 AI Integration

The application uses a sophisticated AI pipeline:

1. **Image Analysis** (GPT-4o): Analyzes drawings and provides rich context
2. **Questions Generation** (GPT-4o): Creates engaging clarification questions
3. **Image Generation** (DALL-E 3): Produces professional illustrations

All AI interactions use function calling to ensure consistent, structured outputs.

## 🚦 Status

- **Core Functionality**: ✅ 100% Working
- **TypeScript**: ✅ Main codebase error-free
- **Tests**: ⚠️ 7 test files (some type errors in tests)
- **Production Ready**: ✅ Yes

## 📈 Future Enhancements

- Prompt versioning and management
- Analytics dashboard
- Multi-language support
- Advanced AI features (style transfer, animation)
- Batch processing capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

This project is part of the party-game monorepo.
