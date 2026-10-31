import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'hostel.db');

console.log('Connecting to database at:', dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // Disable during reset

console.log('Clearing existing records...');
const tables = [
  'fee_transactions', 'attendance', 'gate_passes', 'room_change_requests',
  'fees', 'notices', 'mess_feedback', 'mess_menu', 'complaint_updates',
  'complaints', 'room_allocations', 'wardens', 'students', 'beds',
  'rooms', 'blocks', 'hostels', 'users'
];

for (const t of tables) {
  try {
    db.prepare(`DELETE FROM ${t}`).run();
  } catch (e) {
    // table might not exist
  }
}

// Common password hashes
// 'student123': $2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi
// 'warden123': $2a$10$fNLiQvL3hVbT7cys4SWbmuQB0ytzmjs/MctdNp02fy03iFFtGB60y
// 'admin123': $2a$10$Azhcmvh.BCQfsnJq8E/gQeJ1nAfpgqdALFj7l/3UTmhb9sOXCTuCW
const STUDENT_PW = '$2a$10$8M7RoA3gp64u30UfKaZANOHmqwgcZBNuiYDnGBxwNWZJKQTDnHQsi';
const WARDEN_PW = '$2a$10$fNLiQvL3hVbT7cys4SWbmuQB0ytzmjs/MctdNp02fy03iFFtGB60y';
const ADMIN_PW = '$2a$10$Azhcmvh.BCQfsnJq8E/gQeJ1nAfpgqdALFj7l/3UTmhb9sOXCTuCW';

// 1. Insert Admin
console.log('Inserting Admin...');
const insertUser = db.prepare(`
  INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertUser.run(
  1,
  'Chief Administrative Officer',
  'admin@hostel.com',
  ADMIN_PW,
  'admin',
  '+91 11 2766 8000',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
);

// 2. Insert 10 Wardens
console.log('Inserting 10 Wardens...');
const WARDENS_DATA = [
  {
    name: 'Dr. Rajesh Verma',
    email: 'warden@hostel.com', // Primary demo login
    empId: 'EMP-WRD-042',
    hostelId: 1,
    dept: 'Chief Warden Office - Boys Wings',
    office: 'Ground Floor Admin Wing, Block A',
    phone: '+91 98112 34567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    name: 'Dr. Sunita Mehra',
    email: 'sunita.warden@hostel.com',
    empId: 'EMP-WRD-043',
    hostelId: 2,
    dept: 'Chief Warden Office - Girls Wings',
    office: 'Ground Floor Administrative Suite, Nilgiri Hostel',
    phone: '+91 98112 34568',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    name: 'Prof. Arvind Swaminathan',
    email: 'arvind.warden@hostel.com',
    empId: 'EMP-WRD-044',
    hostelId: 1,
    dept: 'Senior Resident Warden - Aryabhata Block',
    office: 'Block A, Room 101-Office',
    phone: '+91 98112 34569',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    name: 'Dr. Meenakshi Sundaram',
    email: 'meenakshi.warden@hostel.com',
    empId: 'EMP-WRD-045',
    hostelId: 1,
    dept: 'Resident Warden - Bhaskara Block',
    office: 'Block B, 1st Floor Warden Cabin',
    phone: '+91 98112 34570',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
  },
  {
    name: 'Er. Vikramaditya Chauhan',
    email: 'vikram.warden@hostel.com',
    empId: 'EMP-WRD-046',
    hostelId: 1,
    dept: 'Night Security & Turnstile Curfew Warden',
    office: 'Main Campus Security Gate Control Room',
    phone: '+91 98112 34571',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    name: 'Dr. Shalini Mukherjee',
    email: 'shalini.warden@hostel.com',
    empId: 'EMP-WRD-047',
    hostelId: 2,
    dept: 'Resident Warden - Gargi Block',
    office: 'Gargi Wing, Ground Floor Room G-101',
    phone: '+91 98112 34572',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
  },
  {
    name: 'Prof. Harpreet Singh',
    email: 'harpreet.warden@hostel.com',
    empId: 'EMP-WRD-048',
    hostelId: 1,
    dept: 'Dining Hall & Mess Committee Welfare Warden',
    office: 'Central Mess Complex, Mezzanine Office',
    phone: '+91 98112 34573',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'
  },
  {
    name: 'Dr. Ramesh Chandra Joshi',
    email: 'ramesh.warden@hostel.com',
    empId: 'EMP-WRD-049',
    hostelId: 1,
    dept: 'Campus Health, Medical & Sanitation Warden',
    office: 'Hostel Health Center, Room HC-1',
    phone: '+91 98112 34574',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
  },
  {
    name: 'Dr. Ananya Sengupta',
    email: 'ananya.warden@hostel.com',
    empId: 'EMP-WRD-050',
    hostelId: 2,
    dept: 'Resident Warden - Maitreyi Block',
    office: 'Maitreyi Wing, Room M-101',
    phone: '+91 98112 34575',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  {
    name: 'Er. Deepak Rawat',
    email: 'deepak.warden@hostel.com',
    empId: 'EMP-WRD-051',
    hostelId: 1,
    dept: 'IT Infrastructure & Electrical Maintenance Warden',
    office: 'Campus NOC Sub-Station 2',
    phone: '+91 98112 34576',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
  }
];

const insertWarden = db.prepare(`
  INSERT INTO wardens (id, user_id, employee_id, assigned_hostel_id, department, office_location)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let userIdCounter = 2; // User 1 is admin
let wardenIdCounter = 1;

for (const w of WARDENS_DATA) {
  const currentUserId = userIdCounter++;
  insertUser.run(
    currentUserId,
    w.name,
    w.email,
    WARDEN_PW,
    'warden',
    w.phone,
    w.avatar
  );

  insertWarden.run(
    wardenIdCounter++,
    currentUserId,
    w.empId,
    w.hostelId,
    w.dept,
    w.office
  );
}

// 3. Insert Hostels & Blocks
console.log('Inserting Hostels and Blocks...');
const insertHostel = db.prepare(`INSERT INTO hostels (id, name, type, total_blocks, address, contact_phone) VALUES (?, ?, ?, ?, ?, ?)`);
insertHostel.run(1, 'Himalaya Boys Hostel', 'boys', 4, 'North Campus, Apex Institute of Technology', '+91 11 2766 8001');
insertHostel.run(2, 'Nilgiri Girls Hostel', 'girls', 3, 'South Campus, Apex Institute of Technology', '+91 11 2766 8002');

const insertBlock = db.prepare(`INSERT INTO blocks (id, hostel_id, name, floors_count) VALUES (?, ?, ?, ?)`);
insertBlock.run(1, 1, 'Block A (Aryabhata)', 3);
insertBlock.run(2, 1, 'Block B (Bhaskara)', 3);
insertBlock.run(3, 1, 'Block C (Charaka)', 3);
insertBlock.run(4, 1, 'Block D (Ramanujan)', 2);
insertBlock.run(5, 2, 'Block A (Gargi)', 3);
insertBlock.run(6, 2, 'Block B (Maitreyi)', 2);
insertBlock.run(7, 2, 'Block C (Sarojini)', 3);

// 4. Insert 65 Rooms & 150 Beds
console.log('Inserting Rooms and Beds...');
const insertRoom = db.prepare(`
  INSERT INTO rooms (id, block_id, room_number, floor, capacity, room_type, fee_per_semester, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertBed = db.prepare(`
  INSERT INTO beds (id, room_id, bed_number, status)
  VALUES (?, ?, ?, ?)
`);

let roomIdCounter = 1;
let bedIdCounter = 1;
const allBeds = []; // { id, roomId, bedNum, status }

function addRoomWithBeds(blockId, roomNum, floor, capacity, roomType, fee, defaultStatus = 'available') {
  const currentRoomId = roomIdCounter++;
  insertRoom.run(currentRoomId, blockId, roomNum, floor, capacity, roomType, fee, defaultStatus);
  
  const roomBeds = [];
  for (let b = 1; b <= capacity; b++) {
    const currentBedId = bedIdCounter++;
    insertBed.run(currentBedId, currentRoomId, `Bed-${b}`, 'vacant');
    roomBeds.push({ id: currentBedId, roomId: currentRoomId, bedNum: `Bed-${b}`, blockId, floor });
    allBeds.push({ id: currentBedId, roomId: currentRoomId, bedNum: `Bed-${b}`, blockId, floor });
  }
  return roomBeds;
}

// Dynamically Generate 900 Beds (450 Boys, 450 Girls) across 7 Blocks
const boysBlocks = [1, 2, 3, 4];
const girlsBlocks = [5, 6, 7];

// Distribute 150 rooms (3 beds each) for boys
for (let i = 1; i <= 150; i++) {
  const blockId = boysBlocks[i % boysBlocks.length];
  const floor = Math.ceil((i % 50) / 10) || 1; 
  const roomNum = `H-${blockId}-${floor}0${i % 10}`;
  const isAc = i % 3 === 0;
  addRoomWithBeds(blockId, roomNum, floor, 3, isAc ? 'AC' : 'Non-AC', isAc ? 45000 : 38000);
}

// Distribute 150 rooms (3 beds each) for girls
for (let i = 1; i <= 150; i++) {
  const blockId = girlsBlocks[i % girlsBlocks.length];
  const floor = Math.ceil((i % 50) / 10) || 1; 
  const roomNum = `N-${blockId}-${floor}0${i % 10}`;
  const isAc = i % 3 === 0;
  addRoomWithBeds(blockId, roomNum, floor, 3, isAc ? 'AC' : 'Non-AC', isAc ? 45000 : 38000);
}

// 5. Generate 800 Students
console.log('Generating 800 Realistic Students...');
const FIRST_NAMES_BOYS = [
  'Aarav', 'Rohan', 'Kabir', 'Aditya', 'Ishaan', 'Arjun', 'Dev', 'Karthik',
  'Siddharth', 'Yash', 'Rahul', 'Aman', 'Varun', 'Gaurav', 'Nikhil', 'Ayush',
  'Manan', 'Kushal', 'Harsh', 'Tanishq', 'Aniket', 'Alok', 'Mohit', 'Chirag',
  'Deepak', 'Sameer', 'Akash', 'Shivam', 'Mayank', 'Abhishek', 'Vikas', 'Sandeep',
  'Saurabh', 'Sumit', 'Naveen', 'Tarun', 'Kunal', 'Rohit', 'Nitin', 'Ashish',
  'Pankaj', 'Amit', 'Rajesh', 'Sanjay', 'Manoj', 'Rakesh', 'Vinay', 'Anuj',
  'Chetan', 'Dinesh', 'Jatin', 'Lovish', 'Manish', 'Naman', 'Parth', 'Sahil',
  'Tejas', 'Utkarsh', 'Vivek', 'Zain', 'Arman', 'Faizan', 'Hamza', 'Farhan',
  'Rehan', 'Danish', 'Zaid', 'Tariq', 'Imran', 'Salman'
];

const FIRST_NAMES_GIRLS = [
  'Priya', 'Ananya', 'Diya', 'Neha', 'Tanvi', 'Sneha', 'Pooja', 'Ritika',
  'Meera', 'Shreya', 'Divya', 'Riya', 'Simran', 'Bhavya', 'Pragya', 'Sanya',
  'Sakshi', 'Ankita', 'Garima', 'Natasha', 'Shruti', 'Prachi', 'Tanya', 'Swati',
  'Radhika', 'Preeti', 'Kavya', 'Isha', 'Muskan', 'Nandini', 'Deepika', 'Aanchal',
  'Komal', 'Khushi', 'Vidhi', 'Avani', 'Aditi', 'Roshni', 'Payal', 'Bhumika',
  'Palak', 'Mehak', 'Chhavi', 'Lavanya', 'Ishita', 'Aastha', 'Rupal', 'Vanshika'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Agarwal', 'Nair', 'Iyer',
  'Reddy', 'Rao', 'Joshi', 'Kulkarni', 'Deshmukh', 'Mehta', 'Jain', 'Shah',
  'Bhatia', 'Malhotra', 'Kapoor', 'Khanna', 'Bansal', 'Goel', 'Mittal', 'Garg',
  'Singhal', 'Jindal', 'Roy', 'Das', 'Banerjee', 'Mukherjee', 'Sen', 'Bose',
  'Dutta', 'Ghosh', 'Choudhury', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Tripathi'
];

const BRANCHES = [
  'Computer Science & Engineering',
  'Computer Science & Engineering',
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Comm. Engg',
  'Electrical & Electronics Engg',
  'Mechanical Engineering'
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];

const insertStudent = db.prepare(`
  INSERT INTO students (id, user_id, roll_number, course, branch, year, semester, blood_group, parent_name, parent_phone, emergency_contact, checkin_date, status, caretaker_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertAllocation = db.prepare(`
  INSERT INTO room_allocations (id, student_id, bed_id, allocated_from, status)
  VALUES (?, ?, ?, ?, ?)
`);
const updateBedStatus = db.prepare(`
  UPDATE beds SET status = ? WHERE id = ?
`);
const insertFee = db.prepare(`
  INSERT INTO fees (id, student_id, semester, total_amount, paid_amount, pending_amount, due_date, status, receipt_number, last_payment_date, transaction_id, payment_method)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertFeeTransaction = db.prepare(`
  INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let studentIdCounter = 1;
let allocationIdCounter = 1;
let feeIdCounter = 1;

// Target: 115 students (70 boys, 45 girls)
const TOTAL_STUDENTS = 800;

for (let sIdx = 1; sIdx <= TOTAL_STUDENTS; sIdx++) {
  const currentUserId = userIdCounter++;
  const currentStudentId = studentIdCounter++;

  let name, email, isGirl;

  if (sIdx === 1) {
    // Primary Demo Student!
    name = 'Aarav Sharma';
    email = 'student@hostel.com';
    isGirl = false;
  } else if (sIdx <= 500) {
    const fName = FIRST_NAMES_BOYS[(sIdx - 1) % FIRST_NAMES_BOYS.length];
    const lName = LAST_NAMES[(sIdx * 3) % LAST_NAMES.length];
    name = `${fName} ${lName}`;
    email = `${fName.toLowerCase()}.${lName.toLowerCase()}${sIdx}@hostel.com`;
    isGirl = false;
  } else {
    const fName = FIRST_NAMES_GIRLS[(sIdx - 501) % FIRST_NAMES_GIRLS.length];
    const lName = LAST_NAMES[(sIdx * 2) % LAST_NAMES.length];
    name = `${fName} ${lName}`;
    email = `${fName.toLowerCase()}.${lName.toLowerCase()}${sIdx}@hostel.com`;
    isGirl = true;
  }

  const phone = `+91 ${98000 + Math.floor(Math.random() * 1999)} ${10000 + Math.floor(Math.random() * 89999)}`;
  const avatar = isGirl
    ? `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150`
    : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

  insertUser.run(
    currentUserId,
    name,
    email,
    STUDENT_PW,
    'student',
    phone,
    avatar
  );

  const year = ((sIdx % 4) + 1);
  const sem = year * 2 - (sIdx % 2);
  const branch = BRANCHES[sIdx % BRANCHES.length];
  const yearCode = 25 - year; // 21, 22, 23, 24
  const branchCode = branch.includes('Data') ? 'BAIDS' : branch.includes('Information') ? 'BIT' : branch.includes('Electronics') ? 'BECE' : branch.includes('Mechanical') ? 'BME' : 'BCSE';
  const rollNumber = `${yearCode}${branchCode}${String(100 + sIdx).padStart(3, '0')}`;
  const blood = BLOOD_GROUPS[sIdx % BLOOD_GROUPS.length];
  const parentName = `Mr. Rajesh ${LAST_NAMES[(sIdx * 3) % LAST_NAMES.length]}`;
  const parentPhone = `+91 94${Math.floor(100 + Math.random() * 899)} ${Math.floor(10000 + Math.random() * 89999)}`;

  // Determine Allocated Bed first
  let assignedBedId = sIdx;
  if (sIdx === 1) {
    // Room B-204 is room 14
    assignedBedId = 27; // Bed 27 is B-204 Bed-1
  } else if (sIdx === 2) {
    assignedBedId = 28; // B-204 Bed-2
  } else if (sIdx === 27 || sIdx === 28) {
    assignedBedId = allBeds.length - sIdx; // Swap to avoid collision
  }

  const assignedBed = allBeds.find(b => b.id === assignedBedId) || allBeds[assignedBedId - 1];
  let caretakerId = 1;
  if (assignedBed) {
    const { blockId, floor } = assignedBed;
    if (blockId === 1) caretakerId = floor === 1 ? 1 : (floor <= 3 ? 15 : 4);
    else if (blockId === 2) caretakerId = floor <= 2 ? 9 : 3;
    else if (blockId === 3) caretakerId = floor <= 2 ? 5 : 11;
    else if (blockId === 4) caretakerId = floor <= 2 ? 7 : 13;
    else if (blockId === 5) caretakerId = floor <= 2 ? 2 : 10;
    else if (blockId === 6) caretakerId = floor <= 2 ? 12 : 6;
    else if (blockId === 7) caretakerId = floor <= 2 ? 14 : 8;
  } else {
    caretakerId = isGirl ? 2 : 1;
  }

  insertStudent.run(
    currentStudentId,
    currentUserId,
    rollNumber,
    'B.Tech',
    branch,
    year,
    sem,
    blood,
    parentName,
    parentPhone,
    parentPhone,
    '2024-08-01',
    'active',
    caretakerId
  );

  insertAllocation.run(
    allocationIdCounter++,
    currentStudentId,
    assignedBedId,
    '2024-08-01',
    'active'
  );
  updateBedStatus.run('occupied', assignedBedId);

  // Create Fee Record
  const totalFee = 45000.0;
  let paidAmount = 0.0;
  let feeStatus = 'Pending';
  let receiptNo = null;
  let txnId = null;
  let payDate = null;
  let payMethod = null;

  if (sIdx % 3 === 0) {
    // 100% Paid
    paidAmount = 45000.0;
    feeStatus = 'Paid';
    receiptNo = `RCPT-2026-${String(10000 + sIdx)}`;
    txnId = `TXN_APEX_${1726000000 + sIdx * 93}`;
    payDate = '2026-08-10 14:20:00';
    payMethod = sIdx % 2 === 0 ? 'UPI - Google Pay' : 'HDFC Debit Card';
  } else if (sIdx % 3 === 1) {
    // Partial Paid
    paidAmount = 30000.0;
    feeStatus = 'Partial';
    receiptNo = `RCPT-2026-${String(10000 + sIdx)}`;
    txnId = `TXN_APEX_${1726000000 + sIdx * 93}`;
    payDate = '2026-08-15 11:30:00';
    payMethod = 'NetBanking - SBI';
  } else {
    // Pending
    paidAmount = 0.0;
    feeStatus = 'Pending';
  }

  const pendingAmount = totalFee - paidAmount;
  const currentFeeId = feeIdCounter++;

  insertFee.run(
    currentFeeId,
    currentStudentId,
    sem,
    totalFee,
    paidAmount,
    pendingAmount,
    '2026-09-30',
    feeStatus,
    receiptNo,
    payDate,
    txnId,
    payMethod
  );

  if (paidAmount > 0) {
    insertFeeTransaction.run(
      currentFeeId,
      currentStudentId,
      paidAmount,
      payMethod || 'UPI',
      txnId,
      receiptNo,
      payDate || '2026-08-15 11:30:00'
    );
  }
}

// Mark some remaining beds as maintenance
updateBedStatus.run('maintenance', 140);
updateBedStatus.run('maintenance', 141);
updateBedStatus.run('maintenance', 142);

// 6. Insert 30 Complaints across students
console.log('Inserting 30 Realistic Complaints...');
const insertComplaint = db.prepare(`
  INSERT INTO complaints (id, student_id, title, description, category, location, priority, department, status, assigned_to, resolution_notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertUpdate = db.prepare(`
  INSERT INTO complaint_updates (id, complaint_id, updated_by_user_id, status, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const COMPLAINTS_DATA = [
  { studentId: 1, title: 'Ceiling fan regulator vibrating with high noise', desc: 'Ceiling fan in Room B-204 rattles excessively at speed 3+.', cat: 'Electrical', loc: 'Room B-204', pri: 'Medium', dept: 'Electrical Maintenance', status: 'In Progress', tech: 'Suresh Kumar', notes: 'Capacitor ordered.', date: '2026-09-12 10:15:00' },
  { studentId: 1, title: 'Wi-Fi 5GHz AP disconnecting intermittently', desc: 'Corridor access point drops packets during peak study hours.', cat: 'Internet', loc: 'Block B - 2nd Floor Corridor', pri: 'High', dept: 'IT & Network Operations', status: 'Assigned', tech: 'NetLink Team', notes: 'Firmware upgrade scheduled.', date: '2026-09-13 16:30:00' },
  { studentId: 1, title: 'Bathroom tap leaking in common washroom', desc: 'Tap 2 drips continuously causing slippery floor.', cat: 'Plumbing', loc: 'Block B - 2nd Floor Washroom', pri: 'Low', dept: 'Sanitary Maintenance', status: 'Resolved', tech: 'Ramesh Plumber', notes: 'Washer replaced.', date: '2026-09-08 09:00:00' },
  { studentId: 2, title: 'Study table drawer lock stuck', desc: 'Key is jammed inside lock cylinder.', cat: 'Furniture', loc: 'Room B-204', pri: 'Low', dept: 'Carpentry', status: 'Resolved', tech: 'Jagdish Carpenter', notes: 'Lock cylinder lubricated.', date: '2026-09-05 14:00:00' },
  { studentId: 4, title: 'Geyser tripping MCB breaker', desc: 'Water heater in washroom 3 trips the circuit switch after 2 minutes.', cat: 'Electrical', loc: 'Block A - 1st Floor Washroom', pri: 'High', dept: 'Electrical Maintenance', status: 'Pending', tech: null, notes: null, date: '2026-09-15 08:30:00' },
  { studentId: 5, title: 'Room door hinges creaking and misaligned', desc: 'Door doesn’t latch smoothly from outside.', cat: 'Furniture', loc: 'Room A-103', pri: 'Low', dept: 'Carpentry', status: 'In Progress', tech: 'Jagdish Carpenter', notes: 'Adjusting strike plate.', date: '2026-09-14 11:20:00' },
  { studentId: 8, title: 'High ping and packet loss on LAN ports', desc: 'Ethernet RJ45 wall jack is loose.', cat: 'Internet', loc: 'Room C-302', pri: 'Medium', dept: 'IT & Network Operations', status: 'Assigned', tech: 'Anoop IT Specialist', notes: 'Crimping new keystone jack.', date: '2026-09-14 15:45:00' },
  { studentId: 12, title: 'Washroom flush valve stuck open', desc: 'Water overflowing constantly in stall 4.', cat: 'Plumbing', loc: 'Block C - 3rd Floor Washroom', pri: 'Urgent', dept: 'Sanitary Maintenance', status: 'In Progress', tech: 'Ramesh Plumber', notes: 'Inlet shutoff valve closed. Replacement valve fitting.', date: '2026-09-15 09:10:00' },
  { studentId: 15, title: 'Exhaust fan stopped working', desc: 'Washroom exhaust fan motor is humming but blades not spinning.', cat: 'Electrical', loc: 'Block A - 2nd Floor', pri: 'Medium', dept: 'Electrical Maintenance', status: 'Assigned', tech: 'Suresh Kumar', notes: 'Motor replacement required.', date: '2026-09-13 18:00:00' },
  { studentId: 20, title: 'Window glass pane cracked by storm wind', desc: 'Cracked window in room requires urgent re-glazing before monsoon.', cat: 'Furniture', loc: 'Room B-208', pri: 'High', dept: 'Carpentry & Glazing', status: 'Pending', tech: null, notes: null, date: '2026-09-15 07:45:00' },
  { studentId: 72, title: 'Drinking water RO cooler filter leaking', desc: 'RO water dispenser on ground floor corridor is leaking clean water on the tiles.', cat: 'Plumbing', loc: 'Nilgiri Hostel - Gargi Ground Floor', pri: 'High', dept: 'Sanitary Maintenance', status: 'Assigned', tech: 'Water Care Technician', notes: 'Sediment cartridge leak checked.', date: '2026-09-14 12:15:00' },
  { studentId: 75, title: 'Tubelight flickering in study room', desc: 'LED tube light blinks continuously causing eye strain.', cat: 'Electrical', loc: 'Room G-104', pri: 'Low', dept: 'Electrical Maintenance', status: 'Resolved', tech: 'Manoj Electrician', notes: 'Starter replaced with new LED driver.', date: '2026-09-11 16:30:00' },
  { studentId: 80, title: 'Common room television HDMI port not working', desc: 'Girls hostel common hall smart TV cannot connect to laptop for seminar.', cat: 'Other', loc: 'Nilgiri Common Hall', pri: 'Low', dept: 'Facilities', status: 'Pending', tech: null, notes: null, date: '2026-09-15 10:00:00' },
  { studentId: 85, title: 'Shower mixer knob detached', desc: 'Shower handle came off in bath cubicle 2.', cat: 'Plumbing', loc: 'Maitreyi Block - 2nd Floor', pri: 'Medium', dept: 'Sanitary Maintenance', status: 'Resolved', tech: 'Ramesh Plumber', notes: 'New spindle fixed.', date: '2026-09-09 14:00:00' },
  { studentId: 90, title: 'Wi-Fi signal weak in corner rooms', desc: 'Rooms S-307 to S-309 only receive 1 bar of 2.4GHz.', cat: 'Internet', loc: 'Sarojini Block - 3rd Floor Wing', pri: 'Medium', dept: 'IT & Network Operations', status: 'In Progress', tech: 'Anoop IT Specialist', notes: 'Access point placement survey completed. Repeater added.', date: '2026-09-13 11:00:00' }
];

let complaintId = 1;
let updateId = 1;
for (const c of COMPLAINTS_DATA) {
  insertComplaint.run(
    complaintId,
    c.studentId,
    c.title,
    c.desc,
    c.cat,
    c.loc,
    c.pri,
    c.dept,
    c.status,
    c.tech,
    c.notes,
    c.date
  );

  insertUpdate.run(
    updateId++,
    complaintId,
    1,
    'Pending',
    `Lodge ticket registered by resident`,
    c.date
  );
  if (c.status !== 'Pending') {
    insertUpdate.run(
      updateId++,
      complaintId,
      2,
      c.status,
      c.notes || `Technician dispatched`,
      c.date
    );
  }
  complaintId++;
}

// 7. Insert Mess Menu (7 days)
console.log('Inserting 7-Day Revolving Mess Menu...');
const insertMenu = db.prepare(`
  INSERT INTO mess_menu (id, day_of_week, breakfast, lunch, snacks, dinner, special_item, dietary_tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertMenu.run(1, 'Monday', 'Masala Dosa, Sambar, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Rajma Masala, Steamed Basmati Rice, Jeera Aloo, Curd, Mixed Salad, Roti', 'Samosa, Mint Chutney, Ginger Tea', 'Paneer Butter Masala / Chicken Curry, Dal Tadka, Phulka Roti, Gulab Jamun', 'Gulab Jamun (2 pcs)', 'Veg / Non-Veg options');
insertMenu.run(2, 'Tuesday', 'Poha with Roasted Peanuts, Sprouted Moong Salad, Banana, Tea/Coffee', 'Kadhi Pakora, Steamed Rice, Bhindi Do Pyaza, Boondi Raita, Chapati', 'Veg Cutlet, Tomato Sauce, Lemon Tea', 'Dal Makhani, Mix Veg Sabzi, Tandoori Roti, Jeera Rice, Fruit Custard', 'Fruit Custard', 'Pure Veg');
insertMenu.run(3, 'Wednesday', 'Idli, Medu Vada, Sambar, Tomato Chutney, Tea/Coffee', 'Chole Bhature / Steamed Rice, Yellow Dal, Sirka Onion Salad, Fresh Buttermilk', 'Onion Pakoda, Masala Chai', 'Matar Mushroom / Egg Curry, Dal Fry, Roti, Pulao, Rasgulla', 'Rasgulla', 'Veg / Non-Veg options');
insertMenu.run(4, 'Thursday', 'Aloo Paratha with White Butter, Pickle, Curd, Tea/Coffee', 'Kashmiri Dum Aloo, Dal Palak, Steamed Rice, Roti, Cucumber Raita', 'Sweet Corn Chaat, Filter Coffee', 'Shahi Paneer, Dal Tadka, Missi Roti, Steamed Rice, Moong Dal Halwa', 'Moong Dal Halwa', 'Pure Veg');
insertMenu.run(5, 'Friday', 'Upma with Vegetables, Sev, Coconut Chutney, Boiled Eggs, Tea/Coffee', 'Amritsari Dal, Seasonal Subzi, Steamed Rice, Roti, Fresh Curd, Papad', 'Bread Pakoda with Green Chutney, Masala Chai', 'Veg Biryani / Hyderabadi Chicken Biryani, Mirchi Ka Salan, Raita, Ice Cream', 'Special Biryani & Ice Cream', 'High-Protein Feast');
insertMenu.run(6, 'Saturday', 'Methi Thepla, Chhundo, Boiled Sprouts, Banana, Tea/Coffee', 'Pav Bhaji with Butter Pav, Jeera Pulao, Curd, Lemon Salad', 'Biscuits & Roasted Chana, Green Tea / Chai', 'Malai Kofta, Dal Kolhapuri, Garlic Naan / Chapati, Steamed Rice, Sewaiyan Kheer', 'Sewaiyan Kheer', 'Deluxe Feast');
insertMenu.run(7, 'Sunday', 'Chole Puri with Halwa, Fresh Fruit Juice, Tea/Coffee', 'Special Sunday Thali: Paneer Lababdar / Mutton Curry, Dal Maharani, Rice, Roti, Papad', 'Cold Coffee, Veg Sandwich', 'Light Khichdi / Pulao, Aloo Gobi, Roti, Kadhi, Sweet Lassi', 'Sunday Special Thali & Lassi', 'Chef Special');

// 8. Insert 40 Mess Feedbacks
console.log('Inserting 40 Mess Feedbacks...');
const insertFeedback = db.prepare(`
  INSERT INTO mess_feedback (id, student_id, meal_type, rating, taste_rating, quality_rating, cleanliness_rating, comments)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const FEEDBACK_COMMENTS = [
  'Friday Biryani was authentic and aroma was excellent!',
  'Paneer gravy quality was rich and not too oily.',
  'Sambar could be a bit spicier, but dosas were crispy.',
  'Chole Bhature on Wednesday was top notch.',
  'Fresh seasonal fruits in breakfast was a very good addition.',
  'Chapati softness was consistent throughout dinner rush.',
  'Cleanliness in the dining hall wash area was very good today.',
  'Cold coffee on Sunday evening was great for summer heat.'
];

let feedbackId = 1;
for (let i = 1; i <= 40; i++) {
  const sId = (i % TOTAL_STUDENTS) + 1;
  const rating = 4 + (i % 2); // 4 or 5
  insertFeedback.run(
    feedbackId++,
    sId,
    i % 4 === 0 ? 'Breakfast' : i % 4 === 1 ? 'Lunch' : i % 4 === 2 ? 'Snacks' : 'Dinner',
    rating,
    rating,
    4,
    5,
    FEEDBACK_COMMENTS[i % FEEDBACK_COMMENTS.length]
  );
}

// 9. Insert 25 Gate Passes
console.log('Inserting 25 Gate Passes...');
const insertGatePass = db.prepare(`
  INSERT INTO gate_passes (id, student_id, pass_type, destination, reason, departure_time, expected_return, status, qr_token, approved_by_user_id, warden_remarks, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const GATE_PASSES_SAMPLE = [
  { studentId: 1, type: 'Night Out', dest: 'Family Residence, Vasant Kunj, New Delhi', reason: 'Sister wedding ceremony', dep: '2026-09-19 16:00:00', ret: '2026-09-21 20:00:00', status: 'Approved', token: 'GP-2026-78491-AARAV', warden: 2, remarks: 'Parent phone call confirmed.' },
  { studentId: 1, type: 'Day Outing', dest: 'Central Library / Nehru Place Market', reason: 'Buying project hardware components for viva', dep: '2026-09-16 11:00:00', ret: '2026-09-16 19:30:00', status: 'Pending', token: 'GP-2026-78492-AARAV', warden: null, remarks: null },
  { studentId: 2, type: 'Day Outing', dest: 'Connaught Place', reason: 'GATE coaching test series', dep: '2026-09-17 08:30:00', ret: '2026-09-17 14:00:00', status: 'Approved', token: 'GP-2026-78493-ROHAN', warden: 2, remarks: 'Permitted till 2:00 PM.' },
  { studentId: 5, type: 'Weekend Leave', dest: 'Jaipur Home Residence', reason: 'Family festive gathering', dep: '2026-09-18 17:00:00', ret: '2026-09-20 21:00:00', status: 'Approved', token: 'GP-2026-78494-ISHAN', warden: 3, remarks: 'Train ticket verified.' },
  { studentId: 8, type: 'Night Out', dest: 'Gurugram Tech Park', reason: '24-hour inter-college hackathon event', dep: '2026-09-18 15:00:00', ret: '2026-09-19 21:00:00', status: 'Approved', token: 'GP-2026-78495-DEV', warden: 2, remarks: 'Faculty mentor letter received.' },
  { studentId: 12, type: 'Day Outing', dest: 'Apollo Clinic Saket', reason: 'Orthopedic consultation checkup', dep: '2026-09-16 13:00:00', ret: '2026-09-16 18:00:00', status: 'Approved', token: 'GP-2026-78496-AMAN', warden: 4, remarks: 'Medical appointment slip verified.' },
  { studentId: 16, type: 'Day Outing', dest: 'Pacific Mall Subhash Nagar', reason: 'Laptop screen replacement', dep: '2026-09-16 15:00:00', ret: '2026-09-16 20:30:00', status: 'Pending', token: 'GP-2026-78497-NIKHIL', warden: null, remarks: null },
  { studentId: 20, type: 'Emergency Leave', dest: 'Chandigarh Home', reason: 'Urgent family emergency', dep: '2026-09-15 14:00:00', ret: '2026-09-18 20:00:00', status: 'Approved', token: 'GP-2026-78498-HARSH', warden: 2, remarks: 'Parent authorized over call.' },
  { studentId: 72, type: 'Day Outing', dest: 'National Museum Library', reason: 'Architecture archival survey', dep: '2026-09-16 10:00:00', ret: '2026-09-16 17:00:00', status: 'Approved', token: 'GP-2026-78499-PRIYA', warden: 7, remarks: 'Girls warden authorized.' },
  { studentId: 75, type: 'Weekend Leave', dest: 'Dehradun Residence', reason: 'Visiting parents over weekend', dep: '2026-09-18 16:30:00', ret: '2026-09-20 20:00:00', status: 'Pending', token: 'GP-2026-78500-DIYA', warden: null, remarks: null },
  { studentId: 80, type: 'Day Outing', dest: 'DLF CyberHub', reason: 'On-campus placement mock interview', dep: '2026-09-16 14:00:00', ret: '2026-09-16 19:30:00', status: 'Approved', token: 'GP-2026-78501-SNEHA', warden: 7, remarks: 'Formal attire outing permitted.' }
];

let gatePassId = 1;
for (const gp of GATE_PASSES_SAMPLE) {
  insertGatePass.run(
    gatePassId++,
    gp.studentId,
    gp.type,
    gp.dest,
    gp.reason,
    gp.dep,
    gp.ret,
    gp.status,
    gp.token,
    gp.warden,
    gp.remarks,
    '2026-09-14 10:00:00'
  );
}

// 10. Insert 8 University Notices
console.log('Inserting 8 Institutional Notices...');
const insertNotice = db.prepare(`
  INSERT INTO notices (id, title, description, category, priority, published_by_user_id, target_audience, date, expires_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertNotice.run(1, 'Hostel Room Safety & Electrical Equipment Inspection', 'Annual mandatory room safety audit will be conducted by Chief Warden Dr. Rajesh Verma and technical team on 18th Sept between 10:00 AM - 02:00 PM. High-wattage heating appliances are strictly prohibited.', 'Inspection', 'Urgent', 2, 'all', '2026-09-14', '2026-09-20');
insertNotice.run(2, 'Core Switch Network Maintenance - Block B & C', 'Campus Network Operations Centre will upgrade fiber backbone switches in Block B & C on Saturday midnight (1:00 AM - 4:00 AM). Internet will be briefly intermittent.', 'Maintenance', 'Normal', 11, 'students', '2026-09-13', '2026-09-19');
insertNotice.run(3, 'Night Gate Curfew & Biometric Attendance Protocol', 'All hostel residents are reminded that main campus turnstile gates close at 09:30 PM sharp. Night roll-call check-in is mandatory between 09:30 PM - 10:15 PM.', 'Discipline', 'High', 6, 'students', '2026-09-10', '2026-10-31');
insertNotice.run(4, 'Annual Inter-Hostel Sports & Cultural Meet 2026', 'Registrations are open for Badminton, Table Tennis, Chess, and E-Sports representing Himalaya and Nilgiri Hostels. Contact sports secretary before 22nd Sept.', 'Event', 'Normal', 2, 'all', '2026-09-12', '2026-09-22');
insertNotice.run(5, 'Mess Committee Monthly Quality Review Meeting', 'Student representatives from each wing are invited to the mess committee audit meeting on 20th Sept at 5:00 PM with Catering Warden Prof. Harpreet Singh.', 'Mess', 'Normal', 8, 'all', '2026-09-15', '2026-09-21');
insertNotice.run(6, 'Free Medical & Eye Checkup Camp in Health Centre', 'Dr. Ramesh Chandra Joshi announces free general health, dental, and optometry consultations for all hostellers on 21st Sept (9 AM - 4 PM).', 'Health', 'Normal', 9, 'all', '2026-09-15', '2026-09-22');
insertNotice.run(7, 'Semester End Examination Hall Quiet Hours Notification', 'Starting from next week, strict 24-hour quiet study policy is in effect across all residential wings. Common room music systems will remain locked.', 'Academic', 'High', 3, 'students', '2026-09-15', '2026-10-15');
insertNotice.run(8, 'Nilgiri Girls Hostel Security & CCTV Upgrade Completed', 'Dr. Sunita Mehra confirms 16 new high-definition IP cameras installed covering peripheral lawns and dining corridors for enhanced resident safety.', 'Security', 'Normal', 3, 'all', '2026-09-14', '2026-09-30');

// 11. Insert Attendance for resident Aarav Sharma (student 1)
console.log('Inserting Attendance records...');
const insertAttendance = db.prepare(`INSERT INTO attendance (student_id, date, status, remarks) VALUES (?, ?, ?, ?)`);
const attendanceDates = [
  ['2026-09-05', 'Present', 'Biometric Check-in 21:42'],
  ['2026-09-06', 'Present', 'Biometric Check-in 21:55'],
  ['2026-09-07', 'Present', 'Biometric Check-in 21:38'],
  ['2026-09-08', 'Present', 'Biometric Check-in 22:01'],
  ['2026-09-09', 'Present', 'Biometric Check-in 21:45'],
  ['2026-09-10', 'Present', 'Biometric Check-in 21:50'],
  ['2026-09-11', 'Present', 'Biometric Check-in 21:40'],
  ['2026-09-12', 'Present', 'Biometric Check-in 21:35'],
  ['2026-09-13', 'Present', 'Biometric Check-in 21:50'],
  ['2026-09-14', 'Present', 'Biometric Check-in 21:44'],
  ['2026-09-15', 'Present', 'Biometric Check-in 21:30']
];
for (const [dt, st, rem] of attendanceDates) {
  insertAttendance.run(1, dt, st, rem);
  insertAttendance.run(2, dt, st, rem);
  insertAttendance.run(3, dt, st, rem);
}

db.pragma('foreign_keys = ON');

console.log('✅ DATABASE FULLY SEEDED WITH 800 STUDENTS, 10 WARDENS, 900 BEDS, 300 ROOMS, AND 100+ TRANSACTIONS!');
