const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', 'utf8');

code = code.replace(
  "const basePath = user?.role === 'admin' ? '/admin/complaints' : '/warden/complaints';",
  "const basePath = user?.role === 'student' ? '/student/complaints' : (user?.role === 'admin' ? '/admin/complaints' : '/warden/complaints');"
);

// Also the placeholder: "Send a direct message to the student..."
code = code.replace(
  'placeholder="Send a direct message to the student..."',
  'placeholder={user?.role === "student" ? "Reply to admin/warden..." : "Send a direct message to the student..."}'
);

// Also the Contact Student title
code = code.replace(
  '<h3 className="font-black text-slate-800">Contact Student / Updates</h3>',
  '<h3 className="font-black text-slate-800">{user?.role === "student" ? "Ticket Chat & Updates" : "Contact Student / Updates"}</h3>'
);

// Also Admin styling logic
code = code.replace(
  "const isAdmin = u.updater_role === 'admin' || u.updater_role === 'warden';",
  "const isMe = u.updater_role === user?.role || (u.updater_role === 'admin' && user?.role === 'warden') || (u.updater_role === 'warden' && user?.role === 'admin');"
);

// Re-write the chat bubble alignment
code = code.replace(
  "className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}",
  "className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}"
);
code = code.replace(
  "className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}",
  "className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}"
);

fs.writeFileSync('frontend/src/pages/admin/AdminComplaintDetails.jsx', code);
console.log('Fixed AdminComplaintDetails for students');
