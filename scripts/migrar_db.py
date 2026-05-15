"""
Migrar datos de SQLite local a PostgreSQL (Railway).

Uso:
  1. Asegúrate de tener DATABASE_URL en las variables de entorno
     apuntando a tu PostgreSQL de Railway.
  2. Ejecuta: python scripts/migrar_db.py

Requiere: pip install asyncpg aiosqlite
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["DATABASE_URL"] = os.environ.get(
    "DATABASE_URL", os.environ.get("RAILWAY_DATABASE_URL", "")
)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


TABLAS = [
    "proyectos",
    "materiales",
    "inventario",
    "movimientos",
    "facturas",
    "requisiciones",
    "requisiciones_detalle",
    "precios_historicos",
]


async def migrate():
    sqlite_url = "sqlite+aiosqlite:///./inventario.db"
    pg_raw = os.environ.get("DATABASE_URL", "")
    if not pg_raw:
        print("ERROR: Define DATABASE_URL con la URL de PostgreSQL de Railway")
        sys.exit(1)

    if pg_raw.startswith("postgresql://") and "+asyncpg" not in pg_raw:
        pg_raw = pg_raw.replace("postgresql://", "postgresql+asyncpg://")

    sqlite = create_async_engine(sqlite_url)
    pg = create_async_engine(pg_raw)

    print("Conectando a SQLite...")
    print(f"Conectando a PostgreSQL...")

    # Crear tablas en PostgreSQL
    async with pg.begin() as conn:
        from app.models import Base
        await conn.run_sync(Base.metadata.create_all)

    for tabla in TABLAS:
        try:
            async with sqlite.connect() as conn:
                rows = await conn.execute(text(f"SELECT * FROM {tabla}"))
                columns = rows.keys()
                data = rows.all()
        except Exception as e:
            print(f"  {tabla}: ERROR leyendo de SQLite: {e}")
            continue

        if not data:
            print(f"  {tabla}: 0 filas (saltando)")
            continue

        # Insertar en PostgreSQL
        async with pg.connect() as pg_conn:
            for row in data:
                vals = {c: getattr(row, c) for c in columns}
                placeholders = ", ".join([f":{c}" for c in columns])
                cols_str = ", ".join(columns)
                try:
                    await pg_conn.execute(
                        text(f"INSERT INTO {tabla} ({cols_str}) VALUES ({placeholders})"),
                        vals,
                    )
                except Exception as e:
                    print(f"  {tabla}: error insertando fila: {e}")
                    continue
            await pg_conn.commit()

        print(f"  {tabla}: {len(data)} filas migradas")

    await sqlite.dispose()
    await pg.dispose()
    print("\nMigración completada.")


if __name__ == "__main__":
    asyncio.run(migrate())
