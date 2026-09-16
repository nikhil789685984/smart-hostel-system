const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

// Replace the invalid query
code = code.replace(
  "await run('INSERT INTO complaint_updates (complaint_id, updated_by_user_id, update_text) VALUES (?, ?, ?)', [id, req.user.id, update_text]);",
  "const complaintForStatus = await get('SELECT status FROM complaints WHERE id = ?', [id]);\n    const currentStatus = complaintForStatus ? complaintForStatus.status : 'Pending';\n    await run('INSERT INTO complaint_updates (complaint_id, updated_by_user_id, status, notes) VALUES (?, ?, ?, ?)', [id, req.user.id, currentStatus, update_text]);"
);

// We also need to fix the SELECT query reading 'update_text'
// The frontend expects 'update_text' on the object
code = code.replace(
  "SELECT cu.*, u.name as updater_name, u.role as updater_role",
  "SELECT cu.*, cu.notes as update_text, u.name as updater_name, u.role as updater_role"
);

fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Fixed DB query');
