import { get, all, run } from '../database/db.js';

export async function getStaffAccount(req, res) {
  try {
    const staffId = req.user.id;
    let account = await get('SELECT * FROM staff_accounts WHERE staff_id = ?', [staffId]);
    
    if (!account) {
      await run('INSERT INTO staff_accounts (staff_id, current_balance, base_salary) VALUES (?, ?, ?)', [staffId, 0, 45000]);
      account = await get('SELECT * FROM staff_accounts WHERE staff_id = ?', [staffId]);
    }
    
    const transactions = await all('SELECT * FROM staff_transactions WHERE staff_id = ? ORDER BY transaction_date DESC', [staffId]);
    
    res.json({ success: true, account, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function processSalary(req, res) {
  // admin only route to process salary for a warden
  try {
    const { staff_id, amount, description } = req.body;
    let account = await get('SELECT * FROM staff_accounts WHERE staff_id = ?', [staff_id]);
    if (!account) {
       await run('INSERT INTO staff_accounts (staff_id, current_balance, base_salary) VALUES (?, ?, ?)', [staff_id, 0, 45000]);
    }
    
    await run('UPDATE staff_accounts SET current_balance = current_balance + ?, last_credited_at = CURRENT_TIMESTAMP WHERE staff_id = ?', [amount, staff_id]);
    await run('INSERT INTO staff_transactions (staff_id, amount, type, description) VALUES (?, ?, ?, ?)', [staff_id, amount, 'CREDIT_SALARY', description || 'Monthly Salary Credit']);
    
    res.json({ success: true, message: 'Salary credited successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function processGlobalSalaryRun(req, res) {
  try {
    const wardens = await all('SELECT user_id FROM wardens');
    for (const warden of wardens) {
      let account = await get('SELECT * FROM staff_accounts WHERE staff_id = ?', [warden.user_id]);
      if (!account) {
         await run('INSERT INTO staff_accounts (staff_id, current_balance, base_salary) VALUES (?, ?, ?)', [warden.user_id, 0, 45000]);
         account = await get('SELECT * FROM staff_accounts WHERE staff_id = ?', [warden.user_id]);
      }
      const salary = account.base_salary;
      await run('UPDATE staff_accounts SET current_balance = current_balance + ?, last_credited_at = CURRENT_TIMESTAMP WHERE staff_id = ?', [salary, warden.user_id]);
      await run('INSERT INTO staff_transactions (staff_id, amount, type, description) VALUES (?, ?, ?, ?)', [warden.user_id, salary, 'CREDIT_SALARY', 'Monthly Salary Credit - Auto Processed']);
    }
    res.json({ success: true, message: 'Salary run completed for all wardens' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
