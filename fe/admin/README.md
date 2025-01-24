# MapleStory Admin Dashboard

A comprehensive admin dashboard for MapleStory server management.

## Features

- [x] Data Statistics
- [x] Account Management(search, add, reset password, ban, etc.)
- [x] Character Management(search, preview, etc.)
- [x] Web Shop Management(add, edit, delete, etc.)
- [x] Order Query
- [x] Notice Management(publish, edit, delete, preview, etc.)
- [x] MSData Tools(parse, import)

## Getting Started

### Environment Setup

Configure `.env` with the following variables:

```bash
# Database Configuration
MYSQL_WEBSITE_URL=
MYSQL_GAME_URL=

# Authentication
AUTH_TRUST_HOST=true
AUTH_SECRET=

# If you use http protocol, please set `COOKIE_SECURE=false`. Otherwise, set `COOKIE_SECURE=true`.
COOKIE_SECURE=true
```

### Development

```bash
pnpm install
pnpm dev
```

### Docker Deployment

Build the image:
```bash
docker build -t ms-admin .
```

Run the container:
```bash
docker run -p 3000:3000 \
  -e MYSQL_WEBSITE_URL=your_url \
  -e MYSQL_GAME_URL=your_url \
  -e AUTH_SECRET=your_secret \
  ms-admin
```

You should now be able to access the application at http://localhost:3000.

**Note: The value of the login account `webadmin` must be greater than 0, otherwise you cannot log in.**


## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Auth.js
- Postgres
- Tailwind CSS
- Shadcn UI