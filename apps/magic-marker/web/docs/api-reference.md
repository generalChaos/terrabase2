# Magic Marker API Reference

Complete reference for all API endpoints in the Magic Marker application.

## 📋 **Base URL**

- **Development**: `http://localhost:3002/api`
- **Production**: `https://magic-marker-web.vercel.app/api`

## 🔐 **Authentication**

Currently, the API uses public access with Row Level Security (RLS) policies in Supabase. Future versions will implement user authentication.

## 📤 **Upload Image**

Upload an image for AI analysis and question generation.

### **Endpoint**
```http
POST /api/upload
```

### **Request**
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `image` field

### **Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | File | Yes | Image file (JPEG, PNG, GIF, WebP) |

### **File Constraints**
- **Max Size**: 10MB
- **Min Size**: 1KB
- **Supported Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`

### **Response**

**Success (200):**
```json
{
  "success": true,
  "imageAnalysisId": "550e8400-e29b-41d4-a716-446655440000",
  "questions": [
    {
      "id": "q_0",
      "text": "What is the main subject of this image?",
      "type": "multiple_choice",
      "options": ["Person", "Animal", "Object", "Landscape"],
      "required": true
    },
    {
      "id": "q_1",
      "text": "What is the mood or atmosphere of this image?",
      "type": "multiple_choice",
      "options": ["Happy", "Sad", "Mysterious", "Peaceful"],
      "required": true
    }
    // ... 8 more questions
  ]
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

**Error (413):**
```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Example Usage**
```bash
curl -X POST \
  -F "image=@test-image.jpg" \
  http://localhost:3002/api/upload
```

## 📋 **Get All Images**

Retrieve all uploaded images with their analysis data.

### **Endpoint**
```http
GET /api/images
```

### **Request**
No parameters required.

### **Response**

**Success (200):**
```json
{
  "success": true,
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "original_image_path": "https://supabase.co/storage/v1/object/public/images/...",
      "analysis_result": "This image shows a beautiful sunset over a mountain landscape...",
      "questions": [
        {
          "id": "q_0",
          "text": "What is the main subject of this image?",
          "type": "multiple_choice",
          "options": ["Person", "Animal", "Object", "Landscape"],
          "required": true
        }
        // ... more questions
      ],
      "answers": [
        {
          "questionId": "q_0",
          "answer": "Landscape"
        }
        // ... more answers
      ],
      "final_image_path": "https://supabase.co/storage/v1/object/public/images/...",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Failed to retrieve images from database",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Example Usage**
```bash
curl http://localhost:3002/api/images
```

## 🔍 **Get Specific Image**

Retrieve a specific image by its ID.

### **Endpoint**
```http
GET /api/images/[id]
```

### **Request**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Image ID in URL path |

### **Response**

**Success (200):**
```json
{
  "success": true,
  "image": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "original_image_path": "https://supabase.co/storage/v1/object/public/images/...",
    "analysis_result": "This image shows a beautiful sunset over a mountain landscape...",
    "questions": [
      {
        "id": "q_0",
        "text": "What is the main subject of this image?",
        "type": "multiple_choice",
        "options": ["Person", "Animal", "Object", "Landscape"],
        "required": true
      }
      // ... more questions
    ],
    "answers": [
      {
        "questionId": "q_0",
        "answer": "Landscape"
      }
      // ... more answers
    ],
    "final_image_path": "https://supabase.co/storage/v1/object/public/images/...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Image not found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Example Usage**
```bash
curl http://localhost:3002/api/images/550e8400-e29b-41d4-a716-446655440000
```

## 🎨 **Generate Image**

Generate a new image based on user answers to the questions.

### **Endpoint**
```http
POST /api/images/generate
```

### **Request**
- **Content-Type**: `application/json`

### **Body**
```json
{
  "imageAnalysisId": "550e8400-e29b-41d4-a716-446655440000",
  "answers": [
    {
      "questionId": "q_0",
      "answer": "Landscape"
    },
    {
      "questionId": "q_1",
      "answer": "Peaceful"
    }
    // ... answers for all 10 questions
  ]
}
```

### **Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageAnalysisId` | UUID | Yes | ID of the original image analysis |
| `answers` | Array | Yes | Array of question answers |

### **Answer Object**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `questionId` | String | Yes | ID of the question being answered |
| `answer` | String | Yes | The selected answer option |

### **Response**

**Success (200):**
```json
{
  "success": true,
  "finalImagePath": "https://supabase.co/storage/v1/object/public/images/generated-550e8400-e29b-41d4-a716-446655440000-1234567890.png"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Image not found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

**Error (402):**
```json
{
  "success": false,
  "error": "API quota exceeded. Please check your OpenAI account.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Example Usage**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "imageAnalysisId": "550e8400-e29b-41d4-a716-446655440000",
    "answers": [
      {"questionId": "q_0", "answer": "Landscape"},
      {"questionId": "q_1", "answer": "Peaceful"}
    ]
  }' \
  http://localhost:3002/api/images/generate
```

## 🧪 **Test Endpoints**

### **Test OpenAI Connection**

Test the OpenAI API connectivity and configuration.

### **Endpoint**
```http
GET /api/test-openai
```

### **Response**

**Success (200):**
```json
{
  "success": true,
  "message": "OpenAI API is working correctly",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "OpenAI API key not configured",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

### **Test Error Handling**

Test various error handling scenarios.

### **Endpoint**
```http
GET /api/test-errors
```

### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | No | Error type to simulate (`validation`, `openai`, `supabase`, `timeout`, `unknown`) |

### **Response**

**Success (200):**
```json
{
  "success": true,
  "message": "Error handling test completed",
  "errorType": "validation",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **Example Usage**
```bash
# Test validation error
curl "http://localhost:3002/api/test-errors?type=validation"

# Test OpenAI error
curl "http://localhost:3002/api/test-errors?type=openai"

# Test Supabase error
curl "http://localhost:3002/api/test-errors?type=supabase"
```

## 📊 **Error Codes**

### **HTTP Status Codes**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid API key |
| 402 | Payment Required - Quota exceeded |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - External service down |

### **Error Response Format**
All error responses follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789",
  "code": "ERROR_CODE" // Optional
}
```

### **Common Error Messages**
| Error | Description | Solution |
|-------|-------------|----------|
| `Invalid file type` | Unsupported image format | Use JPEG, PNG, GIF, or WebP |
| `File too large` | Image exceeds 10MB limit | Compress or resize image |
| `OpenAI API key not configured` | Missing API key | Set `OPENAI_API_KEY` environment variable |
| `Rate limit exceeded` | Too many requests to OpenAI | Wait and retry |
| `Quota exceeded` | OpenAI account quota reached | Check billing |
| `Image not found` | Invalid image ID | Verify image ID exists |
| `Failed to parse JSON` | Invalid OpenAI response | Retry request |

## 🔄 **Rate Limits**

### **Current Limits**
- **Upload**: No specific limit (limited by file size)
- **Generate**: Limited by OpenAI API quotas
- **Retrieve**: No specific limit

### **OpenAI API Limits**
- **GPT-4o**: 10,000 tokens per minute
- **DALL-E 3**: 5 images per minute
- **Rate limits**: Vary by account type

## 📝 **Best Practices**

### **1. File Upload**
- Use supported image formats (JPEG, PNG, GIF, WebP)
- Keep file sizes under 10MB
- Ensure images are properly formatted

### **2. Error Handling**
- Always check the `success` field in responses
- Handle specific error codes appropriately
- Implement retry logic for rate limit errors
- Show user-friendly error messages

### **3. Performance**
- Cache image data when possible
- Implement loading states for long operations
- Handle network timeouts gracefully

### **4. Security**
- Validate all input data
- Use HTTPS in production
- Implement proper CORS policies
- Sanitize user inputs

## 🔧 **SDK Examples**

### **JavaScript/TypeScript**
```typescript
class MagicMarkerAPI {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3002/api') {
    this.baseURL = baseURL;
  }

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  async generateImage(imageAnalysisId: string, answers: QuestionAnswer[]): Promise<GenerateResponse> {
    const response = await fetch(`${this.baseURL}/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageAnalysisId,
        answers,
      }),
    });

    return response.json();
  }

  async getImages(): Promise<ImagesResponse> {
    const response = await fetch(`${this.baseURL}/images`);
    return response.json();
  }
}
```

### **Python**
```python
import requests
from typing import List, Dict

class MagicMarkerAPI:
    def __init__(self, base_url: str = "http://localhost:3002/api"):
        self.base_url = base_url

    def upload_image(self, image_path: str) -> Dict:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{self.base_url}/upload", files=files)
        return response.json()

    def generate_image(self, image_analysis_id: str, answers: List[Dict]) -> Dict:
        data = {
            "imageAnalysisId": image_analysis_id,
            "answers": answers
        }
        response = requests.post(
            f"{self.base_url}/images/generate",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        return response.json()

    def get_images(self) -> Dict:
        response = requests.get(f"{self.base_url}/images")
        return response.json()
```

---

*This API reference is maintained and updated with each release.*
