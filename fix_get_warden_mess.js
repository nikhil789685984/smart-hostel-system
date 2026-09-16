const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/adminController.js', 'utf8');

const oldGetWarden = `      SELECT wc.*, u.name as warden_name, su.name as student_name, s.roll_number 
      FROM warden_complaints wc
      JOIN users u ON wc.warden_user_id = u.id
      JOIN students s ON wc.student_id = s.id
      JOIN users su ON s.user_id = su.id
      ORDER BY wc.created_at DESC`;

const newGetWarden = `      SELECT c.*, c.title as subject, su.name as student_name, s.roll_number 
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE c.category = 'Warden Escalation'
      ORDER BY c.created_at DESC`;
code = code.replace(oldGetWarden, newGetWarden);

const oldGetMess = `      SELECT mc.*, su.name as student_name, s.roll_number 
      FROM mess_complaints mc
      JOIN students s ON mc.student_id = s.id
      JOIN users su ON s.user_id = su.id
      ORDER BY mc.created_at DESC`;

const newGetMess = `      SELECT c.*, c.title as issue_type, su.name as student_name, s.roll_number 
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      JOIN users su ON s.user_id = su.id
      WHERE c.category = 'Mess Escalation'
      ORDER BY c.created_at DESC`;
code = code.replace(oldGetMess, newGetMess);

fs.writeFileSync('backend/src/controllers/adminController.js', code);
console.log('Fixed admin controller GETs');

let compCode = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const oldMyWarden = `    const complaints = await all(\`
      SELECT wc.*, u.name as warden_name 
      FROM warden_complaints wc
      JOIN users u ON wc.warden_user_id = u.id
      WHERE wc.student_id = ?
      ORDER BY wc.created_at DESC
    \`, [student.id]);`;

const newMyWarden = `    const complaints = await all(\`
      SELECT c.*, c.title as subject 
      FROM complaints c
      WHERE c.student_id = ? AND c.category = 'Warden Escalation'
      ORDER BY c.created_at DESC
    \`, [student.id]);`;
compCode = compCode.replace(oldMyWarden, newMyWarden);

const oldMyMess = `    const complaints = await all(\`
      SELECT * FROM mess_complaints
      WHERE student_id = ?
      ORDER BY created_at DESC
    \`, [student.id]);`;

const newMyMess = `    const complaints = await all(\`
      SELECT c.*, c.title as issue_type 
      FROM complaints c
      WHERE c.student_id = ? AND c.category = 'Mess Escalation'
      ORDER BY c.created_at DESC
    \`, [student.id]);`;
compCode = compCode.replace(oldMyMess, newMyMess);

fs.writeFileSync('backend/src/controllers/complaintController.js', compCode);
console.log('Fixed complaint controller GETs');
