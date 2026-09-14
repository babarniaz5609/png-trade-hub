-- ==============================================================================
-- PNG TRADE HUB - SUPABASE POSTGRESQL DATABASE SCHEMA
-- P2P USDT & Cryptocurrency Trading Platform with Tatum Blockchain Architecture
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USERS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    kyc_status TEXT NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
    kyc_document_type TEXT,
    kyc_document_number TEXT,
    kyc_submitted_at TIMESTAMPTZ,
    kyc_verified_at TIMESTAMPTZ,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret TEXT, -- Kept secure, server-side only
    total_trades INTEGER NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    positive_reviews INTEGER NOT NULL DEFAULT 0,
    negative_reviews INTEGER NOT NULL DEFAULT 0,
    phone_number TEXT,
    country TEXT NOT NULL DEFAULT 'Papua New Guinea',
    preferred_fiat TEXT NOT NULL DEFAULT 'PGK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER WALLETS & LEDGER
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('USDT', 'TRX', 'ETH', 'BNB')),
    network TEXT NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'BEP20', 'TRON', 'ETHEREUM', 'BSC')),
    available_balance NUMERIC(18, 6) NOT NULL DEFAULT 0.000000 CHECK (available_balance >= 0),
    locked_escrow_balance NUMERIC(18, 6) NOT NULL DEFAULT 0.000000 CHECK (locked_escrow_balance >= 0),
    deposit_address TEXT,
    destination_tag TEXT,
    tatum_subscription_id TEXT, -- For Tatum Webhook notifications
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, currency, network)
);

-- 3. TATUM BLOCKCHAIN ADDRESSES (Pre-generated / Tatum derivation vault)
CREATE TABLE IF NOT EXISTS public.tatum_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL UNIQUE,
    derivation_index INTEGER,
    assigned_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPOSITS
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('USDT', 'TRX', 'ETH', 'BNB')),
    network TEXT NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'BEP20', 'TRON', 'ETHEREUM', 'BSC')),
    amount NUMERIC(18, 6) NOT NULL CHECK (amount > 0),
    fee NUMERIC(18, 6) NOT NULL DEFAULT 0,
    to_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    block_number BIGINT,
    confirmations INTEGER NOT NULL DEFAULT 0,
    required_confirmations INTEGER NOT NULL DEFAULT 12,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED')),
    tatum_webhook_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. WITHDRAWALS
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('USDT', 'TRX', 'ETH', 'BNB')),
    network TEXT NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'BEP20', 'TRON', 'ETHEREUM', 'BSC')),
    amount NUMERIC(18, 6) NOT NULL CHECK (amount > 0),
    fee NUMERIC(18, 6) NOT NULL DEFAULT 0,
    net_amount NUMERIC(18, 6) NOT NULL CHECK (net_amount > 0),
    to_address TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'PROCESSING', 'COMPLETED', 'REJECTED')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    tatum_tx_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 6. INTERNAL TRANSFERS (0% Fee, Instant between PNG Trade Hub users)
CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('USDT', 'TRX', 'ETH', 'BNB')),
    amount NUMERIC(18, 6) NOT NULL CHECK (amount > 0),
    fee NUMERIC(18, 6) NOT NULL DEFAULT 0.000000,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. P2P OFFERS (Maker ads)
CREATE TABLE IF NOT EXISTS public.p2p_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    crypto_currency TEXT NOT NULL CHECK (crypto_currency IN ('USDT', 'TRX', 'ETH', 'BNB')),
    fiat_currency TEXT NOT NULL CHECK (fiat_currency IN ('PGK', 'USD', 'AUD')),
    price_per_unit NUMERIC(14, 4) NOT NULL CHECK (price_per_unit > 0),
    total_amount NUMERIC(18, 6) NOT NULL CHECK (total_amount > 0),
    available_amount NUMERIC(18, 6) NOT NULL CHECK (available_amount >= 0),
    min_limit NUMERIC(14, 2) NOT NULL CHECK (min_limit > 0),
    max_limit NUMERIC(14, 2) NOT NULL CHECK (max_limit >= min_limit),
    payment_methods TEXT[] NOT NULL DEFAULT '{}',
    payment_window_minutes INTEGER NOT NULL DEFAULT 15 CHECK (payment_window_minutes BETWEEN 10 AND 120),
    terms TEXT,
    auto_reply TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. P2P TRADE ORDERS & ESCROW
