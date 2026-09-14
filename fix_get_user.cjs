const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.get\("\/api\/users\/:id", \(req, res\) => \{[\s\S]*?\}\);/, `app.get("/api/users/:id", async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (p) {
      const u = {
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
      };
      usersStore.set(u.id, u);
      return res.json(u);
    }
  }
  const user = usersStore.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ ...user, passwordHash: undefined });
});`);

fs.writeFileSync('server.ts', code);
