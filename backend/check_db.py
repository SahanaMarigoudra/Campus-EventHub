import sqlite3
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

db_path = 'dev_events.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Show certificate schema
cursor.execute("PRAGMA table_info(certificates)")
cols = [c[1] for c in cursor.fetchall()]
print('=== CERTIFICATES SCHEMA ===')
print(cols)

# Show users with student role
print('\n=== STUDENT USERS ===')
cursor.execute("SELECT id, full_name, email, role, department_id, program, roll_number FROM users WHERE role='student' LIMIT 10")
rows = cursor.fetchall()
for r in rows:
    print(r)

# Show departments
print('\n=== DEPARTMENTS ===')
cursor.execute("SELECT id, name, code, coordinator_name, coordinator_email FROM departments")
rows = cursor.fetchall()
for r in rows:
    print(r)

# Summary stats
print('\n=== SUMMARY ===')
for t in ['users', 'departments', 'events', 'registrations', 'certificates']:
    cursor.execute(f"SELECT COUNT(*) FROM {t}")
    print(f'  {t}: {cursor.fetchone()[0]} records')

cursor.execute("SELECT COUNT(*) FROM users WHERE role='student'")
print(f"  students (role=student): {cursor.fetchone()[0]}")
cursor.execute("SELECT COUNT(*) FROM users WHERE role='dept_coordinator'")
print(f"  dept_coordinators: {cursor.fetchone()[0]}")

# Show certificate sample with correct cols
col_str = ', '.join(cols[:8])
cursor.execute(f"SELECT {col_str} FROM certificates LIMIT 5")
rows = cursor.fetchall()
print(f'\n=== CERTIFICATE SAMPLE ({col_str}) ===')
for r in rows:
    print(dict(zip(cols[:8], r)))

conn.close()
print('\nDatabase connectivity: OK')
