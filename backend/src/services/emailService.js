import nodemailer from 'nodemailer';
import { run } from '../database/db.js';

const ADMIN_EMAIL = process.env.ADMIN_WELLNESS_EMAIL || 'nikhilsheoran093@gmail.com';

// Cache transporter instance
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    const cleanPass = gmailPass.replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: cleanPass
      }
    });
    console.log(`📧 Email service configured with Gmail account: ${gmailUser}`);
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`📧 Email service configured with custom SMTP: ${smtpHost}`);
    return transporter;
  }

  // Fallback: Ethereal test account or simulated transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`📧 Email service using Ethereal test account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.log('📧 Email service running in local logging simulation mode.');
    return null;
  }
}

/**
 * Log email dispatch to database for audit & dashboard viewing
 */
async function logEmailToDb(recipient, subject, bodyHtml, type, status, errorMessage = null) {
  try {
    const snippet = bodyHtml.replace(/<[^>]*>?/gm, '').substring(0, 300);
    await run(
      `INSERT INTO email_logs (recipient, subject, body_preview, type, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recipient, subject, snippet, type, status, errorMessage]
    );
  } catch (err) {
    console.warn('⚠️ Could not record email log in DB:', err.message);
  }
}

/**
 * 1. Dispatch full depression screening test details to Admin (nikhilsheoran093@gmail.com)
 */
export async function sendDepressionReportToAdmin(data) {
  const recipient = ADMIN_EMAIL;
  const severityColor =
    data.severity === 'Severe'
      ? '#e11d48'
      : data.severity === 'Moderately Severe'
      ? '#f43f5e'
      : data.severity === 'Moderate'
      ? '#ea580c'
      : data.severity === 'Mild'
      ? '#eab308'
      : '#10b981';

  const subject = `🚨 [Confidential] Depression Screening Test Report: ${data.name} (Score: ${data.total_score}/27 - ${data.severity})`;

  // Render question-answer breakdown
  const answersTableRows = (data.answers || [])
    .map(
      (a, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px; color: #475569; width: 30px; font-weight: bold;">Q${idx + 1}</td>
        <td style="padding: 10px; color: #1e293b;">${a.question}</td>
        <td style="padding: 10px; text-align: center; font-weight: bold; color: ${a.score >= 2 ? '#e11d48' : '#334155'};">
          ${a.score} pt (${a.label})
        </td>
      </tr>`
    )
    .join('');

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; color: #ffffff; }
      .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
      .header p { margin: 0; font-size: 13px; color: #cbd5e1; }
      .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: #ffffff; }
      .content { padding: 24px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
      .info-box { background: #f1f5f9; padding: 12px 14px; border-radius: 10px; font-size: 13px; }
      .info-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
      .info-val { font-weight: 700; color: #0f172a; word-break: break-word; }
      .table-box { width: 100%; border-collapse: collapse; margin-top: 14px; background: #fafafa; border-radius: 12px; overflow: hidden; }
      .notes-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 13px; color: #92400e; }
      .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🧠 Student Mental Health & Depression Screening Report</h1>
        <p>Apex Smart Hostel • Confidential Student Counseling Desk</p>
      </div>

      <div class="content">
        <!-- Severity Banner -->
        <div style="background: #fdf2f8; border: 1px solid #fbcfe8; padding: 16px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; color: #9d174d; font-weight: bold; text-transform: uppercase;">PHQ-9 Depression Severity</div>
            <div style="font-size: 22px; font-weight: 900; color: ${severityColor}; margin-top: 2px;">
              ${data.severity} (${data.total_score} / 27)
            </div>
          </div>
          <div class="badge" style="background-color: ${severityColor};">
            ${data.severity}
          </div>
        </div>

        <!-- Student Profile Table -->
        <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
          Student Resident Information
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Student Name:</td>
            <td style="padding: 8px 0; font-weight: 800; color: #0f172a;">${data.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Roll Number:</td>
            <td style="padding: 8px 0; font-weight: 700; font-family: monospace;">${data.roll_number || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Student Email:</td>
            <td style="padding: 8px 0; font-weight: 700;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Phone / WhatsApp:</td>
            <td style="padding: 8px 0; font-weight: 700;">${data.phone || 'Not Provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Accommodation:</td>
            <td style="padding: 8px 0; font-weight: 700;">${data.block_name || 'Resident Block'} - Room ${data.room_number || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Counseling Requested:</td>
            <td style="padding: 8px 0; font-weight: 800; color: ${data.counseling_requested ? '#0284c7' : '#64748b'};">
              ${data.counseling_requested ? `YES (${data.preferred_mode})` : 'Self-assessment only'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Submission Time:</td>
            <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>

        ${
          data.notes
            ? `
        <div class="notes-box">
          <strong>Student's Personal Note / In Their Own Words:</strong>
          <div style="margin-top: 6px; font-style: italic; white-space: pre-wrap;">"${data.notes}"</div>
        </div>`
            : ''
        }

        <!-- Questionnaire Breakdown -->
        <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 24px; margin-bottom: 8px;">
          Clinical PHQ-9 Responses Breakdown
        </div>
        <table class="table-box">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 8px 10px;">#</th>
              <th style="padding: 8px 10px;">Symptom Question</th>
              <th style="padding: 8px 10px; text-align: center;">Frequency / Score</th>
            </tr>
          </thead>
          <tbody>
            ${answersTableRows}
          </tbody>
        </table>

        <!-- 1-Click Verification Action For Counselor -->
        <div style="margin-top: 26px; padding: 22px; background: #ecfdf5; border-radius: 16px; border: 2px solid #10b981; text-align: center; box-shadow: 0 4px 16px rgba(16,185,129,0.12);">
          <div style="font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 6px;">
            ⚡ 1-Click Email Approval & Verification
          </div>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #047857; line-height: 1.5;">
            Click the button below directly from your email to approve this student. The website will immediately update to show the student:
            <br/><strong style="color: #065f46; font-size: 14px;">"Your details are verified by counselor. They will call you soon."</strong>
          </p>
          <a href="${(process.env.APP_PUBLIC_URL || 'https://model-shipment-especially-singing.trycloudflare.com')}/api/wellness/email-verify?id=${data.screeningId}&token=${data.token || ''}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 14px rgba(16,185,129,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
            ✅ APPROVE & VERIFY DETAILS NOW
          </a>

          <!-- Alternate WiFi Link -->
          <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
            On Campus / Same Wi-Fi? <a href="http://192.168.33.137:5001/api/wellness/email-verify?id=${data.screeningId}&token=${data.token || ''}" style="color: #059669; font-weight: bold; text-decoration: underline;">Click Here (Direct Wi-Fi Link)</a>
          </div>

          ${data.phone ? `
          <div style="margin-top: 14px;">
            <a href="tel:${data.phone}" style="display: inline-block; color: #0284c7; font-size: 13px; font-weight: 700; text-decoration: underline;">
              📞 Call Student Directly: ${data.phone}
            </a>
          </div>` : ''}
        </div>

        <div style="margin-top: 16px; text-align: center;">
          <a href="${(process.env.APP_PUBLIC_URL || 'https://model-shipment-especially-singing.trycloudflare.com')}/admin/wellness" style="color: #64748b; font-size: 12px; text-decoration: underline;">
            Or open Full Wellness Admin Dashboard
          </a>
        </div>
      </div>

      <div class="footer">
        Apex Smart Campus Living • Student Mental Health & Psychological Care Cell<br/>
        This message contains confidential medical/psychological assessment data intended solely for the designated student counselor/admin.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const t = await getTransporter();
    let info = null;
    if (t) {
      info = await t.sendMail({
        from: `"Apex Smart Hostel Wellness Desk" <${process.env.GMAIL_USER || 'wellness@smarthostel.edu'}>`,
        to: recipient,
        subject,
        html: htmlBody
      });
      console.log(`✅ [Depression Report Sent to Admin] ID: ${info.messageId} -> ${recipient}`);
      if (t.getTestMessageUrl && info) {
        console.log(`🔗 Ethereal Email Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } else {
      console.log(`ℹ️ [Simulation] Depression report email logged for Admin (${recipient})`);
    }

    await logEmailToDb(recipient, subject, htmlBody, 'depression_report_to_admin', 'sent');
    return { success: true, recipient };
  } catch (err) {
    console.error('❌ Failed to send depression report email to admin:', err.message);
    await logEmailToDb(recipient, subject, htmlBody, 'depression_report_to_admin', 'failed', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Dispatch Session Approval / Scheduled Email to the Student
 */
export async function sendApprovalNotificationToStudent(studentEmail, data) {
  if (!studentEmail) return { success: false, error: 'No student email provided' };

  const subject = `💚 Your Confidential Wellness Counseling Session is Approved - Apex Smart Hostel`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #bbf7d0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
      .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 28px 24px; color: #ffffff; }
      .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
      .header p { margin: 0; font-size: 13px; color: #a7f3d0; }
      .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #334155; }
      .session-card { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 18px; margin: 18px 0; }
      .session-title { font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
      .item { margin-bottom: 8px; font-size: 13px; }
      .item strong { color: #0f172a; display: inline-block; width: 140px; }
      .counselor-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #1e40af; }
      .helpline-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px; margin-top: 20px; font-size: 12px; color: #9f1239; }
      .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>💚 Wellness Support & Counseling Approved</h1>
        <p>Apex Smart Hostel • Safe Space & Mental Health Support</p>
      </div>

      <div class="content">
        <p>Dear <strong>${data.name}</strong>,</p>
        <p>
          Thank you for taking the depression screening test and reaching out. Reaching out takes courage, and we want you to know that <strong>you are not alone</strong> and the entire campus community is here to support you unconditionally.
        </p>

        <p>
          Your confidential request for counseling support has been <strong>approved</strong> by the Student Welfare Desk. Your session details are confirmed below:
        </p>

        <div class="session-card">
          <div class="session-title">
            <span>🗓️ Confirmed Session Appointment</span>
          </div>
          <div class="item">
            <strong>Appointment Time:</strong> <span>${data.session_time || 'Today / Scheduled mutually'}</span>
          </div>
          <div class="item">
            <strong>Counselor / Guide:</strong> <span>${data.counselor_name || 'Designated Student Welfare Counselor'}</span>
          </div>
          <div class="item">
            <strong>Venue / Meeting:</strong> <span>${data.session_venue || 'Wellness Centre (Room 102, Admin Wing) / Online Call'}</span>
          </div>
          <div class="item">
            <strong>Session Mode:</strong> <span>${data.preferred_mode || 'In-Person'}</span>
          </div>
        </div>

        ${
          data.admin_notes
            ? `
        <div class="counselor-note">
          <strong>A Personal Note from Your Counselor:</strong>
          <div style="margin-top: 4px; font-style: italic;">"${data.admin_notes}"</div>
        </div>`
            : ''
        }

        <p style="font-size: 13px; color: #64748b;">
          Everything discussed during this session is <strong>100% confidential</strong> and protected under student privacy guidelines. You do not need to prepare anything—just come as you are.
        </p>

        <!-- 24x7 Helplines -->
        <div class="helpline-box">
          <strong>🆘 Need Immediate 24x7 Support Before Your Session?</strong>
          <div style="margin-top: 6px; line-height: 1.5;">
            • <strong>Tele-MANAS (Govt of India Free 24x7):</strong> Call <strong>14416</strong> or <strong>1800 891 4416</strong><br/>
            • <strong>Vandrevala Foundation Helpline:</strong> +91 9999 666 555<br/>
            • <strong>NIMHANS Student Support:</strong> 080 4611 0007<br/>
            • <strong>Campus Night Emergency Warden:</strong> Contact Campus Guard Desk
          </div>
        </div>
      </div>

      <div class="footer">
        Apex Smart Campus Living • Dedicated to Student Well-Being, Health & Peace of Mind.<br/>
        This email was sent to ${studentEmail} upon counselor approval.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const t = await getTransporter();
    let info = null;
    if (t) {
      info = await t.sendMail({
        from: `"Apex Smart Hostel Wellness Desk" <${process.env.GMAIL_USER || 'wellness@smarthostel.edu'}>`,
        to: studentEmail,
        subject,
        html: htmlBody
      });
      console.log(`✅ [Student Approval Email Sent] ID: ${info.messageId} -> ${studentEmail}`);
      if (t.getTestMessageUrl && info) {
        console.log(`🔗 Ethereal Student Email Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } else {
      console.log(`ℹ️ [Simulation] Student approval email logged for (${studentEmail})`);
    }

    await logEmailToDb(studentEmail, subject, htmlBody, 'counseling_approval_to_student', 'sent');
    return { success: true, studentEmail };
  } catch (err) {
    console.error('❌ Failed to send student approval email:', err.message);
    await logEmailToDb(studentEmail, subject, htmlBody, 'counseling_approval_to_student', 'failed', err.message);
    return { success: false, error: err.message };
  }
}
