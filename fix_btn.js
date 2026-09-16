const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentComplaints.jsx', 'utf8');

const originalBtn = `<motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setAiSuggestion(null);
            setModalOpen(true);
          }}
          className="relative z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/30 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> + Log New Complaint
        </motion.button>`;

const newBtn = `<motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openWardenModal}
          className="relative z-10 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-black shadow-sm transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          Escalate / Report Warden
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setAiSuggestion(null);
            setModalOpen(true);
          }}
          className="relative z-10 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/30 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> + Log New Complaint
        </motion.button>`;

code = code.replace(originalBtn, newBtn);
fs.writeFileSync('frontend/src/pages/student/StudentComplaints.jsx', code);
console.log("Patched btn");
