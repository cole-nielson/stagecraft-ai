# StageCraft AI - API Design & Data Models

## 🎯 **API Philosophy: Simple, Professional, Reliable**

The StageCraft AI API prioritizes **simplicity and reliability** over feature complexity. Every endpoint is designed for professional real estate workflows with minimal friction.

## 🛣️ **API Endpoints**

### Core Staging API (MVP)

#### 1. Upload & Stage Room
```http
POST /api/stage
Content-Type: multipart/form-data

Request:
- image: File (required) - Room photo to stage
- style: String (required) - Luxury style selection
- room_type: String (optional) - Auto-detected if not provided
- quality_mode: String (optional) - "standard" | "premium" (default: premium)

Response:
{
  "id": "staging_12345",
  "status": "completed",
  "original_image_url": "https://...",
  "staged_image_url": "https://...",
  "style": "modern_luxury",
  "room_type": "living_room",
  "processing_time_ms": 24500,
  "quality_score": 0.95,
  "architectural_integrity": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Staging Status/Result
```http
GET /api/stage/{staging_id}

Response:
{
  "id": "staging_12345",
  "status": "processing" | "completed" | "failed",
  "progress": 0.75, // Only during processing
  "result": { /* Same as POST response when completed */ },
  "error": "Error message if failed"
}
```

#### 3. Get Available Styles
```http
GET /api/styles

Response:
{
  "styles": [
    {
      "id": "modern_luxury",
      "name": "Modern Luxury",
      "description": "Clean lines, premium materials, sophisticated neutrals",
      "preview_image": "https://...",
      "best_for": ["contemporary_homes", "urban_properties", "high_end_condos"]
    },
    {
      "id": "classic_elegance", 
      "name": "Classic Elegance",
      "description": "Timeless pieces, rich textures, traditional luxury",
      "preview_image": "https://...",
      "best_for": ["traditional_homes", "historic_properties", "luxury_estates"]
    }
  ]
}
```

#### 4. Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "ai_service_status": "operational",
  "processing_queue_length": 3,
  "average_processing_time_ms": 22000
}
```

### Extended API (Phase 2)

#### 5. Batch Processing  
```http
POST /api/stage/batch
Content-Type: multipart/form-data

Request:
- images[]: File[] - Multiple room photos
- style: String - Single style for all images
- property_name: String (optional) - For organization

Response:
{
  "batch_id": "batch_67890",
  "total_images": 5,
  "processing_status": "queued",
  "estimated_completion_time": "2024-01-15T10:35:00Z",
  "individual_stagings": [
    { "id": "staging_12346", "status": "queued" },
    { "id": "staging_12347", "status": "queued" }
  ]
}
```

#### 6. User Account Management
```http
GET /api/account
Authorization: Bearer {token}

Response:
{
  "user_id": "user_123",
  "email": "agent@sothebysrealty.com", 
  "plan": "professional",
  "usage_this_month": {
    "stagings_completed": 47,
    "limit": 100,
    "reset_date": "2024-02-01T00:00:00Z"
  },
  "recent_stagings": [
    { "id": "staging_12345", "created_at": "...", "property_name": "123 Main St" }
  ]
}
```

## 📊 **Data Models**

### Staging Model
```typescript
interface Staging {
  id: string;                    // Unique staging identifier
  user_id?: string;              // Associated user (for accounts)
  status: 'processing' | 'completed' | 'failed';
  
  // Input
  original_image_url: string;    // Original room photo
  style: string;                 // Selected staging style
  room_type: string;             // Detected/specified room type
  quality_mode: 'standard' | 'premium';
  
  // Output  
  staged_image_url?: string;     // Result image
  processing_time_ms?: number;   // How long it took
  quality_score?: number;        // 0-1 quality assessment
  architectural_integrity?: boolean; // Were structural elements preserved?
  
  // Metadata
  created_at: string;           // ISO timestamp
  completed_at?: string;        // ISO timestamp
  error_message?: string;       // If failed
  
  // Optional Organization
  property_name?: string;       // User-provided property identifier
  batch_id?: string;           // If part of batch processing
}
```

### Style Model
```typescript
interface Style {
  id: string;                   // Unique style identifier
  name: string;                 // Display name
  description: string;          // User-facing description
  preview_image: string;        // Example staged room URL
  
  // Targeting
  best_for: string[];          // Property types this works well for
  price_range: 'luxury' | 'premium' | 'standard';
  
  // Internal
  prompt_template: string;      // AI prompt for this style
  active: boolean;             // Whether available to users
  sort_order: number;          // Display ordering
}
```

