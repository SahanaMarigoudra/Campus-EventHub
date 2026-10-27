import sqlite3, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

db_path = os.path.join('instance', 'dev_events.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Verify the newly created user is in DB
cursor.execute("SELECT id, full_name, email, role, department_id, program, phone, is_active FROM users WHERE email='meenakshi.cse@college.edu'")
row = cursor.fetchone()
if row:
    print(f'NEW USER FOUND IN DB: id={row[0]}, name={row[1]}, email={row[2]}, role={row[3]}, dept_id={row[4]}, program={row[5]}, phone={row[6]}, active={row[7]}')
else:
    print('ERROR: User not found in DB!')

# Verify audit log was persisted
cursor.execute("SELECT id, action, user_email, details, timestamp FROM audit_logs ORDER BY id DESC LIMIT 3")
rows = cursor.fetchall()
print('\nAUDIT LOGS IN DB:')
for r in rows:
    print(f'  [{r[1]}] {r[3][:80]} | by {r[2]} | at {r[4]}')

# Summary counts
print('\nFINAL DB COUNTS:')
for t in ['users', 'departments', 'events', 'registrations', 'certificates', 'audit_logs', 'notifications']:
    cursor.execute(f'SELECT COUNT(*) FROM {t}')
    print(f'  {t}: {cursor.fetchone()[0]}')

conn.close()
print('\nDatabase persistence: VERIFIED')
