const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

const target = `    // Notify the student!
    const complaint = await get('SELECT student_id, title FROM complaints WHERE id = ?', [id]);
    if (complaint) {
      const student = await get('SELECT user_id FROM students WHERE id = ?', [complaint.student_id]);
      if (student) {
        const { createNotification } = await import('./notificationController.js');
        await createNotification(student.user_id, 'Message from Admin', \`Admin replied to your ticket "\${complaint.title}": \${update_text}\`, 'message', '/student/complaints');
      }
    }`;

const replacement = `    // Notify the other party
    const complaint = await get('SELECT student_id, title FROM complaints WHERE id = ?', [id]);
    if (complaint) {
      const student = await get('SELECT user_id, id FROM students WHERE id = ?', [complaint.student_id]);
      
      const { createNotification, createBroadcastNotification } = await import('./notificationController.js');
      
      if (req.user.role === 'admin' || req.user.role === 'warden') {
        // Admin replied, notify student
        if (student) {
          await createNotification(student.user_id, 'Message from Admin/Warden', \`Reply on ticket "\${complaint.title}": \${update_text}\`, 'message', \`/student/complaints/\${id}\`);
        }
      } else if (req.user.role === 'student' && student && student.user_id === req.user.id) {
        // Student replied, notify admins and wardens
        await createBroadcastNotification(['admin', 'warden'], 'Student Replied to Ticket', \`Student replied to ticket "\${complaint.title}": \${update_text}\`, 'message', \`/admin/complaints/\${id}\`);
      }
    }`;

code = code.replace(target, replacement);

fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Fixed backend notifications for chat');
