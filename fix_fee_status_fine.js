const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/feeController.js', 'utf8');

code = code.replace(
  "newPending === 0 ? 'Paid' : 'Pending'",
  "newPending === 0 ? 'Paid' : 'Partial'"
);

fs.writeFileSync('backend/src/controllers/feeController.js', code);
console.log('Fixed fine payment status logic');
