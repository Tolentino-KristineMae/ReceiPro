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
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm font-medium">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">Settings</h1>
        <p className="text-sm text-slate-400 font-medium">Manage account holders and deduction types</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm mb-2">About These Settings</h3>
            <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
              <p><span className="text-purple-400 font-bold">Account Holders</span> are used throughout the system for assigning receipts, filtering transactions, and organizing batch claims.</p>
              <p><span className="text-orange-400 font-bold">Deduction Types</span> appear in the batch checker when calculating net amounts and generating billing summaries.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Holders Section */}
      <div className="bg-[#0f172a] border border-white/5 rounded-[32px] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Account Holders</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Manage user accounts</p>
          </div>
          <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <span className="text-purple-400 font-black text-sm">{accounts.length}</span>
            <span className="text-purple-400/60 font-medium text-xs ml-1">active</span>
          </div>
        </div>

        {/* Add Account Form */}
        <form onSubmit={handleAddAccount} className="mb-6 p-6 bg-black/20 rounded-2xl border border-white/5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Account Name
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Kristine"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-purple-500 outline-none transition-all"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Short Code (3 letters)
              </label>
              <input
                type="text"
                value={newAccountShort}
                onChange={(e) => setNewAccountShort(e.target.value.slice(0, 3))}
                placeholder="e.g., KRI"
                maxLength={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold uppercase focus:border-purple-500 outline-none transition-all"
                disabled={saving}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !newAccountName.trim() || !newAccountShort.trim()}
            className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            {saving ? 'Adding...' : 'Add Account'}
          </button>
        </form>

        {/* Accounts List */}
        <div className="space-y-2">
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No accounts configured. Add your first account above.
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-black text-sm">{account.short_code}</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{account.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                      Code: {account.short_code}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(account.name)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deduction Types Section */}
      <div className="bg-[#0f172a] border border-white/5 rounded-[32px] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Deduction Types</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Manage deduction categories</p>
          </div>
          <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <span className="text-orange-400 font-black text-sm">{deductionTypes.length}</span>
            <span className="text-orange-400/60 font-medium text-xs ml-1">types</span>
          </div>
        </div>

        {/* Add Deduction Type Form */}
        <form onSubmit={handleAddDeductionType} className="mb-6 p-6 bg-black/20 rounded-2xl border border-white/5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Deduction Label
              </label>
              <input
                type="text"
                value={newDeductionLabel}
                onChange={(e) => setNewDeductionLabel(e.target.value)}
                placeholder="e.g., Cash in Royal Cable"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-orange-500 outline-none transition-all"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Key (lowercase, no spaces)
              </label>
              <input
                type="text"
                value={newDeductionKey}
                onChange={(e) => setNewDeductionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g., royal"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold lowercase focus:border-orange-500 outline-none transition-all"
                disabled={saving}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !newDeductionLabel.trim() || !newDeductionKey.trim()}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            {saving ? 'Adding...' : 'Add Deduction Type'}
          </button>
        </form>

        {/* Deduction Types List */}
        <div className="space-y-2">
          {deductionTypes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No deduction types configured. Add your first deduction type above.
            </div>
          ) : (
            deductionTypes.map((deduction) => (
              <div
                key={deduction.key}
                className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-black text-xs">{deduction.key.slice(0, 3).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{deduction.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                      Key: {deduction.key}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDeductionType(deduction.key)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
