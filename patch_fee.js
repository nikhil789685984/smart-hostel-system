const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/feeController.js', 'utf8');

// Replace getMyFees to generate multiple semesters if they don't exist
const newGetMyFees = `export async function getMyFees(req, res) {
  try {
    const student = await get('SELECT id, user_id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    let fees = await all('SELECT * FROM fees WHERE student_id = ? ORDER BY semester ASC', [student.id]);

    // If no fee record exists, generate all 8 semesters fees
    if (!fees || fees.length === 0) {
      for(let i=1; i<=8; i++) {
        await run(\`
          INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status, late_fine, days_overdue)
          VALUES (?, ?, 45000.0, 0.0, 45000.0, date('now', '+15 days'), 'Pending', 0.0, 0)
        \`, [student.id, i]);
      }
      fees = await all('SELECT * FROM fees WHERE student_id = ? ORDER BY semester ASC', [student.id]);
    }

    // Check if fee is overdue & calculate late fine for all semesters
    const today = new Date().toISOString().split('T')[0];
    for (let fee of fees) {
      const dueDate = fee.due_date;
      let lateFine = fee.late_fine || 0;
      let daysOverdue = fee.days_overdue || 0;

      if (dueDate < today && (fee.total_amount - fee.paid_amount) > 0 && fee.status !== 'Paid') {
        const diffTime = Math.abs(new Date(today) - new Date(dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > daysOverdue) {
          const additionalDays = diffDays - daysOverdue;
          lateFine += additionalDays * 50; 
          daysOverdue = diffDays;
          await run('UPDATE fees SET late_fine = ?, days_overdue = ? WHERE id = ?', [lateFine, daysOverdue, fee.id]);
          fee.late_fine = lateFine;
          fee.days_overdue = daysOverdue;
        }
      }
    }

    const transactions = await all('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const fines = await all('SELECT * FROM fines WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    
    // For backward compatibility frontend still reads feeData.fee, send current sem as fee, and all as fees
    const latestFee = fees[fees.length - 1];

    res.json({
      success: true,
      fees,
      fee: latestFee,
      transactions,
      fines
    });
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ success: false, message: 'Server error fetching fees.' });
  }
}`;

code = code.replace(/export async function getMyFees.*?catch \(err\) \{.*?res\.status\(500\)\.json\(\{ success: false, message: 'Server error fetching fees\.' \}\);\n  \}\n\}/s, newGetMyFees);

fs.writeFileSync('backend/src/controllers/feeController.js', code);
