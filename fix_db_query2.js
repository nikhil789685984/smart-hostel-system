const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/complaintController.js', 'utf8');

code = code.replace(
  "SELECT cu.*, u.name as updater_name, u.role as updater_role",
  "SELECT cu.*, cu.notes as update_text, u.name as updater_name, u.role as updater_role"
);

fs.writeFileSync('backend/src/controllers/complaintController.js', code);
console.log('Fixed DB query second occurrence');
