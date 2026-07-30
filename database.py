import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False
)


def test_connection():
    with engine.connect() as connection:
        version = connection.execute(
            text("SELECT version();")
        ).scalar()

        print(version, flush=True)
