# Ory Kratos Token Validation API

A simple Axum HTTP API that validates user session tokens with Ory Kratos.

## Features

- **POST /validate** - Validates session tokens against Ory Kratos
- **GET /health** - Health check endpoint
- **GET /** - API information

## Supported Token Formats

The API supports multiple ways to provide the session token:

1. **Authorization Header**: `Authorization: Bearer <token>`
2. **X-Session-Token Header**: `X-Session-Token: <token>`
3. **Cookie**: `ory_session_*=<token>`

## Setup

1. Ensure your `.env` file in the project root has the Ory SDK URL:
   ```
   NEXT_PUBLIC_ORY_SDK_URL=https://your-project.projects.oryapis.com
   ```

2. Build and run the server:
   ```bash
   cargo run
   ```

   The server will start on `http://0.0.0.0:3001`

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Validate Token (with Bearer token)
```bash
curl -X POST http://localhost:3001/validate \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Validate Token (with X-Session-Token header)
```bash
curl -X POST http://localhost:3001/validate \
  -H "X-Session-Token: YOUR_SESSION_TOKEN"
```

### Validate Token (with cookie)
```bash
curl -X POST http://localhost:3001/validate \
  -H "Cookie: ory_session_xxx=YOUR_SESSION_TOKEN"
```

## Response Format

### Valid Session
```json
{
  "valid": true,
  "session": {
    "id": "session-id",
    "active": true,
    "identity": {
      "id": "identity-id",
      "traits": {
        "email": "user@example.com"
      }
    }
  },
  "error": null
}
```

### Invalid Session
```json
{
  "valid": false,
  "session": null,
  "error": "Invalid session: Kratos returned status: 401"
}
```

## Integration with Frontend

The `ory-test` Next.js frontend includes a test page that calls this API. To test the full integration:

1. Start this backend server (port 3001)
2. Start the frontend: `cd ../ory-test && npm run dev`
3. Visit `http://localhost:3000` and click "Validate Session Token"
