const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

content = content.replace(/      return \{ success: false, error: "Login failed via Supabase" \};[\s\S]*?      return \{ success: true \};/g, '      return { success: false, error: "Login failed via Supabase" };');
content = content.replace(/      return \{ success: false, error: "Signup failed via Supabase" \};[\s\S]*?      return \{ success: true \};/g, '      return { success: false, error: "Signup failed via Supabase" };');

fs.writeFileSync('src/context/AuthContext.tsx', content);
