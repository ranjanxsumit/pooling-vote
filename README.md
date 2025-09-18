# Real-Time Polling API

Backend service for a real-time polling application using Node.js, Express, PostgreSQL, Prisma, and Socket.IO.

<img width="551" height="545" alt="image" src="https://github.com/user-attachments/assets/31bba05f-a5b1-41b8-8bbf-c80a4155205f" />


## Features
- Users: create and list
- Polls: create, list, get with options and vote counts
- Votes: cast vote for an option
- Real-time: clients join a poll room and receive live results when votes are cast

## Quick Start

1) Prerequisites
- Node.js 18+
- PostgreSQL running and accessible

2) Configure environment
Create a `.env` file with your database URL:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
PORT=3000
```

3) Install dependencies and set up Prisma

```
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4) Run in dev mode

```
npm run dev
```

Server listens on http://localhost:3001 (default from `.env`)

## How to run

- Backend (run in project root):

```powershell
npm run build
npm start
```

- Frontend (run in project root):

```powershell
npm run dev --prefix client
```

Open the app at: http://localhost:5173/

## How to test

End-to-end flow to verify real-time updates:

1) Create a user

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/users -ContentType 'application/json' -Body (@{
  name='Demo'; email="demo+$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"; password='demopass'
} | ConvertTo-Json)
```

Copy the `id` from the response.

2) Create a poll (replace CREATOR_ID with the id you copied)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/polls -ContentType 'application/json' -Body (@{
  question='Your question?'; isPublished=$true; creatorId='CREATOR_ID'; options=@('Option A','Option B')
} | ConvertTo-Json)
```

Copy the poll `id` from the response.

3) View the poll in two browser windows

- Open http://localhost:5173/ and click your poll to open `/polls/:id` in two separate windows/tabs.

4) Vote and see live results

- In one window, enter your user id and click Vote on an option.
- You should see the counts update instantly in both windows via WebSocket `poll:results` events.

Optional health checks:

```powershell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod http://localhost:3001/health/db
```

## API

- POST /api/users { name, email, password }
- GET /api/users

- POST /api/polls { question, isPublished?, creatorId, options: [string, ...] }
- GET /api/polls
- GET /api/polls/:id

- POST /api/votes { userId, pollOptionId }

## WebSocket

- Connect to Socket.IO at the same origin
- Join a specific poll room:
  - emit 'poll:join', pollId
- Leave a poll room:
  - emit 'poll:leave', pollId
- Listen for live results:
  - on 'poll:results', ({ pollId, options: [{ id, text, votes }] }) => { ... }

## Notes
- Vote uniqueness: a user can vote for multiple options (many-to-many). If you want only one vote per poll, enforce at application level (e.g., check existing votes by user across all options for that poll before creating).
