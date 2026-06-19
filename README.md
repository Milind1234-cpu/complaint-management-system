# Complaint Management System

Full-stack app — FastAPI backend + React/Vite/Tailwind frontend.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # fill in values
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

> Make sure MongoDB is running before starting the backend.

## Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Backend  | FastAPI, Motor (async MongoDB), Pydantic v2 |
| Auth     | JWT (python-jose), bcrypt (passlib)         |
| Database | MongoDB                                     |
| Frontend | React 18, Vite, Tailwind CSS, Zustand       |
| Charts   | Recharts                                    |

## Project Layout

```
complaint-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py            ← FastAPI app + lifespan
│   │   ├── config.py          ← Settings from .env
│   │   ├── db/database.py     ← Motor client
│   │   ├── models/            ← Pydantic schemas
│   │   ├── auth/              ← JWT + role dependencies
│   │   ├── routers/           ← All API routes
│   │   └── services/          ← Auto-assignment logic
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/             ← One file per page
        ├── components/        ← Layout, Badge
        ├── store/authStore.ts ← Zustand auth state
        ├── lib/api.ts         ← Axios instance + interceptors
        └── types/index.ts     ← Shared TypeScript types
```
