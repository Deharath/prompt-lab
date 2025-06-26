# Jobs API Implementation

This implementation adds a pluggable LLM provider architecture, persistent Job model, and streaming endpoints to the PromptLab API.

## Features Implemented

### 1. Provider Abstraction

**Location**: `apps/api/src/providers/`

- **Interface**: `LLMProvider` with `complete(prompt, options): AsyncGenerator<string>`
- **OpenAI Provider**: Fully functional with streaming support for GPT models
- **Gemini Provider**: Stub implementation that simulates responses
- **Extensible**: New providers can be added by implementing the interface

**Models Supported**:
- OpenAI: `gpt-4`, `gpt-3.5-turbo`, `gpt-4-turbo-preview`
- Gemini: `gemini-pro` (stub)

### 2. Job Model & Persistence

**Location**: `apps/api/src/db/`

- **Schema**: Job with fields `id`, `prompt`, `provider`, `model`, `status`, `result`, `metrics`, `createdAt`, `updatedAt`
- **Storage**: File-based JSON database (for MVP simplicity)
- **Status Management**: `pending` → `running` → `completed`/`failed`

### 3. Streaming Job Endpoints

#### POST `/jobs`
- Creates a new job
- Validates provider and model support
- Checks API key availability
- Returns job metadata with 202 status

#### GET `/jobs/:id/stream`
- Streams completion tokens via Server-Sent Events
- Updates job status in real-time
- Sends final metrics event
- Handles errors gracefully

### 4. Key Management & Error Handling

- **Missing Keys**: Returns 503 with clear error messages
- **Invalid Providers**: Returns 400 with descriptive errors
- **Streaming Errors**: Sends error events and marks jobs as failed
- **Validation**: Validates all required fields (prompt, provider, model)

### 5. Comprehensive Testing

**Unit Tests** (`test/jobs.test.ts`):
- Input validation
- Error handling
- API key checks
- Provider validation

**E2E Tests** (`test/jobs.e2e.test.ts`):
- Full job creation and streaming flow
- Real-time SSE verification

## API Usage Examples

### Create a Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short story about AI",
    "provider": "openai",
    "model": "gpt-4"
  }'
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "prompt": "Write a short story about AI",
  "provider": "openai",
  "model": "gpt-4",
  "status": "pending",
  "createdAt": "2025-06-26T15:30:00.000Z",
  "updatedAt": "2025-06-26T15:30:00.000Z"
}
```

### Stream Job Results

```bash
curl http://localhost:3000/jobs/123e4567-e89b-12d3-a456-426614174000/stream
```

SSE Response:
```
data: {"token":"Once"}

data: {"token":" upon"}

data: {"token":" a"}

data: {"token":" time"}

event: metrics
data: {"durationMs":2500,"tokenCount":42}
```

## Environment Variables

- `OPENAI_API_KEY`: Required for OpenAI provider
- `GEMINI_API_KEY`: Required for Gemini provider  
- `DATABASE_URL`: Optional, defaults to `jobs.json`

## Testing

All tests pass including:
- 9 unit tests covering validation and error cases
- 1 E2E test covering full job flow
- Integration with existing test suite

## Next Steps

1. **Production Database**: Replace file-based storage with SQLite/PostgreSQL
2. **Rate Limiting**: Add request throttling
3. **Authentication**: Add API key authentication
4. **Monitoring**: Add metrics and logging
5. **Real Gemini Integration**: Replace stub with actual Google AI SDK
