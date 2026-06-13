import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../apiConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* ─── Orange design tokens (matches rest of app) ─────────────────────────── */
const T = {
  bg:           '#fffbf5',
  panel:        '#ffffff',
  panel2:       '#fff7ed',
  border:       'rgba(251,146,60,0.18)',
  borderStrong: 'rgba(251,146,60,0.30)',
  text:         '#431407',
  text2:        '#7c2d12',
  text3:        '#9a3412',
  text4:        '#c2410c',
  muted:        'rgba(154,52,18,0.45)',
  brand:        '#f97316',
  brandDark:    '#ea580c',
  brandLight:   '#fff7ed',
  brandRing:    'rgba(249,115,22,0.20)',
  success:      '#16a34a',
  successBg:    '#dcfce7',
  danger:       '#dc2626',
  dangerBg:     '#fee2e2',
};

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = {
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Spinner: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'sp 0.7s linear infinite' }}>
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
};

/* ─── Empty state ────────────────────────────────────────────────────────── */
function EmptyState({ label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 16px', gap:'8px', color: T.muted }}>
      <div style={{
        width:'38px', height:'38px', borderRadius:'10px',
        border:`1.5px dashed ${T.borderStrong}`,
        display:'flex', alignItems:'center', justifyContent:'center', opacity:0.7,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <span style={{ fontSize:'12px', fontWeight:500 }}>No {label} yet</span>
    </div>
  );
}

/* ─── Avatar colour palette (orange-friendly) ────────────────────────────── */
const AVATAR_COLORS = [
  ['#fff7ed','#ea580c'],['#fdf4ff','#a855f7'],['#f0fdf4','#16a34a'],
  ['#fef2f2','#dc2626'],['#f0f9ff','#0284c7'],['#fff1f2','#be123c'],
];

/* ─── Account row ────────────────────────────────────────────────────────── */
function AccountRow({ account, onDelete, saving }) {
  const [bg, fg] = AVATAR_COLORS[(account.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div
      style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', borderRadius:'10px',
        background: T.panel, border:`1px solid ${T.border}`, transition:'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderStrong; e.currentTarget.style.boxShadow='0 2px 8px rgba(249,115,22,0.08)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Avatar */}
      <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:bg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'11px', fontWeight:800, color:fg, flexShrink:0, letterSpacing:'0.04em' }}>
        {account.short_code}
      </div>
      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'13px', fontWeight:600, color: T.text, lineHeight:1.3 }}>{account.name}</div>
        <div style={{ fontSize:'11px', color: T.muted, marginTop:'1px' }}>
          Code:&nbsp;<span style={{ fontFamily:'monospace', color: T.text3, fontWeight:600 }}>{account.short_code}</span>
        </div>
      </div>
      {/* Online dot */}
      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
      {/* Delete */}
      <button onClick={()=>onDelete(account.name)} disabled={saving} title="Remove"
        style={{ width:'28px', height:'28px', borderRadius:'7px', border:'1px solid transparent',
          background:'transparent', color: T.muted, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=T.dangerBg; e.currentTarget.style.borderColor='#fca5a5'; e.currentTarget.style.color=T.danger; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color=T.muted; }}
      ><Icon.Trash /></button>
    </div>
  );
}

