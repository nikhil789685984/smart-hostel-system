const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/feeController.js', 'utf8');

// Update to 100
code = code.replace(
  'lateFine = Math.min(2500, daysOverdue * 50); // ₹50 per day overdue (capped at ₹2500)',
  'lateFine = daysOverdue * 100; // ₹100 per day overdue (requested by user)'
);

code = code.replace(
  '⚠️ Overdue Late Fee Penalty (${fee.days_overdue} Days Overdue @ ₹50/day)',
  '⚠️ Overdue Late Fee Penalty (${fee.days_overdue} Days Overdue @ ₹100/day)'
);

fs.writeFileSync('backend/src/controllers/feeController.js', code);
console.log('Fixed fine amount to 100');
