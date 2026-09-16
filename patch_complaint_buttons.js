const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', 'utf8');

const target = `<button
                  onClick={() => openUpdateModal(c)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow transition shrink-0 self-start"
                >
                  Manage Status
                </button>`;

const replacement = `<div className="flex flex-col sm:flex-row gap-2 self-start shrink-0">
                  <Link
                    to={\`/\${user?.role === 'admin' ? 'admin' : 'warden'}/complaints/\${c.id}\`}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => openUpdateModal(c)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow transition"
                  >
                    Manage Status
                  </button>
                </div>`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', code);
  console.log("Buttons successfully patched.");
} else {
  console.log("Could not find the target block to replace.");
}
