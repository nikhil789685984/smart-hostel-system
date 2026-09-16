const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', 'utf8');

// The table row needs to become clickable, or add a View button.
// Let's add Link import.
if (!code.includes('import { Link }')) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { Link } from 'react-router-dom';"
  );
}

// Replace the View Details button with a Link, or just wrap the Title.
// Search for <td className="py-4 px-6 text-slate-800"> (which has title/desc)
const oldTd = `<td className="py-4 px-6">
                      <p className="font-bold text-slate-800 text-sm mb-0.5">{c.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                    </td>`;

const newTd = `<td className="py-4 px-6">
                      <p className="font-bold text-slate-800 text-sm mb-0.5">{c.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                    </td>`;

// Let's modify the Actions column to include a View button
// Search for "Action" column
const actionsRegex = /<td className="py-4 px-6 text-right">[\s\S]*?<\/button>[\s\S]*?<\/td>/;
const newActions = `<td className="py-4 px-6 text-right space-x-2">
                      <Link 
                        to={\`/admin/complaints/\${c.id}\`}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition border border-transparent hover:border-blue-100"
                        title="View Full Details & Contact"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openUpdateModal(c)}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Update Status"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    </td>`;

code = code.replace(actionsRegex, newActions);

fs.writeFileSync('frontend/src/pages/warden/ComplaintManagement.jsx', code);
