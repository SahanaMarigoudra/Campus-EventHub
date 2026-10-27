import requests

BASE = 'http://localhost:5000/api'

# Login as super admin
login = requests.post(f'{BASE}/auth/login', json={'email': 'superadmin@college.edu', 'password': 'Admin@123'})
print('Login:', login.status_code, login.json().get('success'))
token = login.json().get('access_token', '')

headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Create a new faculty user
new_user = {
    'full_name': 'Prof. Meenakshi Pillai',
    'email': 'meenakshi.cse@college.edu',
    'role': 'faculty_coordinator',
    'department_code': 'BTECH',
    'program': 'B.Tech Computer Science Faculty',
    'phone': '+91 99887 76543'
}
res = requests.post(f'{BASE}/auth/users', json=new_user, headers=headers)
print('Create user:', res.status_code, res.json().get('success'), res.json().get('message'))
if res.ok:
    u = res.json().get('user', {})
    pwd = res.json().get('default_password')
    uid = u.get('id')
    email = u.get('email')
    dept = u.get('department_code')
    print(f'  -> ID={uid}, Email={email}, Dept={dept}, DefaultPW={pwd}')

# List users
users_res = requests.get(f'{BASE}/auth/users', headers=headers)
total = users_res.json().get('total', 0)
print(f'Total users in DB: {total}')

# Check audit logs
audit_res = requests.get(f'{BASE}/audit-logs', headers=headers)
logs = audit_res.json().get('logs', [])[:5]
print('\nRecent audit logs:')
for lg in logs:
    print(f"  [{lg.get('action')}] {lg.get('details', '')[:80]} | by {lg.get('user_email')}")

print('\nDone.')
