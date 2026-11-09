import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppState';
import { Home } from './pages/Home';
import { ComplaintForm } from './pages/ComplaintForm';
import { StatusTracker } from './pages/StatusTracker';
import { AdminDashboard } from './pages/AdminDashboard';
import { ICPortal } from './pages/ICPortal';
import { DistrictOfficer } from './pages/DistrictOfficer';
import { DemoControls } from './components/DemoControls';
import { Scale, LogOut, Menu, X } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { currentUser, logout, loading, reconnecting } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'file-complaint':
        return <ComplaintForm onNavigate={setCurrentPage} />;
      case 'track-complaint':
        return <StatusTracker />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'ic-portal':
        return <ICPortal />;
      case 'district-officer':
        return <DistrictOfficer />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-650">Loading SakhiCommittee Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center space-x-2 text-left cursor-pointer group"
            >
              <Scale className="w-6 h-6 text-orange-500 group-hover:rotate-12 transition-transform duration-250" />
              <div>
                <span className="text-base font-extrabold tracking-tight font-serif text-white block">SakhiCommittee</span>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-widest mt-0.5">POSH Compliance</span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 text-xs uppercase font-bold tracking-wider items-center">
              <button
                onClick={() => setCurrentPage('home')}
                className={`transition ${currentPage === 'home' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
              >
                Home
              </button>
              
              <button
                onClick={() => setCurrentPage('file-complaint')}
                className={`transition ${currentPage === 'file-complaint' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
              >
                File Complaint
              </button>

              <button
                onClick={() => setCurrentPage('track-complaint')}
                className={`transition ${currentPage === 'track-complaint' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
              >
                Track Status
              </button>

              {/* Conditional Role Links */}
              {currentUser && currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentPage('admin-dashboard')}
                  className={`px-3 py-1.5 bg-slate-850 hover:bg-slate-800 rounded transition border border-slate-800 ${currentPage === 'admin-dashboard' ? 'text-orange-500 border-orange-500/50' : 'text-slate-300 hover:text-white'}`}
                >
                  Admin Panel
                </button>
              )}

              {currentUser && currentUser.role === 'ic_member' && (
                <button
                  onClick={() => setCurrentPage('ic-portal')}
                  className={`px-3 py-1.5 bg-slate-850 hover:bg-slate-800 rounded transition border border-slate-800 ${currentPage === 'ic-portal' ? 'text-orange-500 border-orange-500/50' : 'text-slate-300 hover:text-white'}`}
                >
                  IC Portal
                </button>
              )}

              {currentUser && currentUser.role === 'district_officer' && (
                <button
                  onClick={() => setCurrentPage('district-officer')}
                  className={`px-3 py-1.5 bg-slate-850 hover:bg-slate-800 rounded transition border border-slate-800 ${currentPage === 'district-officer' ? 'text-orange-500 border-orange-500/50' : 'text-slate-300 hover:text-white'}`}
                >
                  District View
                </button>
              )}

              {/* User badge */}
              {currentUser && (
                <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-normal capitalize">Logged in:</span>
                    <span className="text-[11px] text-slate-200 block font-bold truncate max-w-28">{currentUser.name.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-red-400 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-slate-300 hover:text-white transition focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-900 px-4 py-3 space-y-2 text-xs uppercase font-bold tracking-wider">
            <button
              onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => { setCurrentPage('file-complaint'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              File Complaint
            </button>
            <button
              onClick={() => { setCurrentPage('track-complaint'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              Track Status
            </button>

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => { setCurrentPage('admin-dashboard'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-orange-400"
              >
                Admin Panel
              </button>
            )}

            {currentUser && currentUser.role === 'ic_member' && (
              <button
                onClick={() => { setCurrentPage('ic-portal'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-orange-400"
              >
                IC Portal
              </button>
            )}

            {currentUser && currentUser.role === 'district_officer' && (
              <button
                onClick={() => { setCurrentPage('district-officer'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-orange-400"
              >
                District View
              </button>
            )}

            {currentUser && (
              <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-normal normal-case">
                <span>User: <strong className="text-slate-200">{currentUser.name}</strong></span>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-1 uppercase font-bold text-red-400 bg-slate-900 px-2 py-1 rounded"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}

      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>

      {/* Page Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-[11px] no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-bold text-slate-300">SakhiCommittee POSH Redressal Platform</p>
          <p className="leading-relaxed">
            Statuatory automation built in alignment with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.
          </p>
          <p className="text-[10px] text-slate-500 mt-2">
            © {new Date().getFullYear()} Vardhman Textiles Ltd. Local compliance simulator. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Reconnecting indicator while the initial load is still polling */}
      {reconnecting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-40 flex items-center space-x-2 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold px-3 py-2 rounded-full shadow-lg no-print"
        >
          <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
          <span>Reconnecting to server…</span>
        </div>
      )}

      {/* Floating Demo Clock controls */}
      <DemoControls />

    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
