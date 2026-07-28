from sqlalchemy.orm import DeclarativeBase
from database import engine
class Base(DeclarativeBase): pass
Base.metadata.create_all(engine)
