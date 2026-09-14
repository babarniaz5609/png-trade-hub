const fs = require('fs');
let code = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// replace the div block entirely
code = code.replace(/<div className="p-4 bg-slate-950\/40 border-b border-slate-800 text-xs">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync('src/components/AuthModal.tsx', code);
