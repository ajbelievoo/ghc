#!/usr/bin/env python3
"""
Migrate GHC data from SQLite to PostgreSQL.

Usage:
    export SQLITE_URL=sqlite:///./believoo_dev.db
    export POSTGRES_URL=postgresql://ghc_user:ghc_password@localhost:5432/ghc_production
    python3 scripts/migrate_sqlite_to_postgres.py

The target Postgres database will be created if it does not exist (requires
a postgres superuser connection or an already-created database).
"""

import os
import sys
from datetime import datetime

from sqlalchemy import create_engine, inspect, text

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models.models import Base


def create_database_if_needed(target_url: str) -> None:
    """Create the target PostgreSQL database if it does not exist."""
    from sqlalchemy.engine.url import make_url

    url = make_url(target_url)
    if url.drivername.startswith('postgresql'):
        # Connect to the 'postgres' maintenance database
        maintenance_url = url.set(database='postgres')
        maintenance_engine = create_engine(
            maintenance_url.render_as_string(hide_password=False),
            isolation_level='AUTOCOMMIT',
        )
        with maintenance_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db"),
                {'db': url.database},
            )
            if not result.fetchone():
                print(f"Creating PostgreSQL database {url.database}...")
                conn.execute(text(f'CREATE DATABASE "{url.database}"'))
            else:
                print(f"Database {url.database} already exists.")
        maintenance_engine.dispose()


def copy_table(source_engine, target_engine, table_name, table) -> int:
    """Copy all rows from a source table to a target table."""
    with source_engine.connect() as source_conn:
        rows = source_conn.execute(table.select()).fetchall()

    if not rows:
        print(f"  {table_name}: 0 rows")
        return 0

    records = [dict(row._mapping) for row in rows]

    # Clean datetime tz issues for older SQLite data
    for record in records:
        for key, value in record.items():
            if isinstance(value, datetime):
                record[key] = value.replace(tzinfo=None)

    with target_engine.connect() as target_conn:
        with target_conn.begin():
            target_conn.execute(text(f'TRUNCATE TABLE {table_name} CASCADE'))
            target_conn.execute(table.insert(), records)

    print(f"  {table_name}: {len(records)} rows")

    print(f"  {table_name}: {len(records)} rows")
    return len(records)


def reset_sequences(target_engine) -> None:
    """Reset PostgreSQL serial sequences after data copy."""
    inspector = inspect(target_engine)
    with target_engine.connect() as conn:
        for table_name in inspector.get_table_names():
            pk = inspector.get_pk_constraint(table_name)
            for col in pk.get('constrained_columns', []):
                # Check if the column has a default nextval
                result = conn.execute(text(
                    """SELECT pg_get_serial_sequence(:table, :col)"""
                ), {'table': table_name, 'col': col})
                seq = result.scalar()
                if seq:
                    conn.execute(text(
                        f"SELECT setval('{seq}', COALESCE((SELECT MAX({col}) FROM {table_name}), 1), true)"
                    ))
        conn.commit()


def main():
    source_url = os.environ.get('SQLITE_URL', 'sqlite:///./believoo_dev.db')

    # Allow explicit POSTGRES_URL, otherwise fall back to the app's DATABASE_URL
    # so the script can be run without exposing the URL on the command line.
    target_url = os.environ.get('POSTGRES_URL', '')
    if not target_url:
        from app.core.config import get_settings

        target_url = get_settings().database_url

    if not target_url or target_url.startswith('sqlite'):
        print("ERROR: Set POSTGRES_URL or DATABASE_URL to a PostgreSQL URL.")
        sys.exit(1)

    print(f"Source: {source_url}")
    print(f"Target: {target_url}")

    create_database_if_needed(target_url)

    source_engine = create_engine(source_url, connect_args={"check_same_thread": False})
    target_engine = create_engine(target_url, pool_pre_ping=True)

    print("\nCreating target schema...")
    Base.metadata.drop_all(bind=target_engine)
    Base.metadata.create_all(bind=target_engine)

    total = 0
    print("\nCopying tables...")

    # Copy tables in foreign-key dependency order (parents before children).
    # SQLAlchemy's sorted_tables already resolves this.
    for table in Base.metadata.sorted_tables:
        table_name = table.name
        try:
            total += copy_table(source_engine, target_engine, table_name, table)
        except Exception as e:
            print(f"  ERROR copying {table_name}: {e}")
            raise

    source_engine.dispose()

    print("\nResetting PostgreSQL sequences...")
    reset_sequences(target_engine)

    print(f"\nMigration complete. {total} rows copied.")
    target_engine.dispose()


if __name__ == '__main__':
    main()
