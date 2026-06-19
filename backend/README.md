# Complaint Management System — Backend

FastAPI + MongoDB backend for managing customer complaints.

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in your values
```

## Run

```bash
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

## Roles

| Role     | Capabilities                                      |
|----------|---------------------------------------------------|
| customer | Submit & view own tickets, add comments           |
| agent    | View & update assigned tickets, add comments      |
| manager  | Full ticket access, manage teams & products       |
| admin    | Everything, including user role management        |

## Endpoints

| Method | Path                              | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | /api/auth/register                | Register new user            |
| POST   | /api/auth/login                   | Login (returns JWT)          |
| GET    | /api/auth/me                      | Current user profile         |
| GET    | /api/users/                       | List users (admin/manager)   |
| PATCH  | /api/users/{id}                   | Update user                  |
| GET    | /api/teams/                       | List teams                   |
| POST   | /api/teams/                       | Create team                  |
| POST   | /api/teams/{id}/members/{uid}     | Add member to team           |
| GET    | /api/products/                    | List products                |
| POST   | /api/products/                    | Create product               |
| GET    | /api/tickets/                     | List tickets (role-filtered) |
| POST   | /api/tickets/                     | Create ticket                |
| PATCH  | /api/tickets/{id}                 | Update ticket                |
| POST   | /api/tickets/{id}/comments        | Add comment                  |
| GET    | /api/analytics/summary            | Ticket counts by status      |
| GET    | /api/analytics/by-product         | Tickets grouped by product   |
| GET    | /api/analytics/by-agent           | Tickets grouped by agent     |
