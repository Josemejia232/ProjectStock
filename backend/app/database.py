import os as _os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

_raw = _os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./inventario.db")
if _raw.startswith("postgresql://") and "+asyncpg" not in _raw:
    _raw = _raw.replace("postgresql://", "postgresql+asyncpg://")
DATABASE_URL = _raw

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from app.models import Proyecto, Material, Inventario, Movimiento, Requisicion
        await conn.run_sync(Base.metadata.create_all)

        # Add columns for existing tables (safe for both SQLite and PostgreSQL)
        def add_columns(sync_conn):
            from sqlalchemy import inspect, text
            dialect = sync_conn.dialect.name
            if dialect == "sqlite":
                inspector = inspect(sync_conn)
                cols = [c["name"] for c in inspector.get_columns("requisiciones")]
                if "aprobado_por" not in cols:
                    sync_conn.execute(text("ALTER TABLE requisiciones ADD COLUMN aprobado_por VARCHAR(200) DEFAULT ''"))
                if "elaborado_por" not in cols:
                    sync_conn.execute(text("ALTER TABLE requisiciones ADD COLUMN elaborado_por VARCHAR(200) DEFAULT ''"))
                mov_cols = [c["name"] for c in inspector.get_columns("movimientos")]
                if "categoria" not in mov_cols:
                    sync_conn.execute(text("ALTER TABLE movimientos ADD COLUMN categoria VARCHAR(20) DEFAULT 'normal'"))
            else:
                for stmt in [
                    "ALTER TABLE requisiciones ADD COLUMN IF NOT EXISTS aprobado_por VARCHAR(200) DEFAULT ''",
                    "ALTER TABLE requisiciones ADD COLUMN IF NOT EXISTS elaborado_por VARCHAR(200) DEFAULT ''",
                    "ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS categoria VARCHAR(20) DEFAULT 'normal'",
                ]:
                    try:
                        sync_conn.execute(text(stmt))
                    except Exception:
                        pass
        await conn.run_sync(add_columns)
