const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove seedInitialProductionAccounts body and call
code = code.replace(/function seedInitialProductionAccounts\(\) \{[\s\S]*?seedInitialProductionAccounts\(\);/, `
async function seedInitialProductionAccounts() {
  const { getSupabaseClient } = require('./server/supabaseService');
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      profiles.forEach((p) => {
        usersStore.set(p.id, {
          id: p.id,
          email: p.email,
          username: p.username,
          role: p.role,
          kycStatus: p.kyc_status,
          kycDocumentType: p.kyc_document_type,
          kycDocumentNumber: p.kyc_document_number,
          kycSubmittedAt: p.kyc_submitted_at,
          kycVerifiedAt: p.kyc_verified_at,
          isFrozen: p.is_frozen,
          twoFactorEnabled: p.two_factor_enabled,
          totalTrades: p.total_trades,
          completionRate: p.completion_rate,
          positiveReviews: p.positive_reviews,
          negativeReviews: p.negative_reviews,
          phoneNumber: p.phone_number,
          country: p.country,
          preferredFiat: p.preferred_fiat,
          createdAt: p.created_at
        });
      });
    }

    const { data: wallets } = await supabase.from('wallets').select('*');
    if (wallets) {
      const wMap = new Map();
      wallets.forEach((w) => {
        if (!wMap.has(w.user_id)) {
          wMap.set(w.user_id, {
            id: 'wallet_' + w.user_id,
            userId: w.user_id,
            balances: {},
            depositAddresses: {},
            updatedAt: w.updated_at
          });
        }
        wMap.get(w.user_id).balances[w.currency] = {
           available: Number(w.available_balance),
           lockedEscrow: Number(w.locked_escrow_balance)
        };
      });
      wMap.forEach((v, k) => {
        // ensure default USDT/PGK if missing
        if(!v.balances.USDT) v.balances.USDT = { available: 0, lockedEscrow: 0 };
        if(!v.balances.PGK) v.balances.PGK = { available: 0, lockedEscrow: 0 };
        walletsStore.set(k, v);
      });
    }
  } catch(e) {
    console.error("Hydration error", e);
  }
}
`);

// Call it before app.listen
code = code.replace(/app\.listen\(PORT, "0\.0\.0\.0"/, 'await seedInitialProductionAccounts();\n  app.listen(PORT, "0.0.0.0"');

fs.writeFileSync('server.ts', code);
