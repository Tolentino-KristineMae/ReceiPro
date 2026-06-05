import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountShort, setNewAccountShort] = useState('');
  const [newDeductionLabel, setNewDeductionLabel] = useState('');
  const [newDeductionKey, setNewDeductionKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [accountsRes, deductionsRes] = await Promise.all([
        fetch(getApiUrl('/api/settings/accounts')),
        fetch(getApiUrl('/api/settings/deduction-types'))
      ]);
      
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      } else {
        // Set default accounts if API fails
        setAccounts([
          { name: 'Babilyn', short_code: 'BAB' },
          { name: 'Nixie', short_code: 'NIX' },
          { name: 'Kristine', short_code: 'KRI' }
        ]);
      }
      
      if (deductionsRes.ok) {
        const data = await deductionsRes.json();
        setDeductionTypes(data.deduction_types || []);
      } else {
        // Set default deduction types if API fails
        setDeductionTypes([
          { key: 'royal', label: 'Cash in Royal Cable' },
          { key: 'bills', label: 'Bills' },
          { key: 'others', label: 'Others' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set defaults on error
      setAccounts([
        { name: 'Babilyn', short_code: 'BAB' },
        { name: 'Nixie', short_code: 'NIX' },
        { name: 'Kristine', short_code: 'KRI' }
      ]);
      setDeductionTypes([
        { key: 'royal', label: 'Cash in Royal Cable' },
        { key: 'bills', label: 'Bills' },
        { key: 'others', label: 'Others' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountShort.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(getApiUrl('/api/settings/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccountName.trim(),
          short_code: newAccountShort.trim().toUpperCase()
        })
      });

      if (response.ok) {
        setNewAccountName('');
        setNewAccountShort('');
        await loadSettings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add account');
      }
    } catch (error) {
      console.error('Failed to add account:', error);
      alert('Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (accountName) => {
    if (!confirm(`Are you sure you want to delete the account "${accountName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(getApiUrl(`/api/settings/accounts/${encodeURIComponent(accountName)}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSettings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeductionType = async (e) => {
    e.preventDefault();
    if (!newDeductionLabel.trim() || !newDeductionKey.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(getApiUrl('/api/settings/deduction-types'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newDeductionKey.trim().toLowerCase(),
          label: newDeductionLabel.trim()
        })
      });

      if (response.ok) {
        setNewDeductionLabel('');
        setNewDeductionKey('');
        await loadSettings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add deduction type');
      }
    } catch (error) {
      console.error('Failed to add deduction type:', error);
      alert('Failed to add deduction type');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeductionType = async (key) => {
    const deduction = deductionTypes.find(d => d.key === key);
    if (!confirm(`Are you sure you want to delete the deduction type "${deduction?.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(getApiUrl(`/api/settings/deduction-types/${encodeURIComponent(key)}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSettings();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete deduction type');
      }
    } catch (error) {
      console.error('Failed to delete deduction type:', error);
      alert('Failed to delete deduction type');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          <div className="text-orange-950/60 text-sm font-black uppercase tracking-widest animate-pulse">
            Configuring System...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-orange-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-f97316 flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-orange-950 tracking-tight">Settings</h1>
          </div>
          <p className="text-orange-700/60 font-semibold uppercase tracking-[0.15em] text-[11px] ml-1">Configuration & Preferences</p>
        </div>
        
        <div className="flex items-center gap-4 bg-orange-50/50 border border-orange-100 px-5 py-3 rounded-2xl">
          <div className="text-right">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">System Status</p>
            <p className="text-sm font-black text-orange-600">Operational</p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[32px] p-8 text-white shadow-xl shadow-orange-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="relative z-10 flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Configuration Hub</h3>
            <p className="text-orange-50 font-medium leading-relaxed max-w-2xl opacity-90">
              Personalize your workspace by managing account holders and transaction labels. 
              Changes applied here will instantly synchronize across your dashboard and reporting modules.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Account Holders Card */}
        <div className="bg-white border border-orange-100 rounded-[40px] p-10 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-orange-950 tracking-tight">Account Holders</h2>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.2em] mt-0.5">Active Users</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-xs font-black uppercase tracking-widest">
              {accounts.length} Profiles
            </div>
          </div>

          <form onSubmit={handleAddAccount} className="bg-orange-50/30 border border-orange-100 p-6 rounded-3xl mb-10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800/60 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Babilyn"
                  className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-orange-950 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800/60 uppercase tracking-widest ml-1">Short Code</label>
                <input
                  type="text"
                  value={newAccountShort}
                  onChange={(e) => setNewAccountShort(e.target.value.slice(0, 3))}
                  placeholder="BAB"
                  maxLength={3}
                  className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-orange-950 text-sm font-bold uppercase focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm text-center tracking-widest"
                  disabled={saving}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newAccountName.trim() || !newAccountShort.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-200 disabled:to-orange-300 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
            >
              {saving ? 'Creating...' : 'Add Account Profile'}
            </button>
          </form>

          <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {accounts.map((account) => (
              <div key={account.name} className="flex items-center justify-between p-5 bg-white border border-orange-50 rounded-3xl group hover:border-orange-200 hover:shadow-md hover:shadow-orange-50 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center text-orange-600 font-black text-sm border border-orange-100 shadow-inner">
                    {account.short_code}
                  </div>
                  <div>
                    <div className="text-base font-black text-orange-950">{account.name}</div>
                    <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Primary Account</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(account.name)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-orange-200 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Deduction Types Card */}
        <div className="bg-white border border-orange-100 rounded-[40px] p-10 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-orange-950 tracking-tight">Deduction Types</h2>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.2em] mt-0.5">Transaction Labels</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-xs font-black uppercase tracking-widest">
              {deductionTypes.length} Types
            </div>
          </div>

          <form onSubmit={handleAddDeductionType} className="bg-orange-50/30 border border-orange-100 p-6 rounded-3xl mb-10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800/60 uppercase tracking-widest ml-1">Label</label>
                <input
                  type="text"
                  value={newDeductionLabel}
                  onChange={(e) => setNewDeductionLabel(e.target.value)}
                  placeholder="e.g. Royal Cable"
                  className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-orange-950 text-sm font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-orange-800/60 uppercase tracking-widest ml-1">System Key</label>
                <input
                  type="text"
                  value={newDeductionKey}
                  onChange={(e) => setNewDeductionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="royal_cable"
                  className="w-full bg-white border border-orange-200 rounded-2xl px-5 py-4 text-orange-950 text-sm font-bold lowercase focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all shadow-sm tracking-wide"
                  disabled={saving}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newDeductionLabel.trim() || !newDeductionKey.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-200 disabled:to-orange-300 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
            >
              {saving ? 'Registering...' : 'Add Deduction Category'}
            </button>
          </form>

          <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {deductionTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between p-5 bg-white border border-orange-50 rounded-3xl group hover:border-orange-200 hover:shadow-md hover:shadow-orange-50 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center text-orange-600 font-black text-[10px] uppercase border border-orange-100 shadow-inner px-2 text-center">
                    {type.key.slice(0, 4)}
                  </div>
                  <div>
                    <div className="text-base font-black text-orange-950">{type.label}</div>
                    <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Key: {type.key}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDeductionType(type.key)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-orange-200 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffedd5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #fed7aa;
        }
      `}} />
    </div>
  );
}
