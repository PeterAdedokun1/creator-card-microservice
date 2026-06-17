# Creator Card Microservice API

A REST API microservice that lets creators publish shareable profile cards showcasing their links and service rates — a "link-in-bio" card with an attached rate card.

## Tech Stack

- **Runtime:** Node.js (vanilla JavaScript)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **ID Generation:** ULID
- **Deployment:** Render / Heroku

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── endpoints/
│   └── creator-cards/
│       ├── create.js          # POST handler
│       ├── retrieve.js        # GET handler
│       └── delete.js          # DELETE handler
├── lib/
│   ├── vsl.js                 # Validator DSL (VSL)
│   └── errors.js              # AppError + throwBusinessError
├── messages/
│   └── creator-cards.js       # Response messages
├── middleware/
│   └── errorHandler.js        # Global error handler
├── models/
│   └── CreatorCard.js         # Mongoose schema
├── services/
│   └── creator-cards/
│       ├── create.js          # Create business logic
│       ├── retrieve.js        # Retrieve business logic
│       └── delete.js          # Delete business logic
└── routes.js                  # Route definitions
server.js                      # Entry point
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/creator-cards` | Create a new Creator Card |
| `GET` | `/creator-cards/:slug` | Retrieve a card by slug |
| `DELETE` | `/creator-cards/:slug` | Delete a card by slug |

No authentication required. No URL versioning.

## Getting Started

### Prerequisites

- Node.js >= 18
- A MongoDB Atlas connection string (or any MongoDB instance)

### Installation

```bash
git clone <repo-url>
cd creator-card-microservice
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Port to listen on (default: `3000`) |

### Run Locally

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Reference

### POST `/creator-cards`

Creates a new Creator Card.

**Request body:**
```json
{
  "title": "George Cooks",
  "description": "Weekly cooking podcast",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    { "title": "YouTube", "url": "https://youtube.com/@georgecooks" }
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      { "name": "IG Story Post", "description": "One story mention", "amount": 5000000 }
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

- `slug` is optional — auto-generated from `title` if omitted
- `access_type` defaults to `"public"`
- `access_code` (6 alphanumeric chars) is required when `access_type` is `"private"`

**Success response (HTTP 200):**
```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": { "id": "...", "slug": "george-cooks", ... }
}
```

---

### GET `/creator-cards/:slug`

Retrieves a published card by its slug. Applies access rules in order:

1. Card not found → `404 NF01`
2. Card is a draft → `404 NF02`
3. Private card, no `access_code` query param → `403 AC03`
4. Private card, wrong `access_code` → `403 AC04`
5. Otherwise → `200` with card data (`access_code` is never returned)

**Private card access:**
```
GET /creator-cards/my-card?access_code=A1B2C3
```

---

### DELETE `/creator-cards/:slug`

Soft-deletes a card. Deleted cards return `404 NF01` on subsequent GET requests.

**Request body:**
```json
{ "creator_reference": "crt_8f2k1m9x4p7w3q5z" }
```

Returns the deleted card (same shape as create response, with `deleted` timestamp set).

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `SL02` | 400 | Slug is already taken |
| `AC01` | 400 | `access_code` required for private cards |
| `AC05` | 400 | `access_code` must not be set on public cards |
| `NF01` | 404 | Card not found (or deleted) |
| `NF02` | 404 | Card exists but is a draft |
| `AC03` | 403 | Private card — access code required |
| `AC04` | 403 | Invalid access code |

All field-level validation failures (wrong types, missing required fields, length violations, invalid enum values) return `HTTP 400`.

## Deploying to Render

1. Push this repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set the **Build Command** to `npm install`
4. Set the **Start Command** to `npm start`
5. Add the `MONGODB_URI` environment variable in Render's dashboard
6. Deploy — your base URL will be `https://<your-service>.onrender.com`

Submit only the base URL (e.g. `https://your-service.onrender.com`) — no path, no versioning.
