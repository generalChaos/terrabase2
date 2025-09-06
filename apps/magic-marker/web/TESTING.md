# Magic Marker Testing Guide

## Overview

This document outlines the testing strategy and implementation for the Magic Marker application. The testing suite includes unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (`src/lib/__tests__/`)

#### AnalysisFlowService Tests
- **File**: `analysisFlowService.test.ts`
- **Coverage**: Session ID generation, basic service functionality
- **Status**: ✅ Passing

#### OpenAIService Tests
- **File**: `openaiService.test.ts`
- **Coverage**: 
  - Image analysis with custom and default prompts
  - Question generation
  - Conversational question generation
  - Image generation with DALL-E
  - Error handling for all operations
- **Status**: ✅ Passing

#### PromptExecutor Tests
- **File**: `promptExecutor.test.ts`
- **Coverage**:
  - Prompt definition validation
  - Input validation
  - Error handling for missing prompts
  - Cache management
- **Status**: ✅ Passing

#### ImageService Tests
- **File**: `imageService.test.ts`
- **Coverage**:
  - Image creation
  - Image retrieval by ID
  - Image listing
  - Error handling
- **Status**: ✅ Passing

### End-to-End Tests (`e2e/`)

#### API Tests
- **File**: `test-api.spec.ts`
- **Coverage**:
  - Error handling endpoints
  - Upload validation
  - Image endpoint testing
  - Generate endpoint validation
- **Status**: ✅ Updated for current functionality

#### Integration Tests
- **File**: `test-integration.spec.ts`
- **Coverage**:
  - Full upload flow with mock data
  - Multiple question handling
  - Error state management
  - Loading state testing
- **Status**: ✅ Updated for current functionality

#### Upload Tests
- **File**: `test-upload.spec.ts`
- **Coverage**:
  - File upload validation
  - File type validation
  - File size validation
  - Error handling
- **Status**: ✅ Updated for current functionality

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Features**:
  - Next.js integration
  - TypeScript support
  - Coverage thresholds (70% for all metrics)
  - Custom test environment setup

### Test Setup
- **File**: `jest.setup.js`
- **Features**:
  - Next.js router mocking
  - Supabase mocking
  - OpenAI mocking
  - Console output suppression
  - Global test utilities

## Running Tests

### All Tests
```bash
pnpm test
```

### Watch Mode
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

### E2E Tests
```bash
pnpm test:e2e
```

### E2E Tests with UI
```bash
pnpm test:e2e:ui
```

## Test Coverage

Current test coverage includes:

### ✅ Covered
- Core service functionality
- Error handling
- Input validation
- API endpoint behavior
- User interface interactions
- File upload validation

### 🔄 Partially Covered
- Database operations (mocked)
- OpenAI API calls (mocked)
- Complex integration flows

### ❌ Not Covered
- Real database operations
- Real OpenAI API calls
- Performance testing
- Load testing

## Mocking Strategy

### Supabase Mocking
- All database operations are mocked
- Returns predictable test data
- Simulates error conditions

### OpenAI Mocking
- API calls are mocked
- Returns realistic response structures
- Simulates various error conditions

### Next.js Mocking
- Router functionality is mocked
- Request/Response objects are mocked
- Navigation is simulated

## Test Data

### Sample Images
- Mock file objects for testing
- Various file types and sizes
- Base64 encoded test data

### Sample Responses
- Realistic OpenAI response structures
- Error response formats
- Database record structures

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mocking
- Mock external dependencies
- Use realistic test data
- Test both success and error paths

### Assertions
- Use specific matchers
- Test both positive and negative cases
- Verify side effects

## Future Improvements

### Planned Additions
1. **API Route Tests**: Comprehensive testing of all API endpoints
2. **Integration Tests**: Real database and API integration tests
3. **Performance Tests**: Load and stress testing
4. **Visual Regression Tests**: UI component testing
5. **Accessibility Tests**: WCAG compliance testing

### Test Infrastructure
1. **Test Database**: Dedicated test database setup
2. **Test Environment**: Isolated test environment
3. **CI/CD Integration**: Automated test running
4. **Test Reporting**: Detailed test reports and coverage

## Troubleshooting

### Common Issues

#### Test Failures
- Check mock implementations
- Verify test data structure
- Ensure proper async/await usage

#### Coverage Issues
- Add tests for uncovered code paths
- Verify mock coverage
- Check test file organization

#### E2E Test Issues
- Verify application is running
- Check test environment setup
- Update selectors if UI changes

## Contributing

When adding new tests:

1. Follow existing patterns
2. Add appropriate mocks
3. Test both success and error cases
4. Update this documentation
5. Ensure tests pass before committing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Library](https://testing-library.com/docs/)
