const fs = require('fs');
let code = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

code = code.replace(/\{.*?Quick Credential Fills.*?\}/, '');
code = code.replace(/<div className="p-4 bg-slate-950\/40 border-b border-slate-800 text-xs">[\s\S]*?<\/div>\s*<\/div>\s*<div className="p-5">/, '<div className="p-5">');

fs.writeFileSync('src/components/AuthModal.tsx', code);
