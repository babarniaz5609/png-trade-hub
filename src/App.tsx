import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';

import { HomeView } from './views/HomeView';
import { P2PMarketplaceView } from './views/P2PMarketplaceView';
import { WalletView } from './views/WalletView';
import { DepositView } from './views/DepositView';
import { WithdrawalView } from './views/WithdrawalView';
import { InternalTransfersView } from './views/InternalTransfersView';
import { DashboardView } from './views/DashboardView';
import { TransactionHistoryView } from './views/TransactionHistoryView';
import { SupportTicketsView } from './views/SupportTicketsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { P2PTradeRoomView } from './views/P2PTradeRoomView';

const MainLayout: React.FC = () => {
  const { activeTab, activeTradeId } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If a specific P2P Trade order is open, display trade room
  const renderContent = () => {
    if (activeTradeId) {
      return <P2PTradeRoomView />;
    }

    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'marketplace':
        return <P2PMarketplaceView />;
      case 'wallet':
        return <WalletView />;
      case 'deposit':
        return <DepositView />;
      case 'withdraw':
        return <WithdrawalView />;
      case 'transfers':
        return <InternalTransfersView />;
      case 'dashboard':
        return <DashboardView />;
      case 'history':
        return <TransactionHistoryView />;
      case 'support':
        return <SupportTicketsView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Main App Navigation */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Viewport View Container */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
