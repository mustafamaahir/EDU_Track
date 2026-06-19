from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from app.routers import auth, results, leaderboard, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()   # creates tables on startup if they don't exist
    yield

app = FastAPI(title="EduTrack API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://holicoaching.vercel.app",   
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",        tags=["Auth"])
app.include_router(results.router,     prefix="/results",     tags=["Results"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(admin.router,       prefix="/admin",       tags=["Admin"])

@app.get("/")
def root():
    return {"message": "EduTrack API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
