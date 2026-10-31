import { get, all, run } from '../database/db.js';
import { createNotification, createBroadcastNotification } from './notificationController.js';

/**
 * Get the current student's fee details, breakdown, transactions and fines
 * Automatically calculates overdue days and late fines
 */
export async function getMyFees(req, res) {
  try {
    const student = await get('SELECT id, user_id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    let fee = await get('SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);

    // If no fee record exists, create default semester fee
    if (!fee) {
      await run(`
        INSERT INTO fees (student_id, semester, total_amount, paid_amount, pending_amount, due_date, status, late_fine, days_overdue)
        VALUES (?, 6, 45000.0, 0.0, 45000.0, date('now', '+15 days'), 'Pending', 0.0, 0)
      `, [student.id]);
      fee = await get('SELECT * FROM fees WHERE student_id = ?', [student.id]);
    }

    // Check if fee is overdue & calculate late fine strictly at ₹100/day
    const today = new Date().toISOString().split('T')[0];
    const dueDate = fee.due_date;
    const basePending = Math.max(0, (fee.total_amount || 45000) - (fee.paid_amount || 0));

    if (dueDate && dueDate < today && basePending > 0) {
      const diffMs = new Date(today).getTime() - new Date(dueDate).getTime();
      const calculatedDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const calculatedFine = calculatedDays * 100; // Strictly ₹100 per overdue day

      if (fee.late_fine !== calculatedFine || fee.days_overdue !== calculatedDays) {
        const newTotalPending = basePending + calculatedFine;
        await run(`
          UPDATE fees 
          SET late_fine = ?, days_overdue = ?, pending_amount = ?, status = 'Overdue'
          WHERE id = ?
        `, [calculatedFine, calculatedDays, newTotalPending, fee.id]);

        fee.late_fine = calculatedFine;
        fee.days_overdue = calculatedDays;
        fee.pending_amount = newTotalPending;
        fee.status = 'Overdue';
      }
    } else if (fee.paid_amount >= fee.total_amount && fee.late_fine > 0) {
      await run(`UPDATE fees SET late_fine = 0, days_overdue = 0 WHERE id = ?`, [fee.id]);
      fee.late_fine = 0;
      fee.days_overdue = 0;
    }

    // Itemized invoice breakdown
    const breakdown = [
      { item: 'Hostel Accommodation (Room Rent - AC/2-Sharing)', amount: 28000.0 },
      { item: 'Mess & Food Services (Full Semester)', amount: 14000.0 },
      { item: 'High-Speed Campus Wi-Fi & Electricity Surcharge', amount: 2000.0 },
      { item: 'Hostel Resident Welfare & Gymnasium Fund', amount: 1000.0 },
    ];

    if (fee.late_fine > 0) {
      breakdown.push({
        item: `⚠️ Overdue Late Fee Penalty (${fee.days_overdue} Days Overdue @ ₹100/day)`,
        amount: fee.late_fine,
        isFine: true
      });
    }

    let transactions = [];
    try {
      transactions = await all('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    } catch (e) {
      transactions = [];
    }

    // Get all fines for this student (Late fee, Curfew, Damage, etc.)
    const studentFines = await all('SELECT * FROM fines WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

    res.json({
      success: true,
      fee,
      breakdown,
      transactions: transactions || [],
      fines: studentFines || [],
      studentName: req.user.name,
      studentEmail: req.user.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Process a mock fee payment (UPI, Card, NetBanking)
 * Automatically settles late fine and marks corresponding fines as Paid
 */
export async function mockPayFee(req, res) {
  try {
    const { amount, payment_method } = req.body;
    const payAmount = parseFloat(amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const student = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const fee = await get('SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    let remainingPay = payAmount;
    let finePaid = 0;

    // First settle any late fines
    if (fee.late_fine > 0) {
      finePaid = Math.min(fee.late_fine, remainingPay);
      remainingPay -= finePaid;
      const updatedLateFine = fee.late_fine - finePaid;
      await run('UPDATE fees SET late_fine = ? WHERE id = ?', [updatedLateFine, fee.id]);
      
      if (updatedLateFine === 0) {
        await run(`
          UPDATE fines 
          SET status = 'Paid', paid_date = CURRENT_TIMESTAMP, transaction_id = ? 
          WHERE fee_id = ? AND status = 'Unpaid'
        `, [`TXN_FINE_${Date.now()}`, fee.id]);
      }
    }

    const newPaid = Math.min(fee.total_amount, fee.paid_amount + remainingPay);
    const newBasePending = Math.max(0, fee.total_amount - newPaid);
    const updatedLateFine = fee.late_fine > 0 ? (fee.late_fine - finePaid) : 0;
    const newTotalPending = newBasePending + updatedLateFine;
    const newStatus = newTotalPending === 0 ? 'Paid' : 'Partial';

    const txnId = `TXN_APEX_${Date.now()}`;
    const receiptNo = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    await run(`
      UPDATE fees
      SET paid_amount = ?, pending_amount = ?, status = ?,
          receipt_number = ?, last_payment_date = CURRENT_TIMESTAMP,
          transaction_id = ?, payment_method = ?
      WHERE id = ?
    `, [newPaid, newTotalPending, newStatus, receiptNo, txnId, payment_method || 'UPI / NetBanking', fee.id]);

    try {
      await run(`
        INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [fee.id, student.id, payAmount, payment_method || 'UPI', txnId, receiptNo]);
    } catch (err) {
      console.warn('Could not insert fee_transaction record:', err.message);
    }

    // Send real-time notification to the student!
    await createNotification(
      req.user.id,
      'Payment Settled & Receipt Issued',
      `Payment of ₹${payAmount.toLocaleString()} credited successfully. Receipt: ${receiptNo}.${finePaid > 0 ? ' All overdue fines cleared.' : ''}`,
      'fee',
      '/student/fees'
    );

    const updatedFee = await get('SELECT * FROM fees WHERE id = ?', [fee.id]);
    let transactions = [];
    try {
      transactions = await all('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    } catch (e) {
      transactions = [];
    }

    res.json({
      success: true,
      message: 'Payment verified and credited successfully!',
      fee: updatedFee,
      transactions,
      transaction: {
        receiptNumber: receiptNo,
        transactionId: txnId,
        amountPaid: payAmount,
        fineCleared: finePaid,
        remainingBalance: newTotalPending,
        paymentDate: new Date().toISOString(),
        paymentMethod: payment_method || 'UPI',
        status: newStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get all fees across students for Admin/Warden oversight
 */
export async function getAllFees(req, res) {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT f.*, 
             u.name as student_name, u.phone as student_phone, u.email as student_email,
             s.roll_number, s.branch, s.year,
             r.room_number, blk.name as block_name
      FROM fees f
      JOIN students s ON s.id = f.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR s.roll_number LIKE ? OR f.receipt_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY CASE WHEN f.status = 'Overdue' THEN 1 WHEN f.status = 'Pending' THEN 2 ELSE 3 END, f.due_date ASC";

    const fees = await all(sql, params);

    const feeCollected = Number(((await get('SELECT COALESCE(SUM(paid_amount), 0) as total FROM fees'))?.total || 0).toFixed(2));
    const finesCollected = Number(((await get("SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE status = 'Paid'"))?.total || 0).toFixed(2));
    const totalCollected = Number((feeCollected + finesCollected).toFixed(2));
    const totalPending = Number(((await get('SELECT COALESCE(SUM(pending_amount), 0) as total FROM fees'))?.total || 0).toFixed(2));
    const totalLateFines = Number(((await get('SELECT COALESCE(SUM(late_fine), 0) as total FROM fees'))?.total || 0).toFixed(2));
    const overdueCount = (await get("SELECT COUNT(*) as count FROM fees WHERE status = 'Overdue' OR late_fine > 0"))?.count || 0;

    res.json({
      success: true,
      summary: {
        totalCollected,
        feeCollected,
        finesCollected,
        totalPending,
        totalBilled: totalCollected + totalPending,
        totalLateFines,
        overdueCount
      },
      fees
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Campus-wide Late Fine Assessment Engine (Admin / Warden)
 * Scans all student fees past due date and levies late penalties
 */
export async function assessAllLateFines(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all overdue fees
    const overdueList = await all(`
      SELECT f.*, s.user_id, u.name as student_name
      FROM fees f
      JOIN students s ON s.id = f.student_id
      JOIN users u ON u.id = s.user_id
      WHERE f.due_date < ? AND (f.total_amount - f.paid_amount) > 0 AND f.status != 'Paid'
    `, [today]);

    let assessedCount = 0;
    let totalFinesAssessed = 0;

    for (const f of overdueList) {
      const diffMs = new Date(today).getTime() - new Date(f.due_date).getTime();
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const lateFine = daysOverdue * 100; // ₹100/day (updated to Rs. 100/day)

      const newPending = (f.total_amount - f.paid_amount) + lateFine;
      await run(`
        UPDATE fees 
        SET late_fine = ?, days_overdue = ?, pending_amount = ?, status = 'Overdue'
        WHERE id = ?
      `, [lateFine, daysOverdue, newPending, f.id]);

      // Record in fines table
      const existingFine = await get("SELECT id FROM fines WHERE fee_id = ? AND status = 'Unpaid'", [f.id]);
      if (!existingFine) {
        await run(`
          INSERT INTO fines (student_id, fee_id, type, amount, reason, status, days_overdue, issued_by_user_id, issued_date)
          VALUES (?, ?, 'Late Fee', ?, ?, 'Unpaid', ?, ?, date('now'))
        `, [f.student_id, f.id, lateFine, `${daysOverdue} days overdue past ${f.due_date} for Semester ${f.semester}`, daysOverdue, req.user.id]);

        // Dispatch real-time notification
        await createNotification(
          f.user_id,
          '⚠️ Late Fee Penalty Assessed',
          `A late fee of ₹${lateFine} has been added to your Semester ${f.semester} dues (${daysOverdue} days past deadline).`,
          'fine',
          '/student/fees'
        );
      } else {
        await run(`
          UPDATE fines 
          SET amount = ?, days_overdue = ?, reason = ?
          WHERE id = ?
        `, [lateFine, daysOverdue, `${daysOverdue} days overdue past ${f.due_date} for Semester ${f.semester}`, existingFine.id]);

        await createNotification(
          f.user_id,
          '⚠️ Overdue Late Fine Accrual',
          `Late surcharge updated to ₹${lateFine} (${daysOverdue} days overdue past ${f.due_date}).`,
          'fine',
          '/student/fees'
        );
      }

      assessedCount++;
      totalFinesAssessed += lateFine;
    }

    res.json({
      success: true,
      message: `Late fee assessment completed: ${assessedCount} overdue accounts penalised.`,
      assessedCount,
      totalFinesAssessed
    });
  } catch (err) {
    console.error('Error in assessAllLateFines:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Dispatch an individual urgent fee / fine payment alert to a specific student
 */
export async function sendFeeAlertToStudent(req, res) {
  try {
    const { studentId } = req.params;
    const { customMessage } = req.body || {};

    const student = await get(`
      SELECT s.*, u.name as student_name, u.email as student_email, u.id as user_id,
             f.pending_amount, f.late_fine, f.days_overdue, f.due_date, f.status as fee_status
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN fees f ON f.student_id = s.id
      WHERE s.id = ?
      ORDER BY f.semester DESC LIMIT 1
    `, [studentId]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const pending = student.pending_amount || 0;
    const fine = student.late_fine || 0;
    const days = student.days_overdue || 0;

    const title = '🚨 URGENT: Overdue Hostel Fee & Late Fine Notice';
    const message = customMessage || 
      `Dear ${student.student_name}, your hostel semester fee has an outstanding balance of ₹${Number(pending).toLocaleString()}${fine > 0 ? ` (including ₹${Number(fine).toLocaleString()} late fine penalty${days > 0 ? `, ${days} days overdue` : ''})` : ''}. Please clear your dues immediately via Razorpay to prevent room lock and turnstile gate restrictions.`;

    await createNotification(
      student.user_id,
      title,
      message,
      'fine',
      '/student/fees'
    );

    res.json({
      success: true,
      message: `Urgent payment alert sent successfully to ${student.student_name}.`,
      studentName: student.student_name
    });
  } catch (err) {
    console.error('Error sending fee alert to student:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Dispatch targeted urgent alerts to ALL students who have overdue fees or unpaid late fines
 */
export async function sendFeeAlertToAllDefaulters(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find all students with unpaid fees or active late fines
    const defaulters = await all(`
      SELECT s.id as student_id, s.roll_number, u.id as user_id, u.name as student_name,
             f.id as fee_id, f.semester, f.pending_amount, f.late_fine, f.days_overdue, f.due_date, f.status as fee_status
      FROM fees f
      JOIN students s ON s.id = f.student_id
      JOIN users u ON u.id = s.user_id
      WHERE (f.status != 'Paid' AND f.pending_amount > 0)
         OR f.late_fine > 0
         OR (f.due_date < ? AND f.status != 'Paid')
    `, [today]);

    if (!defaulters || defaulters.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'No fee defaulters found! All student fees and fines are cleared.'
      });
    }

    let alertCount = 0;
    for (const d of defaulters) {
      const fine = d.late_fine || 0;
      const pending = d.pending_amount || 0;
      const days = d.days_overdue || 0;

      const title = '🚨 URGENT: Hostel Fee & Late Fine Due Notice';
      const message = `Notice to ${d.student_name} (${d.roll_number}): Total pending fee is ₹${Number(pending).toLocaleString()}${fine > 0 ? ` (includes ₹${Number(fine).toLocaleString()} late fine penalty${days > 0 ? ` for ${days} days delay` : ''})` : ''}. Pay now via Razorpay on the student portal to prevent facility deactivation.`;

      await createNotification(
        d.user_id,
        title,
        message,
        'fine',
        '/student/fees'
      );
      alertCount++;
    }

    res.json({
      success: true,
      count: alertCount,
      message: `Urgent fee & late fine notices successfully dispatched to ${alertCount} students!`
    });
  } catch (err) {
    console.error('Error sending fee alert to all defaulters:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get all fines across campus (Late Fee, Curfew Violation, Disciplinary, Room Damage)
 */
export async function getAllFines(req, res) {
  try {
    const fines = await all(`
      SELECT fn.*, 
             s.roll_number, s.branch, s.year,
             u.name as student_name, u.email as student_email,
             r.room_number, blk.name as block_name,
             issuer.name as issued_by_name
      FROM fines fn
      JOIN students s ON s.id = fn.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      LEFT JOIN users issuer ON issuer.id = fn.issued_by_user_id
      ORDER BY fn.created_at DESC
    `);

    res.json({ success: true, fines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Waive a fine (Admin only)
 */
export async function waiveFine(req, res) {
  try {
    const { id } = req.params;
    const fine = await get('SELECT fn.*, s.user_id FROM fines fn JOIN students s ON s.id = fn.student_id WHERE fn.id = ?', [id]);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine record not found.' });

    await run("UPDATE fines SET status = 'Waived' WHERE id = ?", [id]);

    // If it was linked to a fee, reset fee's late_fine
    if (fine.fee_id) {
      const fee = await get('SELECT * FROM fees WHERE id = ?', [fine.fee_id]);
      if (fee) {
        const newPending = Math.max(0, fee.pending_amount - fine.amount);
        await run(`
          UPDATE fees 
          SET late_fine = 0.0, pending_amount = ?, status = ? 
          WHERE id = ?
        `, [newPending, newPending === 0 ? 'Paid' : 'Partial', fee.id]);
      }
    }

    // Send notification to the student!
    await createNotification(
      fine.user_id,
      '🎉 Fine Waived by Administration',
      `Your fine of ₹${fine.amount} for "${fine.reason}" has been officially waived by the Administration.`,
      'success',
      '/student/fees'
    );

    res.json({ success: true, message: `Fine of ₹${fine.amount} has been successfully waived.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Issue a manual disciplinary fine (Curfew violation, Room damage, etc.)
 */
export async function issueDisciplinaryFine(req, res) {
  try {
    const { student_id, type, amount, reason } = req.body;
    const numAmount = parseFloat(amount);

    if (!student_id || isNaN(numAmount) || numAmount <= 0 || !reason) {
      return res.status(400).json({ success: false, message: 'Valid student ID, positive amount, and reason are required.' });
    }

    const student = await get('SELECT id, user_id FROM students WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const result = await run(`
      INSERT INTO fines (student_id, type, amount, reason, status, issued_by_user_id, issued_date)
      VALUES (?, ?, ?, ?, 'Unpaid', ?, date('now'))
    `, [student.id, type || 'Disciplinary', numAmount, reason.trim(), req.user.id]);

    // Send notification to the student!
    await createNotification(
      student.user_id,
      `🚨 Disciplinary Fine Levied: ${type || 'Disciplinary'}`,
      `A fine of ₹${numAmount} was issued: "${reason}". Settle with warden office or fee portal.`,
      'warning',
      '/student/fees'
    );

    res.status(201).json({
      success: true,
      message: `Fine of ₹${numAmount} issued successfully.`,
      fineId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

const RAZORPAY_KEY_ID = 'rzp_test_ApexHostels001';

/**
 * Create a Razorpay Order
 */
export async function createRazorpayOrder(req, res) {
  try {
    const { amount, fee_id, fine_id, payment_for } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const orderId = `order_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
    const receipt = `rcpt_${payment_for || 'fee'}_${Date.now()}`;

    const order = {
      id: orderId,
      entity: 'order',
      amount: Math.round(numAmount * 100), // in paise
      amount_paid: 0,
      amount_due: Math.round(numAmount * 100),
      currency: 'INR',
      receipt,
      status: 'created',
      attempts: 0,
      notes: {
        user_id: req.user.id,
        user_name: req.user.name,
        fee_id: fee_id || null,
        fine_id: fine_id || null,
        payment_for: payment_for || 'fee'
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    res.json({
      success: true,
      order,
      key_id: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Verify Razorpay Payment and Settle Fees / Fines
 */
export async function verifyRazorpayPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      fee_id,
      fine_id,
      payment_for,
      payment_method
    } = req.body;

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const generatedPaymentId = razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    const receiptNo = `RCPT-RZP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const methodStr = payment_method || 'Razorpay UPI';

    const student = await get('SELECT id, user_id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    // Case 1: Paying an individual fine directly
    if (payment_for === 'fine' && fine_id) {
      const fine = await get('SELECT * FROM fines WHERE id = ?', [fine_id]);
      if (!fine) return res.status(404).json({ success: false, message: 'Fine record not found' });

      // Update fine to Paid
      await run(`
        UPDATE fines 
        SET status = 'Paid', paid_date = CURRENT_TIMESTAMP, transaction_id = ?
        WHERE id = ?
      `, [generatedPaymentId, fine_id]);

      // If linked to fee, update fee late_fine
      if (fine.fee_id) {
        const linkedFee = await get('SELECT * FROM fees WHERE id = ?', [fine.fee_id]);
        if (linkedFee) {
          const updatedLateFine = Math.max(0, (linkedFee.late_fine || 0) - payAmount);
          const newPending = Math.max(0, linkedFee.pending_amount - payAmount);
          await run(`
            UPDATE fees 
            SET late_fine = ?, pending_amount = ?, status = ?
            WHERE id = ?
          `, [updatedLateFine, newPending, newPending === 0 ? 'Paid' : 'Pending', linkedFee.id]);
        }
      }

      // Log in fee_transactions
      let transactionFeeId = fine.fee_id;
      if (!transactionFeeId) {
        const studentFee = await get('SELECT id FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);
        transactionFeeId = studentFee ? studentFee.id : null;
      }

      if (transactionFeeId) {
        try {
          await run(`
            INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [transactionFeeId, student.id, payAmount, methodStr, generatedPaymentId, receiptNo]);
        } catch (txnErr) {
          console.warn('Could not record fee_transaction for fine:', txnErr.message);
        }
      }

      // Send real notification
      await createNotification(
        req.user.id,
        '✅ Fine Settled via Razorpay',
        `₹${payAmount.toLocaleString()} paid for "${fine.reason}". Razorpay Ref: ${generatedPaymentId}. Receipt: ${receiptNo}`,
        'fee',
        '/student/fees'
      );

      // Notify Accounts Admin & Wardens
      try {
        await createBroadcastNotification(
          ['admin', 'warden'],
          `⚖️ Disciplinary Fine Settled: ${req.user.name}`,
          `${req.user.name} settled penalty of ₹${payAmount.toLocaleString()} for "${fine.reason}". Ref: ${generatedPaymentId}.`,
          'fee',
          '/admin/students',
          req.user.id
        );
      } catch (e) {}

      const allFines = await all('SELECT * FROM fines WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
      const updatedFee = await get('SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);
      const txns = await all('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

      return res.json({
        success: true,
        message: 'Fine settled and verified via Razorpay!',
        fines: allFines,
        fee: updatedFee,
        transactions: txns,
        transaction: {
          receiptNumber: receiptNo,
          transactionId: generatedPaymentId,
          amountPaid: payAmount,
          paymentMethod: methodStr,
          paymentDate: new Date().toISOString(),
          status: 'Settled'
        }
      });
    }

    // Case 2: Paying Semester Fees (which settles base fees + any late fines)
    const fee = await get('SELECT * FROM fees WHERE student_id = ? ORDER BY semester DESC LIMIT 1', [student.id]);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    let remainingPay = payAmount;
    let finePaid = 0;

    // First settle late fine if exists
    if (fee.late_fine > 0) {
      finePaid = Math.min(fee.late_fine, remainingPay);
      remainingPay -= finePaid;
      const updatedLateFine = fee.late_fine - finePaid;
      await run('UPDATE fees SET late_fine = ? WHERE id = ?', [updatedLateFine, fee.id]);
      if (updatedLateFine === 0) {
        await run(`
          UPDATE fines 
          SET status = 'Paid', paid_date = CURRENT_TIMESTAMP, transaction_id = ?
          WHERE fee_id = ? AND status = 'Unpaid'
        `, [generatedPaymentId, fee.id]);
      }
    }

    const newPaid = Math.min(fee.total_amount, fee.paid_amount + remainingPay);
    const newBasePending = Math.max(0, fee.total_amount - newPaid);
    const updatedLateFine = fee.late_fine > 0 ? (fee.late_fine - finePaid) : 0;
    const finalPending = newBasePending + updatedLateFine;
    const newStatus = finalPending === 0 ? 'Paid' : 'Partial';

    await run(`
      UPDATE fees
      SET paid_amount = ?, pending_amount = ?, status = ?,
          receipt_number = ?, last_payment_date = CURRENT_TIMESTAMP,
          transaction_id = ?, payment_method = ?
      WHERE id = ?
    `, [newPaid, finalPending, newStatus, receiptNo, generatedPaymentId, methodStr, fee.id]);

    await run(`
      INSERT INTO fee_transactions (fee_id, student_id, amount, payment_method, transaction_id, receipt_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [fee.id, student.id, payAmount, methodStr, generatedPaymentId, receiptNo]);

    // Send real notification
    await createNotification(
      req.user.id,
      '✅ Razorpay Payment Successful',
      `₹${payAmount.toLocaleString()} credited towards Semester ${fee.semester} fees. Receipt: ${receiptNo}.${finePaid > 0 ? ' Overdue fine cleared.' : ''}`,
      'fee',
      '/student/fees'
    );

    // Notify Accounts Admin & Chief Warden
    try {
      await createBroadcastNotification(
        ['admin', 'warden'],
        `💳 Fee Payment Credited: ${req.user.name}`,
        `₹${payAmount.toLocaleString()} paid towards Semester ${fee.semester} by ${req.user.name}. Receipt: ${receiptNo}.`,
        'fee',
        '/admin/students',
        req.user.id
      );
    } catch (e) {}

    const updatedFee = await get('SELECT * FROM fees WHERE id = ?', [fee.id]);
    const allFines = await all('SELECT * FROM fines WHERE student_id = ? ORDER BY created_at DESC', [student.id]);
    const txns = await all('SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY created_at DESC', [student.id]);

    res.json({
      success: true,
      message: 'Razorpay fee payment verified & credited successfully!',
      fee: updatedFee,
      fines: allFines,
      transactions: txns,
      transaction: {
        receiptNumber: receiptNo,
        transactionId: generatedPaymentId,
        amountPaid: payAmount,
        fineCleared: finePaid,
        remainingBalance: finalPending,
        paymentDate: new Date().toISOString(),
        paymentMethod: methodStr,
        status: newStatus
      }
    });
  } catch (err) {
    console.error('Razorpay verification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}


/**
 * Assess late fine for a single student (Admin / Warden)
 */
export async function assessIndividualLateFine(req, res) {
  try {
    const { studentId } = req.params;
    const { customFineAmount, customReason } = req.body;

    const student = await get(`
      SELECT s.*, u.name as student_name, u.email as student_email, u.id as user_id,
             f.id as fee_id, f.pending_amount, f.late_fine, f.days_overdue, f.due_date, f.status as fee_status,
             f.total_amount, f.paid_amount, f.semester
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN fees f ON f.student_id = s.id
      WHERE s.id = ?
      ORDER BY f.semester DESC LIMIT 1
    `, [studentId]);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const today = new Date().toISOString().split("T")[0];
    let daysOverdue = 0;
    let lateFine = 0;
    if (student.due_date && student.due_date < today) {
      const diffMs = new Date(today).getTime() - new Date(student.due_date).getTime();
      daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      lateFine = daysOverdue * 100; // Strictly ₹100 per overdue day
    }
    if (customFineAmount) {
      lateFine = parseFloat(customFineAmount);
    }

    const reason = customReason || `${daysOverdue} days overdue fee payment (@ ₹100/day)`;

    if (student.fee_id) {
      const basePending = (student.total_amount || 45000) - (student.paid_amount || 0);
      const newPending = basePending + lateFine;
      await run(`
        UPDATE fees
        SET late_fine = ?, days_overdue = ?, pending_amount = ?, status = "Overdue"
        WHERE id = ?
      `, [lateFine, daysOverdue, newPending, student.fee_id]);
    }

    // Insert fine record
    await run(`
      INSERT INTO fines (student_id, fee_id, type, amount, reason, status, days_overdue, issued_by_user_id, issued_date)
      VALUES (?, ?, "Late Fee", ?, ?, "Unpaid", ?, ?, date("now"))
    `, [student.id, student.fee_id || null, lateFine, reason, daysOverdue, req.user.id]);

    await createNotification(
      student.user_id,
      "⚠️ Late Fine Levied",
      `A late fine penalty of ₹${lateFine} has been assessed: ${reason}.`,
      "fine",
      "/student/fees"
    );

    res.json({
      success: true,
      message: `Late fine of ₹${lateFine} levied on ${student.student_name}.`,
      fine: { amount: lateFine, reason }
    });
  } catch (err) {
    console.error("Error in assessIndividualLateFine:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}


/**
 * AI Fee & Fine Defaulter Audit Engine
 * Categorizes every student by Semester Fee vs Fines unpaid status
 */
export async function getAIDefaulterAnalysis(req, res) {
  try {
    const { semester, filter, search } = req.query;

    let sql = `
      SELECT s.id as student_id, s.roll_number, s.branch, s.year,
             u.name as student_name, u.email as student_email, u.phone as student_phone, u.id as user_id,
             COALESCE(f.semester, 6) as semester,
             COALESCE(f.total_amount, 45000.0) as sem_fee_total,
             COALESCE(f.paid_amount, 0.0) as sem_fee_paid,
             COALESCE(f.pending_amount, 45000.0) as sem_fee_pending,
             COALESCE(f.status, 'Pending') as sem_fee_status,
             COALESCE(f.due_date, '2026-10-15') as due_date,
             r.room_number, blk.name as block_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN fees f ON f.student_id = s.id
      LEFT JOIN room_allocations ra ON ra.student_id = s.id AND ra.status = 'active'
      LEFT JOIN beds b ON b.id = ra.bed_id
      LEFT JOIN rooms r ON r.id = b.room_id
      LEFT JOIN blocks blk ON blk.id = r.block_id
      WHERE 1=1
    `;

    const params = [];
    if (semester && semester !== 'All') {
      sql += ` AND f.semester = ?`;
      params.push(semester);
    }
    if (search) {
      sql += ` AND (u.name LIKE ? OR s.roll_number LIKE ? OR s.branch LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const rawStudents = await all(sql, params);
    const allUnpaidFines = await all(`SELECT * FROM fines WHERE status = 'Unpaid'`);

    const finesByStudent = {};
    for (const fine of allUnpaidFines) {
      if (!finesByStudent[fine.student_id]) {
        finesByStudent[fine.student_id] = [];
      }
      finesByStudent[fine.student_id].push(fine);
    }

    const students = [];
    let totalUnpaidSemFee = 0;
    let totalUnpaidFines = 0;
    let bothDefaultersCount = 0;
    let semFeeOnlyCount = 0;
    let fineOnlyCount = 0;
    let clearedCount = 0;

    for (const s of rawStudents) {
      const studentFines = finesByStudent[s.student_id] || [];
      const finesPending = studentFines.reduce((sum, fn) => sum + Number(fn.amount), 0);
      const semFeePending = Number(s.sem_fee_pending || 0);

      const hasSemFeePending = semFeePending > 0;
      const hasFinePending = finesPending > 0;

      let classification = 'CLEARED';
      if (hasSemFeePending && hasFinePending) {
        classification = 'BOTH_DEFAULTER';
        bothDefaultersCount++;
      } else if (hasSemFeePending) {
        classification = 'SEM_FEE_ONLY';
        semFeeOnlyCount++;
      } else if (hasFinePending) {
        classification = 'FINE_ONLY';
        fineOnlyCount++;
      } else {
        clearedCount++;
      }

      totalUnpaidSemFee += semFeePending;
      totalUnpaidFines += finesPending;

      let riskScore = 0;
      let recommendedAction = 'No action required';

      if (classification === 'BOTH_DEFAULTER') {
        riskScore = 95;
        recommendedAction = '🚨 Hold Gate Pass & Issue Urgent Defaulter Notice';
      } else if (classification === 'SEM_FEE_ONLY') {
        riskScore = 70;
        recommendedAction = '🎓 Send Semester Fee Installment Reminder';
      } else if (classification === 'FINE_ONLY') {
        riskScore = 45;
        recommendedAction = '⚠️ Send Fine Payment Alert (Mess/Curfew/Late Fee)';
      } else {
        riskScore = 0;
        recommendedAction = '✅ Clear - Eligible for all campus privileges';
      }

      const item = {
        student_id: s.student_id,
        user_id: s.user_id,
        student_name: s.student_name,
        roll_number: s.roll_number,
        branch: s.branch,
        semester: s.semester,
        block_name: s.block_name || 'Unassigned',
        room_number: s.room_number || 'N/A',
        student_email: s.student_email,
        student_phone: s.student_phone,
        
        sem_fee_total: Number(s.sem_fee_total),
        sem_fee_paid: Number(s.sem_fee_paid),
        sem_fee_pending: semFeePending,
        sem_fee_status: s.sem_fee_status,
        due_date: s.due_date,

        fines_pending: finesPending,
        fines_count: studentFines.length,
        fine_details: studentFines.map(f => ({
          id: f.id,
          type: f.type,
          amount: Number(f.amount),
          reason: f.reason,
          issued_date: f.issued_date,
          days_overdue: f.days_overdue || 0
        })),

        total_outstanding: semFeePending + finesPending,
        ai_classification: classification,
        ai_risk_score: riskScore,
        ai_recommended_action: recommendedAction
      };

      if (!filter || filter === 'all') {
        students.push(item);
      } else if (filter === 'both' && classification === 'BOTH_DEFAULTER') {
        students.push(item);
      } else if (filter === 'sem_fee_only' && classification === 'SEM_FEE_ONLY') {
        students.push(item);
      } else if (filter === 'fine_only' && classification === 'FINE_ONLY') {
        students.push(item);
      } else if (filter === 'cleared' && classification === 'CLEARED') {
        students.push(item);
      }
    }

    const aiInsights = [
      `Total outstanding campus demand is ₹${(totalUnpaidSemFee + totalUnpaidFines).toLocaleString()} (₹${totalUnpaidSemFee.toLocaleString()} base semester fees + ₹${totalUnpaidFines.toLocaleString()} unpaid fines).`,
      `${bothDefaultersCount} student(s) owe BOTH semester fees & fines, posing critical financial risk.`,
      `${semFeeOnlyCount} student(s) have unpaid Semester Fees only.`,
      `${fineOnlyCount} student(s) have clear Semester Fees but pending Disciplinary/Mess/Late fines.`,
      `${clearedCount} student(s) have zero outstanding dues and 100% clean financial record.`
    ];

    res.json({
      success: true,
      summary: {
        totalStudents: rawStudents.length,
        totalUnpaidDemand: totalUnpaidSemFee + totalUnpaidFines,
        totalUnpaidSemFee,
        totalUnpaidFines,
        bothDefaultersCount,
        semFeeOnlyCount,
        fineOnlyCount,
        clearedCount
      },
      aiInsights,
      students
    });
  } catch (err) {
    console.error('AI Defaulter Analysis Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Dispatch targeted AI alerts to specific defaulter categories
 */
export async function sendTargetedDefaulterAlert(req, res) {
  try {
    const { targetGroup } = req.body; // 'all' | 'both' | 'sem_fee_only' | 'fine_only'

    const allStudents = await all(`
      SELECT s.id as student_id, u.id as user_id, u.name as student_name, s.roll_number,
             f.pending_amount as sem_fee_pending, f.semester
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN fees f ON f.student_id = s.id
    `);

    const allFines = await all(`SELECT * FROM fines WHERE status = 'Unpaid'`);
    const finesMap = {};
    for (const fn of allFines) {
      if (!finesMap[fn.student_id]) finesMap[fn.student_id] = [];
      finesMap[fn.student_id].push(fn);
    }

    let alertCount = 0;

    for (const s of allStudents) {
      const semPending = Number(s.sem_fee_pending || 0);
      const studentFines = finesMap[s.student_id] || [];
      const finesPending = studentFines.reduce((sum, fn) => sum + Number(fn.amount), 0);

      const hasSem = semPending > 0;
      const hasFine = finesPending > 0;

      let category = 'CLEARED';
      if (hasSem && hasFine) category = 'BOTH_DEFAULTER';
      else if (hasSem) category = 'SEM_FEE_ONLY';
      else if (hasFine) category = 'FINE_ONLY';

      let shouldAlert = false;
      let title = '';
      let message = '';

      if (targetGroup === 'both' && category === 'BOTH_DEFAULTER') {
        shouldAlert = true;
        title = '🚨 CRITICAL NOTICE: Unpaid Semester Fee & Fines';
        message = `Notice to ${s.student_name}: You have ₹${semPending.toLocaleString()} pending in Semester ${s.semester || 6} fees AND ₹${finesPending.toLocaleString()} in unpaid fines. Pay now via student portal to avoid hall ticket & gate pass suspension.`;
      } else if (targetGroup === 'sem_fee_only' && category === 'SEM_FEE_ONLY') {
        shouldAlert = true;
        title = '🎓 URGENT: Semester Fee Payment Due';
        message = `Notice to ${s.student_name}: Your Semester ${s.semester || 6} base fee balance of ₹${semPending.toLocaleString()} is pending. Please settle on the student portal immediately.`;
      } else if (targetGroup === 'fine_only' && category === 'FINE_ONLY') {
        shouldAlert = true;
        title = '⚠️ NOTICE: Unpaid Hostel Fine Penalty';
        message = `Notice to ${s.student_name}: Your semester base fee is clear, but you have ${studentFines.length} pending fine(s) totaling ₹${finesPending.toLocaleString()}. Clear fines to maintain gate pass eligibility.`;
      } else if (targetGroup === 'all' && category !== 'CLEARED') {
        shouldAlert = true;
        title = '💳 ACTION REQUIRED: Pending Hostel Dues Alert';
        message = `Notice to ${s.student_name}: Total pending dues are ₹${(semPending + finesPending).toLocaleString()} (Sem Fee: ₹${semPending.toLocaleString()}, Fines: ₹${finesPending.toLocaleString()}). Pay now via Razorpay on student portal.`;
      }

      if (shouldAlert) {
        await createNotification(
          s.user_id,
          title,
          message,
          'fee',
          '/student/fees'
        );
        alertCount++;
      }
    }

    res.json({
      success: true,
      count: alertCount,
      message: `Targeted alerts successfully dispatched to ${alertCount} student(s) in category '${targetGroup}'!`
    });
  } catch (err) {
    console.error('Targeted Alert Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
