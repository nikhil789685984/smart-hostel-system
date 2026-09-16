const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// Undo the bad sed replacement
content = content.replace(/      <\/div>\n    <\/div>/g, '    </div>');

// Add the missing closing tag before the end
if (!content.includes('      </div>\n    </div>\n  );\n}')) {
  content = content.replace('    </div>\n  );\n}', '      </div>\n    </div>\n  );\n}');
}

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', content);
