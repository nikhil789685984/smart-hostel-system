const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target = "{/* Student Routes */}";
const replacement = `            {/* Aliases */}
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/warden" element={<Navigate to="/warden/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Student Routes */}`;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Added safety redirects to App.jsx');
