# Turborepo Setup & Best Practices

This project uses [Turborepo](https://turbo.build/repo) for managing a monorepo with multiple applications and packages.

## Project Structure

```
party-game/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── packages/
│   ├── config/       # Shared configuration
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── turbo.json        # Turborepo configuration
```

## Available Scripts

### Root Level Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm build            # Build all packages and apps
pnpm lint             # Lint all packages and apps
pnpm test             # Run tests across all packages
pnpm type-check       # Type check all packages
pnpm clean            # Clean all build artifacts
pnpm format           # Format all code with Prettier

# Database
pnpm migrate          # Run database migrations
pnpm seed             # Seed database with initial data
```

### Package-Specific Commands

Each package has its own set of scripts that can be run individually:

```bash
# Web App
pnpm --filter @party/web dev
pnpm --filter @party/web build
pnpm --filter @party/web type-check

# API
pnpm --filter @party/api dev
pnpm --filter @party/api build
pnpm --filter @party/api type-check

# Shared Packages
pnpm --filter @party/config build
pnpm --filter @party/types build
```

## Turborepo Configuration

### Task Dependencies

The `turbo.json` file defines task dependencies and outputs:

- **dev**: Depends on `^build` (builds dependencies first)
- **build**: Depends on `^build` (builds dependencies first)
- **lint**: Depends on `^build` (ensures code is built before linting)
- **test**: Depends on `^build` (ensures code is built before testing)
- **type-check**: Depends on `^build` (ensures dependencies are built)

### Caching Strategy

- **dev**: No caching (always fresh)
- **build**: Cached with outputs in `dist/**`, `.next/**`, `build/**`
- **test**: Cached with outputs in `coverage/**`, `.vitest/**`
- **lint/type-check**: No outputs (always run)

### Environment Variables

- **build**: Includes `NODE_ENV` and `NEXT_PUBLIC_*` variables
- **test**: Includes `NODE_ENV` and `CI` variables

## Development Workflow

### 1. Initial Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### 2. Development

```bash
# Start development servers
pnpm dev

# This will:
# - Build all packages first
# - Start web app on http://localhost:3000
# - Start API on http://localhost:3001
```

### 3. Code Quality

```bash
# Type check all packages
pnpm type-check

# Lint all code
pnpm lint

# Format all code
pnpm format
```

### 4. Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @party/web test
```

### 5. Building

```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm --filter @party/web build
```

## Best Practices

### 1. Package Dependencies

- Always use `workspace:*` for internal package dependencies
- Keep shared dependencies in root `package.json`
- Use `pnpm overrides` for consistent versions

### 2. Script Naming

- Use consistent script names across packages
- `build`, `dev`, `test`, `lint`, `type-check`, `clean`, `format`

### 3. Task Dependencies

- Build tasks depend on `^build` (dependencies first)
- Lint and test tasks depend on `^build` (ensure code is built)
- Use `dependsOn` to manage task order

### 4. Caching

- Cache build outputs for faster rebuilds
- Don't cache development tasks
- Use appropriate output patterns for each task type

### 5. Environment Variables

- Include necessary environment variables in task config
- Use `NODE_ENV` for build configuration
- Use `CI` for test configuration

## Troubleshooting

### Common Issues

1. **Build failures**: Run `pnpm clean` and `pnpm build` again
2. **Type errors**: Run `pnpm type-check` to identify issues
3. **Cache issues**: Run `pnpm clean` to clear all caches

### Useful Commands

```bash
# Clear all caches
pnpm clean

# Force rebuild everything
pnpm build --force

# Check what's cached
pnpm build --dry-run

# Run with verbose output
pnpm build --verbose
```

## Performance Tips

1. **Parallel execution**: Use `--parallel` for independent tasks
2. **Selective builds**: Use `--filter` to build only what you need
3. **Cache utilization**: Let Turborepo cache build outputs
4. **Dependency order**: Ensure proper `dependsOn` configuration

## Migration from Other Monorepo Tools

If migrating from other monorepo tools:

1. Install Turborepo: `pnpm add -D turbo`
2. Create `turbo.json` with task definitions
3. Update package.json scripts to use Turborepo
4. Add proper task dependencies
5. Configure caching and outputs

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turborepo GitHub](https://github.com/vercel/turbo)
- [Monorepo Best Practices](https://turbo.build/repo/docs/handbook/monorepos)
- [Task Dependencies](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