/* ─── Deduction row ──────────────────────────────────────────────────────── */
function DeductionRow({ type, onDelete, saving }) {
  return (
    <div
      style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', borderRadius:'10px',
        background: T.panel, border:`1px solid ${T.border}`, transition:'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderStrong; e.currentTarget.style.boxShadow='0 2px 8px rgba(249,115,22,0.08)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Key badge */}
      <div style={{ padding:'3px 8px', borderRadius:'6px', background:'#fff7ed',
        color: T.brandDark, fontSize:'10px', fontWeight:700, fontFamily:'monospace',
        letterSpacing:'0.05em', flexShrink:0, textTransform:'uppercase', whiteSpace:'nowrap',
        border:`1px solid ${T.border}` }}>
        {type.key}
      </div>
      {/* Label */}
      <div style={{ flex:1, minWidth:0, fontSize:'13px', fontWeight:600, color: T.text,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {type.label}
      </div>
      {/* Delete */}
      <button onClick={()=>onDelete(type.key)} disabled={saving} title="Remove"
        style={{ width:'28px', height:'28px', borderRadius:'7px', border:'1px solid transparent',
          background:'transparent', color: T.muted, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=T.dangerBg; e.currentTarget.style.borderColor='#fca5a5'; e.currentTarget.style.color=T.danger; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color=T.muted; }}
      ><Icon.Trash /></button>
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────────────────── */
function Section({ icon: IconComp, title, subtitle, count, countLabel, children }) {
  return (
    <div style={{ background: T.panel, border:`1px solid ${T.border}`, borderRadius:'16px',
      overflow:'hidden', boxShadow:'0 1px 4px rgba(249,115,22,0.07)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 20px', borderBottom:`1px solid ${T.border}`, background: T.panel }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'#fff7ed',
            border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center',
            color: T.brand, flexShrink:0 }}>
            <IconComp />
          </div>
          <div>
            <div style={{ fontSize:'14px', fontWeight:700, color: T.text, letterSpacing:'-0.02em' }}>{title}</div>
            <div style={{ fontSize:'11px', color: T.muted, marginTop:'1px' }}>{subtitle}</div>
          </div>
        </div>
        {/* Count */}
        <div style={{ padding:'3px 10px', borderRadius:'100px', background:'#fff7ed',
          border:`1px solid ${T.border}`, fontSize:'11px', fontWeight:600, color: T.text3 }}>
          {count}&nbsp;{countLabel}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:'14px',
        background: T.bg }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Field label ────────────────────────────────────────────────────────── */
function FL({ children }) {
  return (
    <label style={{ display:'block', fontSize:'10px', fontWeight:700, color: T.text3,
      letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'5px' }}>
      {children}
    </label>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [accounts, setAccounts]         = useState([]);
  const [deductionTypes, setDeductions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  const [newAccName,  setNewAccName]   = useState('');
  const [newAccCode,  setNewAccCode]   = useState('');
  const [newDedLabel, setNewDedLabel]  = useState('');
  const [newDedKey,   setNewDedKey]    = useState('');

  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  const flash = (type, msg) => {
    if (type === 'success') {
      toast.success(msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      toast.error(msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [aR, dR] = await Promise.all([
        fetch(getApiUrl('/api/settings/accounts')),
        fetch(getApiUrl('/api/settings/deduction-types')),
      ]);
      setAccounts(aR.ok ? (await aR.json()).accounts || [] : defaultAccounts());
      setDeductions(dR.ok ? (await dR.json()).deduction_types || [] : defaultDeductions());
    } catch { setAccounts(defaultAccounts()); setDeductions(defaultDeductions()); }
    finally { setLoading(false); }
  };

  const defaultAccounts   = () => [{ name:'Kristine',short_code:'KRI'},{ name:'Nixie',short_code:'NIX'},{ name:'Babilyn',short_code:'BAB'}];
  const defaultDeductions = () => [{ key:'royal',label:'Cash in Royal Cable'},{ key:'bills',label:'Bills'},{ key:'others',label:'Others'}];

  const addAccount = async (e) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccCode.trim()) return;
    try {
      setSaving(true);
      const r = await fetch(getApiUrl('/api/settings/accounts'), {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: newAccName.trim(), short_code: newAccCode.trim().toUpperCase() }),
      });
      if (r.ok) { 
        const data = await r.json();
        setAccounts(data.accounts);
        setNewAccName(''); 
        setNewAccCode(''); 
        flash('success','Account added'); 
      } else { 
        const e = await r.json(); 
        console.log('Account add error:', e); // debug
        let errorMessage = e.message || 'Failed';
        if (e.errors) {
          const firstErrorKey = Object.keys(e.errors)[0];
          if (firstErrorKey) {
            errorMessage = e.errors[firstErrorKey][0];
          }
        }
        flash('error', errorMessage); 
      }
    } catch (err) { 
      console.error('Account add exception:', err);
      flash('error','Failed to add account'); 
    }
    finally { setSaving(false); }
  };

  const deleteAccount = async (name) => {
    setConfirmModal({
      show: true,
      message: `Remove "${name}"?`,
      onConfirm: async () => {
        try {
          setSaving(true);
          const r = await fetch(getApiUrl(`/api/settings/accounts/${encodeURIComponent(name)}`), { method:'DELETE' });
          if (r.ok) { 
            const data = await r.json();
            setAccounts(data.accounts);
            flash('success','Account removed'); 
          }
          else { 
            const e = await r.json(); 
            let errorMessage = e.message || 'Failed';
            if (e.errors) {
              const firstErrorKey = Object.keys(e.errors)[0];
              if (firstErrorKey) {
                errorMessage = e.errors[firstErrorKey][0];
              }
            }
            flash('error', errorMessage); 
          }
        } catch { flash('error','Failed'); }
        finally { 
          setSaving(false); 
          setConfirmModal({ show: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const addDeduction = async (e) => {
    e.preventDefault();
    if (!newDedLabel.trim() || !newDedKey.trim()) return;
    try {
      setSaving(true);
      const r = await fetch(getApiUrl('/api/settings/deduction-types'), {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ key: newDedKey.trim().toLowerCase(), label: newDedLabel.trim() }),
      });
      if (r.ok) { 
        const data = await r.json();
        setDeductions(data.deduction_types);
        setNewDedLabel(''); 
        setNewDedKey(''); 
        flash('success','Deduction type added'); 
      }
      else { 
        const e = await r.json(); 
        let errorMessage = e.message || 'Failed';
        if (e.errors) {
          const firstErrorKey = Object.keys(e.errors)[0];
          if (firstErrorKey) {
            errorMessage = e.errors[firstErrorKey][0];
          }
        }
        flash('error', errorMessage); 
      }
    } catch { flash('error','Failed'); }
    finally { setSaving(false); }
  };

  const deleteDeduction = async (key) => {
    const d = deductionTypes.find(x=>x.key===key);
    setConfirmModal({
      show: true,
      message: `Remove "${d?.label}"?`,
      onConfirm: async () => {
        try {
          setSaving(true);
          const r = await fetch(getApiUrl(`/api/settings/deduction-types/${encodeURIComponent(key)}`), { method:'DELETE' });
          if (r.ok) { 
            const data = await r.json();
            setDeductions(data.deduction_types);
            flash('success','Removed'); 
          }
          else { 
            const e = await r.json(); 
            let errorMessage = e.message || 'Failed';
            if (e.errors) {
              const firstErrorKey = Object.keys(e.errors)[0];
              if (firstErrorKey) {
                errorMessage = e.errors[firstErrorKey][0];
              }
            }
            flash('error', errorMessage); 
          }
        } catch { flash('error','Failed'); }
        finally { 
          setSaving(false); 
          setConfirmModal({ show: false, message: '', onConfirm: null });
        }
      }
    });
  };

  /* shared input style */
  const inp = (extra={}) => ({
    width:'100%', background: T.panel, border:`1px solid ${T.border}`,
    borderRadius:'9px', padding:'9px 12px', fontSize:'13px', color: T.text,
    fontFamily:'inherit', outline:'none', transition:'border-color 0.15s, box-shadow 0.15s',
    ...extra,
  });
  const inpFocus = e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow=`0 0 0 3px ${T.brandRing}`; };
  const inpBlur  = e => { e.target.style.borderColor = T.border; e.target.style.boxShadow='none'; };

  const submitBtn = (enabled) => ({
    display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
    padding:'9px 16px', borderRadius:'9px', border:'none',
    background: enabled ? T.brand : '#f1f5f9',
    color:      enabled ? '#ffffff' : '#94a3b8',
    fontSize:'13px', fontWeight:600, cursor: enabled ? 'pointer':'not-allowed',
    transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.01em',
    boxShadow: enabled ? '0 1px 3px rgba(249,115,22,0.30)' : 'none',
  });

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'10px', color: T.text3 }}>
        <Icon.Spinner />
        <span style={{ fontSize:'13px', fontWeight:500 }}>Loading settings…</span>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* ── Confirm Modal ── */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '400px',
            width: '100%',
            margin: '0 20px',
          }}>
            <p style={{
              color: '#431407',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              {confirmModal.message}
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes sp { to { transform:rotate(360deg); } @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* ── Page wrapper — paddingTop gives breathing room from top ── */}
      <div style={{
        maxWidth:'920px',
        margin:'0 auto',
        paddingTop:'32px',
        display:'flex',
        flexDirection:'column',
        gap:'24px',
        animation:'fadeUp 0.2s ease both',
      }}>



        {/* ── Info banner ── */}
        <div style={{
          display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px 16px',
          borderRadius:'10px', background:'#fff7ed', border:`1px solid rgba(251,146,60,0.30)`,
        }}>
          <div style={{ color: T.brand, marginTop:'1px', flexShrink:0 }}><Icon.Info /></div>
          <p style={{ fontSize:'13px', color: T.text2, lineHeight:1.6, fontWeight:500 }}>
            Changes apply instantly across the dashboard, transactions, and batch processing modules.
          </p>
        </div>

        {/* ── Two-column grid ── */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))',
          gap:'20px',
          alignItems:'start',
        }}>

          {/* ── Account Holders ── */}
          <Section icon={Icon.Users} title="Account Holders" subtitle="People who receive payments"
            count={accounts.length} countLabel={accounts.length===1?'account':'accounts'}>

            <form onSubmit={addAccount} style={{
              padding:'14px', borderRadius:'10px', background: T.panel,
              border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', gap:'10px',
            }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <div style={{ flex:1 }}>
                  <FL>Full name</FL>
                  <input type="text" value={newAccName} onChange={e=>setNewAccName(e.target.value)}
                    placeholder="e.g. Babilyn" disabled={saving}
                    style={inp()} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
                <div style={{ width:'88px' }}>
                  <FL>Code</FL>
                  <input type="text" value={newAccCode}
                    onChange={e=>setNewAccCode(e.target.value.slice(0,3).toUpperCase())}
                    placeholder="BAB" maxLength={3} disabled={saving}
                    style={inp({ textAlign:'center', fontFamily:'monospace', fontWeight:700,
                      letterSpacing:'0.08em', textTransform:'uppercase' })}
                    onFocus={inpFocus} onBlur={inpBlur} />
                </div>
              </div>
              <button type="submit"
                disabled={saving || !newAccName.trim() || !newAccCode.trim()}
                style={submitBtn(!saving && !!newAccName.trim() && !!newAccCode.trim())}
                onMouseEnter={e=>{ if(!saving&&newAccName.trim()&&newAccCode.trim()) e.currentTarget.style.background=T.brandDark; }}
                onMouseLeave={e=>{ if(!saving&&newAccName.trim()&&newAccCode.trim()) e.currentTarget.style.background=T.brand; }}
              >
                {saving ? <Icon.Spinner /> : <Icon.Plus />}
                Add account
              </button>
            </form>

            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {accounts.length===0
                ? <EmptyState label="accounts" />
                : accounts.map(a=><AccountRow key={a.name} account={a} onDelete={deleteAccount} saving={saving} />)
              }
            </div>
          </Section>

          {/* ── Deduction Types ── */}
          <Section icon={Icon.Tag} title="Deduction Types" subtitle="Transaction labels & categories"
            count={deductionTypes.length} countLabel={deductionTypes.length===1?'type':'types'}>

            <form onSubmit={addDeduction} style={{
              padding:'14px', borderRadius:'10px', background: T.panel,
              border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', gap:'10px',
            }}>
              <div style={{ display:'flex', gap:'8px' }}>
                <div style={{ flex:1 }}>
                  <FL>Label</FL>
                  <input type="text" value={newDedLabel} onChange={e=>setNewDedLabel(e.target.value)}
                    placeholder="e.g. Royal Cable" disabled={saving}
                    style={inp()} onFocus={inpFocus} onBlur={inpBlur} />
                </div>
                <div style={{ width:'108px' }}>
                  <FL>System key</FL>
                  <input type="text" value={newDedKey}
                    onChange={e=>setNewDedKey(e.target.value.toLowerCase().replace(/\s+/g,'_'))}
                    placeholder="royal" disabled={saving}
                    style={inp({ fontFamily:'monospace', fontSize:'12px' })}
                    onFocus={inpFocus} onBlur={inpBlur} />
                </div>
              </div>
              <button type="submit"
                disabled={saving || !newDedLabel.trim() || !newDedKey.trim()}
                style={submitBtn(!saving && !!newDedLabel.trim() && !!newDedKey.trim())}
                onMouseEnter={e=>{ if(!saving&&newDedLabel.trim()&&newDedKey.trim()) e.currentTarget.style.background=T.brandDark; }}
                onMouseLeave={e=>{ if(!saving&&newDedLabel.trim()&&newDedKey.trim()) e.currentTarget.style.background=T.brand; }}
              >
                {saving ? <Icon.Spinner /> : <Icon.Plus />}
                Add deduction type
              </button>
            </form>

            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {deductionTypes.length===0
                ? <EmptyState label="deduction types" />
                : deductionTypes.map(d=><DeductionRow key={d.key} type={d} onDelete={deleteDeduction} saving={saving} />)
              }
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}
