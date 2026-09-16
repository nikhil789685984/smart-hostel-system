const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const oldWarden = `    await run(
      'INSERT INTO warden_complaints (student_id, warden_user_id, subject, description) VALUES (?, ?, ?, ?)',
      [student.id, warden_user_id, subject, description]
    );`;

const newWarden = `    const warden = await get('SELECT name FROM users WHERE id = ?', [warden_user_id]);
    const wName = warden ? warden.name : 'Unknown';
    await run(
      'INSERT INTO complaints (student_id, title, description, category, location, priority, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, \`Warden Escalation: \${wName} - \${subject}\`, description, 'Warden Escalation', 'Hostel', 'High', 'Admin Only', 'Pending']
    );`;
code = code.replace(oldWarden, newWarden);

const oldMess = `    await run(
      'INSERT INTO mess_complaints (student_id, issue_type, description) VALUES (?, ?, ?)',
      [student.id, issue_type, description]
    );`;

const newMess = `    await run(
      'INSERT INTO complaints (student_id, title, description, category, location, priority, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, \`Mess Issue: \${issue_type}\`, description, 'Mess Escalation', 'Mess', 'High', 'Mess', 'Pending']
    );`;
code = code.replace(oldMess, newMess);

fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Fixed Warden & Mess complaints insertion');