### User Model (Phase 2)
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  company?: string;             // Real estate company
  
  // Subscription
  plan: 'trial' | 'professional' | 'enterprise';
  usage_limit: number;          // Stagings per month
  current_usage: number;        // This month's usage
  billing_cycle_start: string;  // ISO timestamp
  
  // Preferences
  default_style?: string;       // Preferred staging style
  notification_preferences: {
    email_on_completion: boolean;
    processing_updates: boolean;
  };
  
  created_at: string;
  last_active: string;
}
```

## 🔒 **Authentication & Security**

### Authentication Strategy
**For MVP**: Simple API key authentication
- Each user gets a unique API key
- Include in Authorization header: `Bearer {api_key}`
- Keys can be revoked/regenerated

**For Scale**: JWT tokens with refresh mechanism
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (30 days)  
- Secure token storage and rotation

### Rate Limiting
```
Per API Key:
- 10 stagings per hour (burst)
- 100 stagings per day
- 500 stagings per month (varies by plan)

Global:
- 1000 concurrent processing jobs
- Graceful queuing beyond limits
```

### Data Security
- All images encrypted at rest and in transit
- Automatic deletion of processed images after 30 days
- No storage of personal/property identifying information
- GDPR compliance for EU users

## 🔄 **Error Handling**

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_IMAGE_FORMAT",
    "message": "Image must be JPEG or PNG format",
    "details": "Received image/gif format",
    "request_id": "req_12345"
  }
}
```

### Error Codes
```typescript
enum ErrorCode {
  // Input Validation
  INVALID_IMAGE_FORMAT = 'INVALID_IMAGE_FORMAT',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE', 
  INVALID_STYLE = 'INVALID_STYLE',
  NOT_INTERIOR_IMAGE = 'NOT_INTERIOR_IMAGE',
  
  // Processing
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  ARCHITECTURAL_INTEGRITY_FAILED = 'ARCHITECTURAL_INTEGRITY_FAILED',
  
  // Authentication & Limits
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}
```

## 📈 **Performance & Scalability**

### Response Time Targets
- **Image Upload**: < 2 seconds to return staging_id
- **AI Processing**: < 30 seconds for standard quality
- **Premium Processing**: < 45 seconds for highest quality  
- **Batch Processing**: < 5 minutes per image average

### Scalability Considerations
- **Async Processing**: All staging happens asynchronously
- **Queue Management**: Redis-based job queue with priority levels
- **Caching**: Cache style information and common responses
- **CDN**: Serve processed images through CDN for fast global access

### Monitoring & Alerting
```typescript
interface SystemMetrics {
  processing_queue_length: number;
  average_processing_time_ms: number;
  success_rate_24h: number;
  ai_service_response_time: number;
  storage_usage_gb: number;
  active_users_count: number;
}
```

## 🚀 **Implementation Roadmap**

### Phase 1: Core API (MVP)
- Single staging endpoint with 3 luxury styles
- Simple authentication with API keys
- Basic error handling and validation
- High-quality AI staging with architectural preservation

### Phase 2: Professional Features  
- Batch processing for multiple rooms
- User accounts and usage tracking
- Additional luxury styles
- Enhanced quality controls

### Phase 3: Enterprise Ready
- Advanced analytics and reporting
- Custom style training for agencies
- Integration with real estate platforms (MLS, etc.)
- Mobile app API support

## 💾 **Database Schema**

### Minimal Tables (PostgreSQL)
```sql
-- Core staging data
CREATE TABLE stagings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  
  -- Input
  original_image_url TEXT NOT NULL,
  style VARCHAR(50) NOT NULL,
  room_type VARCHAR(50),
  quality_mode VARCHAR(20) DEFAULT 'premium',
  
  -- Output
  staged_image_url TEXT,
  processing_time_ms INTEGER,
  quality_score DECIMAL(3,2),
  architectural_integrity BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  
  -- Optional
  property_name VARCHAR(200),
  batch_id UUID
);

-- User accounts (Phase 2)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Style definitions
CREATE TABLE styles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_image TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);
```

## 🎯 **Success Metrics**

### API Performance
- **Uptime**: 99.9% availability target
- **Response Time**: 95th percentile under target times
- **Success Rate**: 95%+ staging completion rate  
- **User Satisfaction**: 4.5+ average quality rating

### Business Metrics
- **API Adoption**: Growth in active API keys
- **Usage Growth**: Increasing stagings per user per month
- **Professional Users**: % of users from real estate industry
- **Upgrade Rate**: Trial to paid plan conversion