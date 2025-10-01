# Turbo Repo Structure & Best Practices

## 🎯 **Overview**

This document outlines the recommended Turbo repo structure for the Mighty Team Designs project, following best practices for monorepo management and code sharing.

## 🏗️ **Repository Structure**

### **Root Level Structure**
```
party-game/
├── apps/                           # Applications
│   ├── mighty-team-designs/        # Next.js frontend app
│   └── image-processor/            # Python FastAPI server
├── packages/                       # Shared packages
│   ├── shared-image-processing/    # Python shared package
│   ├── shared-types/              # TypeScript shared types
│   └── shared-config/             # Shared configurations
├── docs/                          # Documentation
├── infrastructure/                # Infrastructure as code
├── scripts/                       # Build and deployment scripts
├── turbo.json                     # Turbo configuration
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # pnpm workspace config
└── README.md
```

### **Apps Directory**
```
apps/
├── mighty-team-designs/           # Next.js app
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── image-processor/               # Python FastAPI server
    ├── src/
    ├── requirements.txt
    ├── pyproject.toml
    └── Dockerfile
```

### **Packages Directory**
```
packages/
├── shared-image-processing/       # Python shared package
│   ├── image_processing/
│   │   ├── __init__.py
│   │   ├── upscaler.py
│   │   ├── ai_background_remover.py
│   │   ├── logo_asset_pack.py
│   │   ├── banner_generator.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── filename_utils.py
│   ├── pyproject.toml
│   ├── setup.py
│   └── README.md
├── shared-types/                  # TypeScript shared types
│   ├── src/
│   │   ├── index.ts
│   │   └── types/
│   │       ├── api.ts
│   │       └── image-processing.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── shared-config/                 # Shared configurations
    ├── eslint-config/
    ├── typescript-config/
    ├── tailwind-config/
    ├── package.json
    └── README.md
```

## 🔧 **Package Configuration**

### **Root Package.json**
```json
{
  "name": "party-game",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "clean": "turbo clean",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### **Turbo Configuration**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**", "out/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  },
  "globalDependencies": [
    "package.json",
    "pnpm-lock.yaml"
  ]
}
```

### **PNPM Workspace Configuration**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 📦 **Shared Package Details**

### **Python Shared Package**
```toml
# packages/shared-image-processing/pyproject.toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "shared-image-processing"
version = "0.1.0"
description = "Shared image processing utilities for Mighty Team Designs"
authors = [{name = "Your Name", email = "your.email@example.com"}]
license = {text = "MIT"}
readme = "README.md"
requires-python = ">=3.9"
dependencies = [
    "Pillow>=10.0.0",
    "opencv-python>=4.8.0.74",
    "numpy>=1.24.3",
    "rembg>=2.0.50",
    "torch>=2.0.1",
    "torchvision>=0.15.2",
    "requests>=2.31.0",
    "supabase>=1.0.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=22.0.0",
    "flake8>=4.0.0",
    "mypy>=1.0.0"
]

[tool.black]
line-length = 88
target-version = ['py39']

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
```

### **TypeScript Shared Types**
```json
{
  "name": "@party-game/shared-types",
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "files": [
    "src/**/*"
  ]
}
```

### **Shared Configuration Package**
```json
{
  "name": "@party-game/shared-config",
  "version": "0.1.0",
  "main": "index.js",
  "scripts": {
    "build": "echo 'No build needed for config packages'"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## 🔄 **Dependency Management**

### **Workspace Dependencies**
```json
// apps/mighty-team-designs/package.json
{
  "name": "mighty-team-designs",
  "dependencies": {
    "@party-game/shared-types": "workspace:*",
    "@party-game/shared-config": "workspace:*"
  }
}
```

```txt
# apps/image-processor/requirements.txt
-e ../../packages/shared-image-processing
```

### **Version Management**
- **Workspace Protocol**: Use `workspace:*` for local packages
- **Consistent Versions**: Keep shared dependencies in sync
- **Lock File**: Use `pnpm-lock.yaml` for reproducible builds

## 🚀 **Development Workflow**

### **Local Development**
```bash
# Install all dependencies
pnpm install

# Start all services in development
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

