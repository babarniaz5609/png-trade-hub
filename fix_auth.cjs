const fs = require('fs');
const content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

let updated = content
  .replace(/\/\/ 2\. Authoritative server ledger API([\s\S]*?)const verifiedUser/g, 'return { success: false, error: "Login failed via Supabase" };\n      const verifiedUser')
  .replace(/\/\/ 2\. Register in server ledger authority([\s\S]*?)await refreshUsersList\(\);/g, 'return { success: false, error: "Signup failed via Supabase" };\n      await refreshUsersList();');
  
fs.writeFileSync('src/context/AuthContext.tsx', updated);
