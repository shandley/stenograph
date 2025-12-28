# Web Dev API Vignette

A realistic workflow using steno-graph to enhance an Express API.

## The Scenario

You have a basic CRUD API (`server.js`) that needs:
- Input validation
- Authentication
- Rate limiting
- Tests

## Steno Workflow

### 1. Explore the codebase

```
dx:@server.js
```
> Analyzes the file, identifies endpoints, notes the TODO for validation.

### 2. Plan enhancements

```
?plan api-hardening +validation +auth +rate-limit
```
> Claude outlines an approach before making changes.

### 3. Add input validation

```
ch:@server.js +validation
```
> Adds validation to POST/PUT endpoints (email format, required fields).

### 4. Add authentication middleware

```
mk:middleware/auth.js +jwt
```
> Creates JWT authentication middleware.

```
ch:@server.js +auth -GET:/api/users
```
> Applies auth to all routes except public GET.

### 5. Add rate limiting

```
ch:@server.js +rate-limit .config:100/min
```
> Adds rate limiting middleware, 100 requests per minute.

### 6. Generate tests

```
mk:server.test.js
```
> Creates Jest tests for all endpoints.

```
ts:@server.test.js
```
> Runs the tests.

### 7. Document the API

```
doc:@server.js .format:openapi
```
> Generates OpenAPI/Swagger documentation.

## Quick Commands

| Task | Command |
|------|---------|
| Explore | `dx:@server.js` |
| Find auth code | `fnd:authentication` |
| Add feature | `ch:@server.js +feature` |
| Create file | `mk:filename.js` |
| Run tests | `ts:@server.test.js` |
| Deep review | `dx:@server.js ~deep` |
| Ask first | `ch:@server.js +auth?` |

## Before/After

**Before** (natural language):
```
"Can you please look at server.js and add validation to the
POST endpoint? Make sure to validate email format and that
name is required. Also add appropriate error messages."
```

**After** (steno):
```
ch:@server.js +validation
```

Claude understands the context and applies appropriate validation.
