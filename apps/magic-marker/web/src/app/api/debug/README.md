# Debug API Endpoints

This directory contains debug endpoints for troubleshooting and validating the Magic Marker system. These endpoints are designed to be called directly from the terminal or browser for debugging purposes.

## Available Debug Endpoints

### Core System Tests

#### `/api/debug/deployment` - System Health Check
- **Purpose**: Verify environment variables and database connectivity
- **Usage**: `curl http://localhost:3002/api/debug/deployment`
- **Returns**: Environment status, database connection status, and system health

#### `/api/debug/prompts` - Prompt System Validation
- **Purpose**: Test the prompt definitions system and database queries
- **Usage**: `curl http://localhost:3002/api/debug/prompts`
- **Returns**: All prompt definitions, active prompts, and system status

### OpenAI Integration Tests

#### `/api/debug/openai` - OpenAI API Connection
- **Purpose**: Test OpenAI API connectivity and basic functionality
- **Usage**: `curl http://localhost:3002/api/debug/openai`
- **Returns**: OpenAI API status and test response

#### `/api/debug/image-generation` - Image Generation Test
- **Purpose**: Test the complete image generation pipeline
- **Usage**: `curl http://localhost:3002/api/debug/image-generation`
- **Returns**: Generated image data and processing metrics

#### `/api/debug/image-text` - Image Analysis Test
- **Purpose**: Test image analysis and text extraction
- **Usage**: `curl http://localhost:3002/api/debug/image-text`
- **Returns**: Image analysis results and extracted text

### Error Handling Tests

#### `/api/debug/errors` - Error Handling Validation
- **Purpose**: Test various error scenarios and error handling
- **Usage**: `curl http://localhost:3002/api/debug/errors?type=<errorType>`
- **Parameters**:
  - `type=validation` - Test validation errors
  - `type=openai` - Test OpenAI API errors
  - `type=supabase` - Test Supabase errors
  - `type=timeout` - Test timeout errors
  - `type=unknown` - Test unknown errors
- **Returns**: Error handling results and status codes

### Prompt System Tests

#### `/api/debug/new-prompt-system` - New Prompt System Test
- **Purpose**: Test the new structured prompt system
- **Usage**: `curl http://localhost:3002/api/debug/new-prompt-system`
- **Returns**: Prompt system status and execution results

## Usage Examples

### Quick System Check
```bash
# Check if the system is properly configured
curl http://localhost:3002/api/debug/deployment

# Test prompt system
curl http://localhost:3002/api/debug/prompts

# Test OpenAI integration
curl http://localhost:3002/api/debug/openai
```

### Error Testing
```bash
# Test different error scenarios
curl http://localhost:3002/api/debug/errors?type=openai
curl http://localhost:3002/api/debug/errors?type=supabase
curl http://localhost:3002/api/debug/errors?type=timeout
```

### Image Processing Tests
```bash
# Test image generation
curl http://localhost:3002/api/debug/image-generation

# Test image analysis
curl http://localhost:3002/api/debug/image-text
```

## What These Are NOT

These are **NOT integration tests** or **unit tests**. They are:
- **Debug API endpoints** - HTTP endpoints for manual testing
- **Development tools** - For troubleshooting and validation
- **Manual testing** - Called via curl, browser, or admin UI

## What Real Integration Tests Would Be

Real integration tests would be:
- **Automated test files** (`.spec.ts`, `.test.ts`)
- **Run by test runners** (Jest, Playwright, etc.)
- **Part of CI/CD pipeline**
- **Located in** `/tests/` or `/__tests__/` directories

## Notes

- These endpoints are for **development and debugging only**
- They may return sensitive information and should not be exposed in production
- All endpoints return JSON responses
- Some endpoints may take longer to execute (especially image generation)
- Use these endpoints to diagnose issues and validate system functionality

## Integration with Admin UI

Some of these debug endpoints are also accessible through the admin interface:
- **Admin Dashboard**: Quick action buttons for system diagnostics
- **Admin Status Page**: Detailed system health checks
- **Admin Prompt Tester**: Interactive prompt testing interface
