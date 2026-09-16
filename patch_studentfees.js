const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/student/StudentFees.jsx', 'utf8');

// Replace the single invoice display with a mapped list
const searchInvoiceBlock = /\{\/\* Current Invoice Card \*\/\}.*?\{\/\* Quick Stats Row \*\/\}/s;

const newInvoiceBlock = `{/* Semester Invoices List */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800">Semester Invoices</h3>
          {feeData?.fees && feeData.fees.map((semFee) => {
            const isPaid = semFee.status === 'Paid';
            const isOverdue = semFee.pending_amount > 0 && semFee.status !== 'Paid' && new Date(semFee.due_date) < new Date();
            
            return (
              <motion.div key={semFee.id} whileHover={{ y: -2 }} className={\`bg-white/70 backdrop-blur-md rounded-[24px] p-5 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all \${isOverdue ? 'border-rose-200' : isPaid ? 'border-emerald-200' : 'border-slate-200'}\`}>
                <div className="flex items-center gap-4">
                  <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md \${isPaid ? 'bg-emerald-500 shadow-emerald-500/30' : isOverdue ? 'bg-rose-500 shadow-rose-500/30' : 'bg-blue-600 shadow-blue-500/30'}\`}>
                    {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Semester {semFee.semester} Fee</h4>
                    <p className="text-xs text-slate-500 font-medium">Due: {new Date(semFee.due_date).toLocaleDateString()}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={\`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full \${isPaid ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}\`}>
                        {semFee.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total / Pending</p>
                    <p className="text-base font-black text-slate-900">₹{semFee.total_amount} / <span className={isPaid ? 'text-emerald-600' : 'text-rose-600'}>₹{semFee.pending_amount + (semFee.late_fine||0)}</span></p>
                  </div>
                  {!isPaid && (
                    <button onClick={() => {
                        setPayAmount((semFee.pending_amount + (semFee.late_fine||0)).toString());
                        setPaymentTarget('fee');
                        setGatewayOpen(true);
                      }} 
                      className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all">
                      Pay Now
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats Row */}`;

if (code.match(searchInvoiceBlock)) {
  code = code.replace(searchInvoiceBlock, newInvoiceBlock);
  fs.writeFileSync('frontend/src/pages/student/StudentFees.jsx', code);
  console.log('StudentFees patched');
} else {
  console.log('Block not found');
}
