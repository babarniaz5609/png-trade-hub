const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

content = content.replace(/await supabase\.auth\.signUp\(\{[\s\S]*?\}\);\s*\} catch \(supabaseErr\)/, `const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                username: userData.username,
                role: assignedRole,
                country: userData.country || 'Papua New Guinea',
                phone_number: userData.phoneNumber
              }
            }
          });
          if (!error && data.user) {
             return { success: true };
          } else {
             return { success: false, error: error?.message || "Signup failed" };
          }
        } catch (supabaseErr)`);

fs.writeFileSync('src/context/AuthContext.tsx', content);
