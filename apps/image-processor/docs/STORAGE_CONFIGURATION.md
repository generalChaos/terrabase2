# Storage Configuration

The Image Processor Service supports multiple storage backends that can be configured via environment variables.

## Storage Types

### 1. Local File Storage (Default)
Stores all data in local JSONL files. Perfect for development and single-instance deployments.

**Configuration:**
```bash
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=./storage
```

**Features:**
- ✅ No external dependencies
- ✅ Fast and reliable
- ✅ Easy to backup and migrate
- ✅ Perfect for development
- ❌ Not suitable for multi-instance deployments
- ❌ No real-time analytics

### 2. Supabase Database Storage
Stores all data in Supabase PostgreSQL database. Perfect for production and multi-instance deployments.

**Configuration:**
```bash
STORAGE_TYPE=supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

**Features:**
- ✅ Real-time analytics and monitoring
- ✅ Multi-instance support
- ✅ Built-in backup and recovery
- ✅ Advanced querying capabilities
- ❌ Requires external service
- ❌ Additional cost

### 3. No Storage
Disables all storage operations. Useful for testing or when you don't need persistence.

**Configuration:**
```bash
STORAGE_TYPE=none
```

**Features:**
- ✅ No storage overhead
- ✅ Fastest performance
- ❌ No data persistence
- ❌ No analytics or monitoring

## Environment Variables

### Core Storage Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | Storage backend type (`local`, `supabase`, `none`) |
| `LOCAL_STORAGE_DIR` | `./storage` | Directory for local file storage |

### Supabase Configuration (only used when `STORAGE_TYPE=supabase`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | - | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | - | Supabase service key (recommended for server-side) |
| `SUPABASE_ENABLED` | `true` | Enable/disable Supabase integration |
| `SUPABASE_REQUESTS_TABLE` | `processing_requests` | Table name for request logs |
| `SUPABASE_RESULTS_TABLE` | `processing_results` | Table name for result logs |
| `SUPABASE_ERRORS_TABLE` | `validation_errors` | Table name for error logs |
| `SUPABASE_METRICS_TABLE` | `performance_metrics` | Table name for performance metrics |
| `SUPABASE_CLEANUP_ENABLED` | `true` | Enable automatic cleanup |
| `SUPABASE_CLEANUP_DAYS` | `30` | Days to keep records before cleanup |

## Database Schema (Supabase)

If using Supabase, create these tables:

### processing_requests
```sql
CREATE TABLE processing_requests (
    id SERIAL PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    image_url TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_requests_request_id ON processing_requests(request_id);
CREATE INDEX idx_processing_requests_endpoint ON processing_requests(endpoint);
CREATE INDEX idx_processing_requests_created_at ON processing_requests(created_at);
```

### processing_results
```sql
CREATE TABLE processing_results (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    processing_time_ms INTEGER,
    file_size_bytes INTEGER,
    output_url TEXT,
    error_message TEXT,
    processing_steps TEXT[] DEFAULT '{}',
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_results_request_id ON processing_results(request_id);
CREATE INDEX idx_processing_results_success ON processing_results(success);
CREATE INDEX idx_processing_results_endpoint ON processing_results(endpoint);
CREATE INDEX idx_processing_results_created_at ON processing_results(created_at);
```

### validation_errors
```sql
CREATE TABLE validation_errors (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    field TEXT NOT NULL,
    error_message TEXT NOT NULL,
    value TEXT,
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_validation_errors_request_id ON validation_errors(request_id);
CREATE INDEX idx_validation_errors_field ON validation_errors(field);
CREATE INDEX idx_validation_errors_created_at ON validation_errors(created_at);
```

### performance_metrics
```sql
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT DEFAULT 'ms',
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_request_id ON performance_metrics(request_id);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at);
```

## Usage Examples

### Basic Integration

```python
from storage import storage_service

# Log a request
await storage_service.log_request(
    request_id="req-123",
    endpoint="process-logo/optimized",
    image_url="https://example.com/logo.png",
    parameters={"upscale_factor": 4}
)

# Log success
await storage_service.log_success(
    request_id="req-123",
    processing_time_ms=1500,
    file_size_bytes=1024000,
    output_url="https://example.com/processed.png"
)

# Log failure
await storage_service.log_failure(
    request_id="req-123",
    error_message="Image processing failed",
    processing_time_ms=500
)
```

### Getting Statistics

```python
# Get overall stats
stats = await storage_service.get_stats(hours=24)
print(f"Success rate: {stats['success_rate']}%")

# Get endpoint-specific stats
endpoint_stats = await storage_service.get_endpoint_stats("process-logo/optimized")
print(f"Average processing time: {endpoint_stats['avg_processing_time_ms']}ms")
```

## Migration Between Storage Types

### From Local to Supabase

1. Set up Supabase database with required tables
2. Configure environment variables for Supabase
3. Change `STORAGE_TYPE=supabase`
4. Restart the service

### From Supabase to Local

1. Change `STORAGE_TYPE=local`
2. Set `LOCAL_STORAGE_DIR` if needed
3. Restart the service

## Monitoring and Maintenance

### Cleanup

The service automatically cleans up old records based on the `SUPABASE_CLEANUP_DAYS` setting. You can also trigger manual cleanup:

```bash
curl -X POST "http://localhost:8000/api/v1/cleanup?days=30"
```

### Monitoring

Use the statistics endpoints to monitor service health:

```bash
# Overall stats
curl "http://localhost:8000/api/v1/stats?hours=24"

# Endpoint-specific stats
curl "http://localhost:8000/api/v1/stats/endpoint/process-logo/optimized?hours=24"
```

## Best Practices

1. **Development**: Use `local` storage for faster iteration
2. **Production**: Use `supabase` for better monitoring and analytics
3. **Testing**: Use `none` to avoid storage overhead
4. **Monitoring**: Regularly check statistics endpoints for service health
5. **Cleanup**: Set appropriate retention periods to prevent database bloat
6. **Backup**: For local storage, regularly backup the storage directory
7. **Security**: Use service keys for Supabase in production, not anon keys