### **Package-Specific Commands**
```bash
# Work on specific app
cd apps/mighty-team-designs
pnpm dev

# Work on specific package
cd packages/shared-image-processing
python -m pip install -e .

# Build specific package
turbo build --filter=shared-types
```

## 🔧 **Build Pipeline**

### **Build Order**
1. **Shared Packages First**: `shared-types`, `shared-config`
2. **Python Package**: `shared-image-processing`
3. **Applications**: `mighty-team-designs`, `image-processor`

### **Caching Strategy**
- **Source Code**: Cache based on file hashes
- **Dependencies**: Cache based on lock file
- **Build Outputs**: Cache based on input changes

### **Parallel Execution**
- **Independent Tasks**: Run in parallel
- **Dependent Tasks**: Run in sequence
- **Resource Limits**: Control concurrent builds

## 📊 **Performance Optimization**

### **Build Performance**
- **Incremental Builds**: Only rebuild changed packages
- **Parallel Execution**: Run independent tasks in parallel
- **Remote Caching**: Share build artifacts across environments

### **Development Performance**
- **Hot Reloading**: Fast refresh for development
- **Type Checking**: Incremental type checking
- **Linting**: Only lint changed files

### **Deployment Performance**
- **Selective Builds**: Only build what's needed
- **Asset Optimization**: Optimize images and bundles
- **CDN Integration**: Serve static assets from CDN

## 🔍 **Testing Strategy**

### **Test Organization**
```
packages/shared-image-processing/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── pytest.ini

apps/mighty-team-designs/
├── __tests__/
├── e2e/
└── jest.config.js
```

### **Test Commands**
```bash
# Run all tests
pnpm test

# Run tests for specific package
turbo test --filter=shared-image-processing

# Run e2e tests
turbo test --filter=mighty-team-designs -- --testPathPattern=e2e
```

## 📈 **Monitoring and Analytics**

### **Build Metrics**
- **Build Time**: Track build duration
- **Cache Hit Rate**: Monitor cache effectiveness
- **Dependency Changes**: Track dependency updates

### **Development Metrics**
- **Hot Reload Time**: Track development feedback
- **Type Check Time**: Monitor type checking performance
- **Lint Time**: Track linting performance

## 🛠️ **Tooling Integration**

### **IDE Support**
- **TypeScript**: Full type checking and IntelliSense
- **Python**: Linting, formatting, and type checking
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting

### **CI/CD Integration**
- **GitHub Actions**: Automated testing and deployment
- **Vercel**: Frontend deployment
- **Docker**: Containerized Python services

## 🔒 **Security Considerations**

### **Dependency Security**
- **Audit Dependencies**: Regular security audits
- **Update Dependencies**: Keep dependencies current
- **Lock Files**: Use lock files for reproducible builds

### **Code Security**
- **Secrets Management**: Use environment variables
- **Access Control**: Limit package access
- **Audit Logs**: Track package changes

## 📚 **Documentation Strategy**

### **Package Documentation**
- **README Files**: Each package has its own README
- **API Documentation**: Document public APIs
- **Examples**: Provide usage examples

### **Project Documentation**
- **Architecture Docs**: High-level architecture
- **Development Guides**: How to contribute
- **Deployment Guides**: How to deploy

## 🎯 **Best Practices Summary**

### **Repository Organization**
1. **Clear Separation**: Apps vs packages
2. **Consistent Naming**: Follow naming conventions
3. **Logical Grouping**: Group related functionality

### **Dependency Management**
1. **Workspace Dependencies**: Use workspace protocol
2. **Version Consistency**: Keep versions in sync
3. **Minimal Root Dependencies**: Only essential dependencies at root

### **Build and Development**
1. **Incremental Builds**: Only build what changed
2. **Parallel Execution**: Run independent tasks in parallel
3. **Caching**: Use caching for performance

### **Code Quality**
1. **Type Safety**: Use TypeScript and Python type hints
2. **Linting**: Enforce code quality standards
3. **Testing**: Comprehensive test coverage

This structure provides a scalable, maintainable monorepo that follows Turbo repo best practices while enabling efficient development and deployment workflows!
