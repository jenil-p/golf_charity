'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, Menu } from 'lucide-react';

// Clean, Modular Imports
import ReportsAndUsers from '../../components/admin/ReportsAndUsers';
import DrawEngine from '../../components/admin/DrawEngine';
import WinnerVerification from '../../components/admin/WinnerVerification';
import CharityManagement from '../../components/admin/CharityManagement';

import Loading from '@/components/ui/Loading';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
  const menuRef = useRef(null); // Ref for click-outside detection
  const router = useRouter();

  const { session, isAdmin: isAdminFromContext, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading || isAdminLoading) return;

    if (!session) {
      router.push('/login');
      setLoading(false);
      return;
    }

    if (!isAdminFromContext) {
      alert("Access Denied: Admins Only");
      router.push('/dashboard');
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    setLoading(false);

  }, [session, isAuthLoading, isAdminLoading, isAdminFromContext, router]);

  // Handle clicking outside the mobile menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <Loading message="Loading Secure Environment..." />;

  if (!isAdmin) return null;

  const tabs = [
    { id: 'overview', label: 'Overview & Users' },
    { id: 'draws', label: 'Draw Engine' },
    { id: 'verification', label: 'Winner Verification' },
    { id: 'charities', label: 'Charity Directory' },
  ];

  // Helper to get the current active tab's label
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Admin Control Center
            </h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Manage platform operations, draws, and payouts.</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="mt-6 md:mt-0 w-full md:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-center">
            Exit Admin
          </button>
        </div>

        {/* --- NAVIGATION: DESKTOP TABS --- */}
        <div className="hidden md:flex overflow-x-auto hide-scrollbar gap-6 border-b border-slate-200 pb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-4 font-bold text-base transition-all border-b-2 ${activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- NAVIGATION: MOBILE DROPDOWN MENU --- */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <Menu className="w-5 h-5 text-emerald-600" />
              {activeTabLabel}
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Content */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-4 font-bold text-sm transition-colors border-b border-slate-50 last:border-0 ${activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Content */}
        <div className="animate-in fade-in duration-500 bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-sm md:shadow-none md:p-0 border border-slate-100 md:border-none">
          {activeTab === 'overview' && <ReportsAndUsers />}
          {activeTab === 'draws' && <DrawEngine />}
          {activeTab === 'verification' && <WinnerVerification />}
          {activeTab === 'charities' && <CharityManagement />}
        </div>

      </div>
    </div>
  );
}