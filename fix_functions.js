const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentComplaints.jsx', 'utf8');

const functionsToInject = `
  const openWardenModal = async () => {
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

  const fetchComplaints = async () => {`;

code = code.replace('  const fetchComplaints = async () => {', functionsToInject);

fs.writeFileSync('frontend/src/pages/student/StudentComplaints.jsx', code);
console.log('Fixed missing functions!');
