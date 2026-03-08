from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

_uri = settings.db_uri()
_is_sqlite = _uri.startswith("sqlite")

_engine_kwargs: dict = {"pool_pre_ping": True}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {
        "check_same_thread": False,
        "timeout": 30,
    }

engine = create_engine(_uri, **_engine_kwargs)

# Enable WAL mode for SQLite so reads don't block writes
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
