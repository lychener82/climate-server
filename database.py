import os
from sqlalchemy import create_engine
from sqlalchemy import text

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


def test_connection():
    with engine.connect() as connection:
        version = connection.execute(
            text("SELECT version();")
        ).scalar()

        print(version)
