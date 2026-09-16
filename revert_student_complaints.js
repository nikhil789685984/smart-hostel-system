const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentComplaints.jsx', 'utf8');

// The safest way is to just remove the button so it's not visible, and it doesn't matter if the state/modal is there, it's just dead code that won't crash.
const btnStr = `<motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openWardenModal}
          className="relative z-10 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-black shadow-sm transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          Escalate / Report Warden
        </motion.button>`;

code = code.replace(btnStr, '');
fs.writeFileSync('frontend/src/pages/student/StudentComplaints.jsx', code);
console.log('Removed button from StudentComplaints.');
