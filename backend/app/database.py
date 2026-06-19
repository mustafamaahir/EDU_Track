import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL").replace("?pgbouncer=true", "")

# pgbouncer=true in the URL disables prepared statements (required for transaction pooler)
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"options": "-c statement_timeout=30000"},
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
