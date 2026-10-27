"""
Quick SQLite CLI helper for Event Registration Platform.
Usage:
  python query_db.py "SELECT id, full_name, role FROM users LIMIT 10;"
  python query_db.py .tables
  python query_db.py
"""
import os
import sys
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'dev_events.db')
if not os.path.exists(DB_PATH):
    # fallback to root dev_events.db if instance does not exist
    DB_PATH = os.path.join(os.path.dirname(__file__), 'dev_events.db')

def print_table(cursor, rows):
    if not cursor.description:
        print("Query executed successfully (no rows returned).")
        return
    headers = [col[0] for col in cursor.description]
    str_rows = [[str(val if val is not None else 'NULL') for val in row] for row in rows]
    col_widths = [len(h) for h in headers]
    for row in str_rows:
        for idx, val in enumerate(row):
            col_widths[idx] = max(col_widths[idx], len(val))
    
    separator = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
    header_line = "| " + " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers)) + " |"
    
    print(separator)
    print(header_line)
    print(separator)
    for row in str_rows:
        print("| " + " | ".join(val.ljust(col_widths[i]) for i, val in enumerate(row)) + " |")
    print(separator)
    print(f"({len(rows)} row{'s' if len(rows) != 1 else ''})\n")

def run_query(sql):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        if sql.strip() == ".tables":
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            rows = cursor.fetchall()
            print("\nDatabase Tables:")
            for r in rows:
                print(f" - {r[0]}")
            print()
            return

        if sql.strip().startswith(".schema"):
            parts = sql.strip().split()
            table_name = parts[1] if len(parts) > 1 else None
            if table_name:
                cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
            else:
                cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
            for r in cursor.fetchall():
                if r[0]:
                    print(r[0] + ";\n")
            return

        cursor.execute(sql)
        if sql.strip().lower().startswith(('insert', 'update', 'delete', 'create', 'drop', 'alter')):
            conn.commit()
            print(f"Rows affected: {cursor.rowcount}")
        else:
            rows = cursor.fetchall()
            print_table(cursor, rows)
    except Exception as e:
        print(f"SQL Error: {e}", file=sys.stderr)
    finally:
        conn.close()

if __name__ == '__main__':
    print(f"Connected to SQLite Database: {DB_PATH}")
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        run_query(query)
    else:
        print("Interactive Mode. Type your SQL query, '.tables', or 'exit'/'quit' to leave.\n")
        while True:
            try:
                line = input("sqlite> ")
                if not line.strip():
                    continue
                if line.strip().lower() in ('exit', 'quit', '.exit', '.quit'):
                    break
                run_query(line)
            except (KeyboardInterrupt, EOFError):
                break
        print("\nDisconnected.")
