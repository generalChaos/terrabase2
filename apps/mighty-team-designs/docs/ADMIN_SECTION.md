# Admin Section Design

## Admin Overview
Administrative interface for managing team logo generation system, monitoring usage, and maintaining question sets.

## Admin Features (Phase 1 - Debugging Focus)

### 1. Debug Dashboard
- **System Overview**: Total flows, successful generations, error rates
- **Recent Activity**: Latest team logo generations with debug info
- **Error Monitoring**: Failed generations and retry attempts
- **Debug Mode Toggle**: Enable/disable debug mode globally

### 2. Flow Debugging
- **Flow Inspector**: View specific team design flows with full context
- **Step-by-Step Debug**: See each step of the generation process
- **Error Investigation**: Detailed error logs and stack traces
- **Manual Intervention**: Manually complete stuck flows

### 3. Question Set Debugging
- **Question Generation Logs**: Track AI question generation attempts
- **Question Set Testing**: Test question sets for different team types
- **Fallback Monitoring**: See when generic questions are used
- **Question Performance**: Success rates by team type

### 4. Logo Generation Debugging
- **Generation Logs**: Track all logo generation attempts with full context
- **AI Response Debug**: View raw AI responses and prompts
- **Retry Patterns**: See retry attempts and failure reasons
- **Cost Tracking**: Monitor OpenAI API costs per generation

### 5. System Debugging
- **API Logs**: Track all API calls and responses
- **Database Queries**: Monitor database performance
- **Error Patterns**: Identify common failure points
- **Performance Metrics**: Generation times and bottlenecks

## Admin UI Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  🏆 Mighty Team Designs - Admin (Debug Mode)           │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [Flows] [Questions] [Logos] [System]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Debug Content Area]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Debug Dashboard View
```
┌─────────────────────────────────────────────────────────┐
│  🐛 Debug Dashboard                                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Total Flows │ │ Success Rate│ │ Error Rate  │      │
│  │    1,247    │ │    94.2%    │ │    5.8%     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
│  🔍 Recent Debug Activity                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Eagles U12 Soccer - Generated 2m ago [View]    │   │
│  │ Thunder U14 Basketball - Generated 5m ago [View]│   │
│  │ Lightning U10 Soccer - Failed 8m ago [Debug]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️  Active Errors (3)                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ OpenAI API timeout - 2 occurrences             │   │
│  │ Question generation failed - 1 occurrence      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Question Set Management
```
┌─────────────────────────────────────────────────────────┐
│  ❓ Question Sets                                       │
├─────────────────────────────────────────────────────────┤
│  [Create New] [Generate AI] [Import] [Export]          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Youth Soccer U12                               │   │
│  │ Sport: soccer | Age: U12 | Status: Active     │   │
│  │ Questions: 3 | Generated: 2024-01-15          │   │
│  │ [Edit] [Test] [Deactivate] [Delete]           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Adult Recreational                             │   │
│  │ Sport: any | Age: adult | Status: Active      │   │
│  │ Questions: 3 | Generated: 2024-01-10          │   │
│  │ [Edit] [Test] [Deactivate] [Delete]           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Admin Database Schema (Debugging Focus)

### Debug Logs Table
```sql
CREATE TABLE debug_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID REFERENCES team_design_flows(id),
  log_level VARCHAR NOT NULL, -- 'debug', 'info', 'warn', 'error'
  category VARCHAR NOT NULL, -- 'question_generation', 'logo_generation', 'api', 'database'
  message TEXT NOT NULL,
  context JSONB, -- Additional debug context
  stack_trace TEXT, -- For errors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### System Metrics Table
```sql
CREATE TABLE system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR NOT NULL, -- 'success_rate', 'error_rate', 'avg_generation_time'
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR, -- 'percentage', 'seconds', 'count'
  time_period VARCHAR NOT NULL, -- 'hour', 'day', 'week'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Error Patterns Table
```sql
CREATE TABLE error_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type VARCHAR NOT NULL, -- 'openai_timeout', 'question_generation_failed'
  error_message TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  first_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);
```

## Admin API Endpoints (Debugging Focus)

### Debug Dashboard
- `GET /api/admin/debug/dashboard` - Debug metrics and overview
- `GET /api/admin/debug/activity` - Recent debug activity
- `GET /api/admin/debug/errors` - Active error patterns

### Flow Debugging
- `GET /api/admin/debug/flows` - List all flows with debug info
- `GET /api/admin/debug/flows/[id]` - Detailed flow inspection
- `GET /api/admin/debug/flows/[id]/logs` - Flow-specific debug logs
- `POST /api/admin/debug/flows/[id]/retry` - Retry failed flow

### Question Debugging
- `GET /api/admin/debug/questions` - Question generation logs
- `GET /api/admin/debug/questions/test` - Test question generation
- `GET /api/admin/debug/questions/fallback` - Fallback usage stats

### Logo Debugging
- `GET /api/admin/debug/logos` - Logo generation logs
- `GET /api/admin/debug/logos/[id]` - Specific logo generation debug
- `POST /api/admin/debug/logos/[id]/retry` - Retry logo generation

### System Debugging
- `GET /api/admin/debug/logs` - All debug logs
- `GET /api/admin/debug/metrics` - System performance metrics
- `GET /api/admin/debug/errors` - Error patterns and trends

## Admin Authentication (Simple)

### Authentication Strategy
- **Environment Variable** - Simple admin access via `ADMIN_PASSWORD`
- **Session-based** - Basic session management
- **No complex roles** - Single admin access level
- **Development focus** - Simple setup for debugging

### Admin Access
- **Single admin** - One admin user for debugging
- **Password protection** - Environment variable password
- **Session timeout** - Automatic logout for security
- **Debug mode** - Enhanced logging when admin is active

## Admin Security

### Access Control
- **Admin-only routes** - Protect admin endpoints
- **Role-based permissions** - Different access levels
- **Activity logging** - Track all admin actions
- **Session timeout** - Automatic logout for security

### Data Protection
- **No sensitive data** - Don't expose user personal information
- **Audit trails** - Log all admin actions
- **Backup access** - Secure backup and restore capabilities
- **Error handling** - Graceful error handling without data exposure

## Admin Features by Phase

### Phase 1: Debug-Focused Admin (Current)
- Debug dashboard with error monitoring
- Flow inspection and debugging
- Question generation debugging
- Logo generation debugging
- System performance monitoring
- Simple environment variable authentication

### Phase 2: Enhanced Debugging
- Advanced error pattern analysis
- Automated error detection
- Performance optimization tools
- Bulk debugging operations
- Enhanced logging and metrics

### Phase 3: Production Admin
- User management features
- Advanced analytics and reporting
- System configuration management
- Multi-tenant support
- Full authentication system

## Admin UI Components

### Reusable Components
- **DataTable** - Sortable, filterable data tables
- **MetricCard** - Dashboard metric displays
- **ActivityFeed** - Real-time activity updates
- **FormBuilder** - Dynamic form creation
- **ChartComponents** - Data visualization

### Debug-Specific Components
- **FlowInspector** - Debug team design flows with step-by-step view
- **ErrorMonitor** - Real-time error tracking and patterns
- **LogViewer** - Browse and filter debug logs
- **MetricsDashboard** - System performance metrics
- **RetryManager** - Retry failed operations
- **DebugTester** - Test question generation and logo creation