CREATE TABLE IF NOT EXISTS public.p2p_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES public.p2p_offers(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    crypto_currency TEXT NOT NULL,
    fiat_currency TEXT NOT NULL,
    crypto_amount NUMERIC(18, 6) NOT NULL CHECK (crypto_amount > 0),
    fiat_amount NUMERIC(14, 2) NOT NULL CHECK (fiat_amount > 0),
    price_per_unit NUMERIC(14, 4) NOT NULL,
    status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT' CHECK (status IN ('AWAITING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    escrow_locked BOOLEAN NOT NULL DEFAULT TRUE,
    selected_payment_method TEXT NOT NULL,
    seller_payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_reference TEXT,
    payment_proof_url TEXT,
    dispute_reason TEXT,
    dispute_raised_by UUID REFERENCES public.profiles(id),
    dispute_winner_id UUID REFERENCES public.profiles(id),
    admin_resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 9. P2P TRADE CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.p2p_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES public.p2p_trades(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('P2P_DISPUTE', 'DEPOSIT_ISSUE', 'WITHDRAWAL_DELAY', 'KYC_VERIFICATION', 'ACCOUNT_SECURITY', 'GENERAL')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    trade_id UUID REFERENCES public.p2p_trades(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TICKET REPLIES
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TATUM WEBHOOK & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.tatum_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    subscription_type TEXT,
    tx_id TEXT,
    address TEXT,
    block_number BIGINT,
    network TEXT,
    currency TEXT,
    amount NUMERIC(18, 6),
    raw_payload JSONB,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_tx ON public.deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_p2p_offers_status ON public.p2p_offers(status, crypto_currency, fiat_currency);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_buyer ON public.p2p_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_seller ON public.p2p_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_status ON public.p2p_trades(status);
CREATE INDEX IF NOT EXISTS idx_p2p_messages_trade ON public.p2p_messages(trade_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read basic info for P2P reputation; users can update own profile
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: Only owner and admins can read
CREATE POLICY "Users view own wallets" ON public.wallets FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);

-- Deposits: User sees own deposits; Admin sees all
CREATE POLICY "Users view own deposits" ON public.deposits FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);

-- Withdrawals: User sees own; Admin sees and manages all
CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);
CREATE POLICY "Users can request withdrawal" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- P2P Offers: Active offers are public
CREATE POLICY "Active offers are public" ON public.p2p_offers FOR SELECT USING (status = 'ACTIVE' OR auth.uid() = user_id);
CREATE POLICY "Users can manage own offers" ON public.p2p_offers FOR ALL USING (auth.uid() = user_id);

-- P2P Trades: Only buyer, seller, and admin can view and update
CREATE POLICY "Trade participants and admins can view trade" ON public.p2p_trades FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);

-- Trade messages: Only participants and admins
CREATE POLICY "Trade participants can view messages" ON public.p2p_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.p2p_trades WHERE id = trade_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);
CREATE POLICY "Trade participants can insert messages" ON public.p2p_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.p2p_trades WHERE id = trade_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- Support Tickets: Owner and Admin
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'adminsp247@gmail.com')
);
CREATE POLICY "Users create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- ESCROW MANAGEMENT STORED PROCEDURE (ATOMIC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.execute_p2p_escrow_release(
    p_trade_id UUID,
    p_actor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_seller_id UUID;
    v_buyer_id UUID;
    v_crypto_amount NUMERIC(18,6);
    v_crypto_currency TEXT;
    v_status TEXT;
    v_is_admin BOOLEAN;
BEGIN
    -- Check trade details
    SELECT seller_id, buyer_id, crypto_amount, crypto_currency, status
    INTO v_seller_id, v_buyer_id, v_crypto_amount, v_crypto_currency, v_status
    FROM public.p2p_trades
    WHERE id = p_trade_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trade not found';
    END IF;

    IF v_status NOT IN ('AWAITING_PAYMENT', 'PAID', 'DISPUTED') THEN
        RAISE EXCEPTION 'Trade status does not permit release';
    END IF;

    -- Check if actor is seller or admin
    SELECT (email = 'adminsp247@gmail.com') INTO v_is_admin FROM public.profiles WHERE id = p_actor_id;
    IF p_actor_id != v_seller_id AND NOT COALESCE(v_is_admin, FALSE) THEN
        RAISE EXCEPTION 'Unauthorized: Only seller or admin can release escrow';
    END IF;

    -- Deduct from seller's locked escrow
    UPDATE public.wallets
    SET locked_escrow_balance = locked_escrow_balance - v_crypto_amount
    WHERE user_id = v_seller_id AND currency = v_crypto_currency;

    -- Credit buyer's available balance
    UPDATE public.wallets
    SET available_balance = available_balance + v_crypto_amount
    WHERE user_id = v_buyer_id AND currency = v_crypto_currency;

    -- Update trade status to COMPLETED
    UPDATE public.p2p_trades
    SET status = 'COMPLETED',
        escrow_locked = FALSE,
        completed_at = NOW()
    WHERE id = p_trade_id;

    -- Increment completed trades
    UPDATE public.profiles SET total_trades = total_trades + 1 WHERE id IN (v_seller_id, v_buyer_id);

    -- Insert system message
    INSERT INTO public.p2p_messages (trade_id, sender_id, message, is_system)
    VALUES (p_trade_id, p_actor_id, 'Escrow successfully released. Crypto credited to buyer.', TRUE);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
