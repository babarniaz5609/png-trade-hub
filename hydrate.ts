import { getSupabaseClient } from './server/supabaseService';

export async function hydrateFromSupabase(
  usersStore: Map<string, any>,
  walletsStore: Map<string, any>,
  p2pOffersStore: Map<string, any>,
  p2pTradesStore: Map<string, any>,
  withdrawalsStore: Map<string, any>,
  supportTicketsStore: Map<string, any>
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("No Supabase client, skipping hydration.");
    return;
  }
  try {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      profiles.forEach((p: any) => {
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
      // Group wallets by user
      const wMap = new Map();
      wallets.forEach((w: any) => {
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
      wMap.forEach((v, k) => walletsStore.set(k, v));
    }
    
    const { data: offers } = await supabase.from('p2p_offers').select('*');
    if (offers) {
      offers.forEach((o: any) => {
        p2pOffersStore.set(o.id, {
          id: o.id,
          userId: o.user_id,
          userUsername: o.user_username,
          type: o.type,
          cryptoCurrency: o.crypto_currency,
          fiatCurrency: o.fiat_currency,
          pricePerUnit: Number(o.price_per_unit),
          totalAmount: Number(o.total_amount),
          availableAmount: Number(o.available_amount),
          minLimit: Number(o.min_limit),
          maxLimit: Number(o.max_limit),
          paymentMethods: typeof o.payment_methods === 'string' ? JSON.parse(o.payment_methods) : o.payment_methods,
          paymentWindowMinutes: Number(o.payment_window_minutes),
          terms: o.terms,
          autoReply: o.auto_reply,
          status: o.status,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        });
      });
    }

    const { data: trades } = await supabase.from('p2p_trades').select('*');
    if (trades) {
      trades.forEach((t: any) => {
        p2pTradesStore.set(t.id, {
          id: t.id,
          offerId: t.offer_id,
          buyerId: t.buyer_id,
          buyerUsername: t.buyer_username,
          sellerId: t.seller_id,
          sellerUsername: t.seller_username,
          cryptoCurrency: t.crypto_currency,
          fiatCurrency: t.fiat_currency,
          cryptoAmount: Number(t.crypto_amount),
          fiatAmount: Number(t.fiat_amount),
          pricePerUnit: Number(t.price_per_unit),
          status: t.status,
          paymentMethod: t.payment_method,
          paymentWindowMinutes: Number(t.payment_window_minutes),
          expiresAt: t.expires_at,
          escrowLocked: t.escrow_locked,
          adminResolutionNote: t.admin_resolution_note,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        });
      });
    }
    
    console.log(`[Hydrate] Loaded ${profiles?.length || 0} users from Supabase.`);
  } catch(e) {
    console.error("[Hydrate] error", e);
  }
}
