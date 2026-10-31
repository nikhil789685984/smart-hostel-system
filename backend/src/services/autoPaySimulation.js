import { get, all, run } from '../database/db.js';
import { createNotification } from '../controllers/notificationController.js';

let isRunning = false;

// Auto-pay engine that runs every 10 seconds
export function startAutoPaySimulation() {
  if (isRunning) return;
  isRunning = true;
  
  console.log('🤖 Auto-Pay Revenue Simulation Engine Started... (Will auto-settle random fines/fees)');

  setInterval(async () => {
    try {
      // 1. Process 1 Random Unpaid Fine (Excluding Late Fees, which are handled via fees payment)
      const unpaidFines = await all(`SELECT * FROM fines WHERE status = 'Unpaid' AND type != 'Late Fee' LIMIT 20`);
      if (unpaidFines.length > 0) {
        // Pick a random fine
        const fineToPay = unpaidFines[Math.floor(Math.random() * unpaidFines.length)];
        const txnId = 'SIM-FN-' + Date.now();
        
        await run(`
          UPDATE fines 
          SET status = 'Paid', transaction_id = ?, paid_date = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [txnId, fineToPay.id]);
        
        // Find the user to notify them
        const studentRow = await get(`SELECT user_id FROM students WHERE id = ?`, [fineToPay.student_id]);
        if (studentRow) {
          try {
            await createNotification(
              studentRow.user_id,
              '💰 Auto-Payment Successful',
              `Your fine of ₹${fineToPay.amount} for "${fineToPay.type}" has been successfully auto-paid from your linked wallet.`,
              'payment'
            );
          } catch(e) {}
        }
        console.log(`[Simulation] Auto-paid fine ID ${fineToPay.id} (₹${fineToPay.amount})`);
      }



    } catch (err) {
      console.error('[Simulation Error]', err.message);
    }
  }, 10000); // Runs every 10 seconds
}
