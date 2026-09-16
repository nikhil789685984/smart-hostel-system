import sqlite3
import random
from datetime import datetime

names = [
  'Aarav Sharma', 'Aditi Verma', 'Rohan Desai', 'Priya Singh',
  'Kabir Das', 'Ananya Iyer', 'Vikram Malhotra', 'Neha Gupta',
  'Arjun Nair', 'Sanya Kapoor', 'Rahul Khanna', 'Pooja Reddy',
  'Dev Joshi', 'Kavya Menon', 'Ishaan Bhatt', 'Riya Sen',
  'Aditya Rao', 'Tara Chauhan', 'Karan Mehta', 'Zara Khan'
]
branches = ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics']
password_hash = '$2a$10$X8Xg/e3Zt2Y8R.VvB1zJheE6/FfA2rB/m1n.z6L8/3oN8P0.R6eK6'
today = datetime.now().strftime('%Y-%m-%d')

conn = sqlite3.connect('src/database/hostel.db')
cursor = conn.cursor()

for name in names:
    email = name.lower().replace(' ', '.') + '@university.edu'
    phone = '98765' + str(random.randint(10000, 99999))
    branch = random.choice(branches)
    roll_number = 'B24' + branch[:2].upper() + str(random.randint(1000, 9999))
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        continue
        
    cursor.execute("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)", (name, email, password_hash, 'student', phone))
    user_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO students (user_id, roll_number, branch, year) VALUES (?, ?, ?, ?)", (user_id, roll_number, branch, 1))
    student_id = cursor.lastrowid
    
    cursor.execute("SELECT id FROM beds WHERE status = 'vacant' LIMIT 1")
    bed = cursor.fetchone()
    if bed:
        bed_id = bed[0]
        cursor.execute("UPDATE beds SET status = 'occupied' WHERE id = ?", (bed_id,))
        cursor.execute("INSERT INTO room_allocations (student_id, bed_id, allocated_from, status) VALUES (?, ?, ?, 'active')", (student_id, bed_id, today))
        
    cursor.execute("INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status) VALUES (?, 1, 45000.0, 0.0, 45000.0, date('now', '+30 days'), 'Pending')", (student_id,))
    
    print(f"Added {name}")

conn.commit()
conn.close()
print("Done")
