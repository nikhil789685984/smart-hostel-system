const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentComplaints.jsx', 'utf8');

// 1. Add state for warden modal
code = code.replace(
  'const [categoryFilter, setCategoryFilter] = useState(\'All\');',
  'const [categoryFilter, setCategoryFilter] = useState(\'All\');\n  const [wardenModalOpen, setWardenModalOpen] = useState(false);\n  const [wardenList, setWardenList] = useState([]);\n  const [wardenReport, setWardenReport] = useState({ warden_user_id: \'\', subject: \'\', description: \'\' });\n  const [submittingWarden, setSubmittingWarden] = useState(false);'
);

// 2. Fetch warden list when opening modal
const modalFunc = `  const openWardenModal = async () => {
    setWardenModalOpen(true);
    try {
      const res = await api.getWardensList();
      if(res.success) setWardenList(res.wardens);
    } catch(err) {
      console.error(err);
    }
  };

  const handleWardenReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingWarden(true);
    try {
      const res = await api.submitWardenComplaint(wardenReport);
      if(res.success) {
        alert('Complaint successfully escalated to Admin.');
        setWardenModalOpen(false);
        setWardenReport({ warden_user_id: '', subject: '', description: '' });
      }
    } catch(err) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmittingWarden(false);
    }
  };

  const [triageData, setTriageData] =`;

code = code.replace('  const [triageData, setTriageData] =', modalFunc);

// 3. Add UI Button
const reportBtn = `<button
              onClick={openWardenModal}
              className="px-5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold shadow-sm hover:bg-rose-100 transition flex items-center gap-2 shrink-0"
            >
              Report Warden
            </button>
            <button
              onClick={() => setNewModalOpen(true)}
              className="px-5`;

code = code.replace(/<button\n\s*onClick=\{\(\) => setNewModalOpen\(true\)\}\n\s*className="px-5/s, reportBtn);

// 4. Add Modal UI at the end
const modalUI = `      </Modal>

      {/* Report Warden Modal */}
      <Modal
        isOpen={wardenModalOpen}
        onClose={() => setWardenModalOpen(false)}
        title="Escalate Issue to Admin"
        subtitle="Report inappropriate warden behavior or negligence securely to Institutional Admin."
      >
        <form onSubmit={handleWardenReportSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Select Warden</label>
            <select
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition"
              value={wardenReport.warden_user_id}
              onChange={(e) => setWardenReport({...wardenReport, warden_user_id: e.target.value})}
            >
              <option value="">-- Choose Warden --</option>
              {wardenList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Incident Subject</label>
            <input
              type="text"
              required
              placeholder="E.g., Negligence, Unfair Treatment, Unprofessional Behavior"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition"
              value={wardenReport.subject}
              onChange={(e) => setWardenReport({...wardenReport, subject: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Detailed Description</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the incident securely and honestly. This report will go directly to the Admin."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm transition resize-none"
              value={wardenReport.description}
              onChange={(e) => setWardenReport({...wardenReport, description: e.target.value})}
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setWardenModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingWarden}
              className="px-5 py-2.5 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50 transition"
            >
              {submittingWarden ? 'Submitting...' : 'Submit to Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>`;

code = code.replace(/      <\/Modal>\n\n    <\/motion.div>/s, modalUI);
fs.writeFileSync('frontend/src/pages/student/StudentComplaints.jsx', code);
