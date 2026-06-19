from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from bson.errors import InvalidId

from app.config import settings
from app.db.database import init_indexes
from app.routers import (
    auth_router,
    users_router,
    teams_router,
    products_router,
    tickets_router,
    analytics_router,
)

app = FastAPI(
    title="Complaint Management System API",
    description="Backend API for ticket lifecycle management, auto-assignment, and performance analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_indexes()


# ---- Global error handlers (clean, consistent error responses) ----

@app.exception_handler(InvalidId)
async def invalid_object_id_handler(request: Request, exc: InvalidId):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Invalid ID format provided."},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


# ---- Routers ----

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(teams_router.router)
app.include_router(products_router.router)
app.include_router(tickets_router.router)
app.include_router(analytics_router.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "Complaint Management System API"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}