const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

const semestersBlock = `      {/* Semester History Summary */}
      {feeData?.fees && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-6 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-black text-slate-900">Academic Semester Ledgers</h2>
             <span className="text-[10px] font-bold uppercase text-slate-400">All 8 Semesters Generated</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {feeData.fees.map((sem) => {
               const isPaid = sem.status === 'Paid';
               const pending = sem.pending_amount + (sem.late_fine||0);
               return (
                 <div key={sem.id} className={\`p-3 rounded-2xl border flex flex-col justify-between \${isPaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'} transition-all hover:scale-105\`}>
                   <div>
                     <span className="text-[10px] font-black uppercase text-slate-500">Sem {sem.semester}</span>
                     <div className={\`w-2 h-2 rounded-full absolute top-3 right-3 \${isPaid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}\`}></div>
                   </div>
                   <div className="mt-2">
                     <p className={\`text-sm font-black \${isPaid ? 'text-emerald-700' : 'text-rose-700'}\`}>₹{isPaid ? sem.total_amount : pending}</p>
                     <p className="text-[9px] font-bold uppercase text-slate-400">{isPaid ? 'Settled' : 'Pending Dues'}</p>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Header Banner */}`;

code = code.replace('{/* Header Banner */}', semestersBlock);
fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
console.log('Semesters patched');
