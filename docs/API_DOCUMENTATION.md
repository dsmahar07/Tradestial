# Tradestial API Documentation

## Overview
Tradestial API provides endpoints for trading analytics, AI chat, and data management.

## Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication
Currently using API key authentication. Pass the API key in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting
- General API: 60 requests per minute
- AI Chat: 10 requests per minute
- Authentication: 5 attempts per 15 minutes

## Endpoints

### AI Chat
#### POST `/api/ai-chat`
Generate AI responses with trading context.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ],
  "tradingContext": {
    "totalTrades": "number",
    "winRate": "number",
    "totalPnl": "number",
    "recentTrades": "array"
  }
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "content": "string"
      }
    }
  ]
}
```

**Error Codes:**
- `429`: Rate limit exceeded
- `500`: Internal server error

### Trading Data
#### GET `/api/trades`
Retrieve trading data (placeholder for future implementation).

**Query Parameters:**
- `accountId`: Account identifier
- `startDate`: ISO date string
- `endDate`: ISO date string
- `symbol`: Trading symbol filter

**Response:**
```json
{
  "trades": [
    {
      "id": "string",
      "symbol": "string",
      "side": "LONG|SHORT",
      "entryPrice": "number",
      "exitPrice": "number",
      "quantity": "number",
      "pnl": "number",
      "openDate": "string",
      "closeDate": "string"
    }
  ],
  "total": "number"
}
```

### Analytics
#### GET `/api/analytics/performance`
Get performance metrics (placeholder for future implementation).

**Query Parameters:**
- `accountId`: Account identifier
- `period`: "day|week|month|year"

**Response:**
```json
{
  "metrics": {
    "winRate": "number",
    "profitFactor": "number",
    "sharpeRatio": "number",
    "maxDrawdown": "number",
    "totalPnl": "number",
    "avgWin": "number",
    "avgLoss": "number"
  }
}
```

### CSV Import
#### POST `/api/import/csv`
Import trading data from CSV (placeholder for future implementation).

**Request:**
- Content-Type: `multipart/form-data`
- File field: `csv`
- Broker field: `broker` (tradingview|tradovate|etc)

**Response:**
```json
{
  "imported": "number",
  "errors": "array",
  "warnings": "array"
}
```

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "message": "string",
    "code": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Missing or invalid authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_ERROR`: Too many requests
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Security Headers
All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000`

## Webhooks (Future)
Webhook support for real-time notifications is planned for future releases.

## SDKs
JavaScript/TypeScript SDK coming soon.

## Support
For API support, contact: support@tradestial.com
