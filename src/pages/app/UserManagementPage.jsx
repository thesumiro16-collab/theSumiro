import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createClient } from '@supabase/supabase-js';
import Spinner from '../../components/ui/Spinner';

// Secondary client — registers users without logging the admin out
const adminAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Page-level permission definitions
const PERMISSION_PAGES = [
  { key: 'dashboard',      label: 'Design Catalog',    desc: 'View and manage fabric designs' },
  { key: 'shared_folders', label: 'Shared Folders',    desc: 'Manage shared folder records' },
  { key: 'inbox',          label: 'Inquiries Inbox',   desc: 'View client contact messages' },
  { key: 'ticker',         label: 'Edit Ticker',       desc: 'Edit the scrolling ticker text' },
  { key: 'settings',       label: 'Enquiry Settings',  desc: 'Configure WhatsApp and contact info' },
  { key: 'about_editor',   label: 'Story Editor',      desc: 'Edit the About Us page content' },
  { key: 'seo',            label: 'SEO Settings',      desc: 'Manage meta tags and SEO data' },
  { key: 'users',          label: 'User Management',   desc: 'Create and manage users' },
];

// Access levels: 'none' | 'read' | 'write'
const DEFAULT_PERMISSIONS = {
  dashboard: 'write',
  shared_folders: 'write',
  inbox: 'write',
  ticker: 'write',
  settings: 'write',
  about_editor: 'write',
  seo: 'none',
  users: 'none',
};

// Normalize legacy boolean values to new string format
function normalizePermValue(val) {
  if (val === true) return 'write';
  if (val === false) return 'none';
  if (val === 'read' || val === 'write' || val === 'none') return val;
  return 'none';
}

function getEffectivePermissions(profile) {
  if (!profile) return DEFAULT_PERMISSIONS;
  if (profile.role === 'admin') {
    return Object.fromEntries(PERMISSION_PAGES.map(p => [p.key, 'write']));
  }
  const raw = { ...DEFAULT_PERMISSIONS, ...(profile.permissions || {}) };
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, normalizePermValue(v)]));
}

// ── Access Level Selector Component ─────────────────────────────────────────────
const ACCESS_OPTIONS = [
  { value: 'none',  label: 'None',  color: '#9CA3AF', bg: '#F3F4F6', border: '#E5E7EB' },
  { value: 'read',  label: 'Read',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { value: 'write', label: 'Write', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' },
];

function AccessSelector({ value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--color-border)', flexShrink: 0 }}>
      {ACCESS_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: active ? opt.bg : '#FFFFFF',
              color: active ? opt.color : '#D1D5DB',
              transition: 'all 0.15s',
              opacity: disabled ? 0.5 : 1,
              borderRight: '1px solid var(--color-border)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function UserManagementPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Roles
  const [roles, setRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplay, setNewRoleDisplay] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Create user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: 'admin', domain: '@sumiro.com' });
  const [createErrors, setCreateErrors] = useState({});

  // Edit user modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: 'admin', permissions: { ...DEFAULT_PERMISSIONS } });

  // ── Data Fetching (via RPC to get emails from auth.users) ────────────────
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.rpc('get_users_with_emails');
      if (error) {
        // Fallback to direct query if RPC not yet created
        const { data: fallback, error: fallbackErr } = await supabase
          .from('user_profiles').select('*').order('created_at', { ascending: true });
        if (fallbackErr) throw fallbackErr;
        setProfiles((fallback || []).map(p => ({ ...p, email: null })));
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Quick Role Change (inline in table) ───────────────────────────────────
  const handleQuickRoleChange = async (p, newRole) => {
    if (p.id === user.id) { addToast({ type: 'error', message: 'You cannot change your own role.' }); return; }
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', p.id);
      if (error) throw error;
      const roleLabel = roles.find(r => r.name === newRole)?.display_name || newRole;
      addToast({ type: 'success', message: `${p.full_name} is now ${roleLabel}.` });
      fetchProfiles();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to update role.' });
    }
  };

  // ── Fetch Roles ────────────────────────────────────────────────────────────
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('is_system', { ascending: false }).order('name');
      if (error) throw error;
      setRoles(data || []);
    } catch {
      // Fallback if roles table doesn't exist yet (migration not run)
      setRoles([{ name: 'admin', display_name: 'Administrator', is_system: true }]);
    }
  };

  // ── Add New Role ──────────────────────────────────────────────────────────
  const handleAddRole = async () => {
    const slug = newRoleName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!slug) { addToast({ type: 'error', message: 'Role name is required.' }); return; }
    if (roles.some(r => r.name === slug)) { addToast({ type: 'error', message: `Role '${slug}' already exists.` }); return; }
    try {
      const { error } = await supabase.from('roles').insert({ name: slug, display_name: newRoleDisplay.trim() || newRoleName.trim(), description: newRoleDesc.trim() });
      if (error) throw error;
      addToast({ type: 'success', message: `Role '${newRoleDisplay.trim() || newRoleName.trim()}' created.` });
      setNewRoleName(''); setNewRoleDisplay(''); setNewRoleDesc('');
      setShowRoleModal(false);
      fetchRoles();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to create role.' });
    }
  };

  // ── Delete Custom Role ────────────────────────────────────────────────────
  const handleDeleteRole = async (r) => {
    if (r.is_system) { addToast({ type: 'error', message: 'Cannot delete built-in roles.' }); return; }
    if (!confirm(`Delete role "${r.display_name}"? Users with this role will keep it until reassigned.`)) return;
    try {
      const { error } = await supabase.from('roles').delete().eq('id', r.id);
      if (error) throw error;
      addToast({ type: 'success', message: `Role '${r.display_name}' deleted.` });
      fetchRoles();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to delete role.' });
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') { fetchProfiles(); fetchRoles(); }
    else setLoading(false);
  }, [profile]);

  // ── Access Guard ──────────────────────────────────────────────────────────
  if (profile?.role !== 'admin') {
    return (
      <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-soft)' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', maxWidth: '420px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#DC2626' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-8v6m0 5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#111827', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>
            Only administrators can manage users. Contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  // ── Build Final Email (auto-apply @sumiro.com domain) ─────────────────────
  const buildFinalEmail = () => {
    const raw = createForm.email.trim();
    if (!raw) return '';
    // If user already typed a full email with @, use it as-is
    if (raw.includes('@')) return raw;
    // Otherwise append the selected domain
    return raw + createForm.domain;
  };

  // ── Create User ───────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const finalEmail = buildFinalEmail();
    const errors = {};
    if (!createForm.fullName.trim()) errors.fullName = 'Required';
    if (!finalEmail || !finalEmail.includes('@')) errors.email = 'Valid email required';
    if (!createForm.password || createForm.password.length < 6) errors.password = 'Minimum 6 characters';
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }

    setSaving(true);
    try {
      // Use signUp via separate client (won't log out current admin)
      const { data: { user: newUser }, error: signUpError } = await adminAuthClient.auth.signUp({
        email: finalEmail,
        password: createForm.password,
        options: { data: { full_name: createForm.fullName.trim() } }
      });
      if (signUpError) throw signUpError;

      // Create matching profile in user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({ id: newUser.id, full_name: createForm.fullName.trim(), role: createForm.role, permissions: DEFAULT_PERMISSIONS });
      if (profileError) throw new Error('Auth account created but profile setup failed: ' + profileError.message);

      addToast({ type: 'success', message: `User '${createForm.fullName}' (${finalEmail}) created successfully.` });
      setCreateForm({ fullName: '', email: '', password: '', role: 'admin', domain: '@sumiro.com' });
      setShowAddModal(false);
      fetchProfiles();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to create user.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Open Edit Modal ───────────────────────────────────────────────────────
  const openEdit = (p) => {
    setEditTarget(p);
    setEditForm({
      fullName: p.full_name,
      role: p.role,
      permissions: { ...DEFAULT_PERMISSIONS, ...(p.permissions || {}) },
    });
  };

  // ── Save Edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.fullName.trim()) { addToast({ type: 'error', message: 'Full Name cannot be empty.' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editForm.fullName.trim(),
          role: editForm.role,
          permissions: editForm.role === 'admin'
            ? Object.fromEntries(PERMISSION_PAGES.map(p => [p.key, true]))
            : editForm.permissions,
        })
        .eq('id', editTarget.id);
      if (error) throw error;
      addToast({ type: 'success', message: `Profile for '${editForm.fullName}' updated.` });
      setEditTarget(null);
      fetchProfiles();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to update user.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete User ───────────────────────────────────────────────────────────
  const handleDelete = async (p) => {
    if (p.id === user.id) { addToast({ type: 'error', message: 'You cannot delete your own account.' }); return; }
    if (!window.confirm(`Permanently delete ${p.full_name}'s profile? This cannot be undone.`)) return;
    try {
      // Use SECURITY DEFINER RPC to bypass RLS for admin delete
      const { error } = await supabase.rpc('admin_delete_user_profile', { target_id: p.id });
      if (error) throw error;
      addToast({ type: 'success', message: 'User profile deleted.' });
      fetchProfiles();
    } catch (err) {
      console.error('Delete error:', err);
      addToast({ type: 'error', message: err.message || 'Failed to delete. Make sure you ran migration 016 in Supabase.' });
    }
  };

  if (loading) return <Spinner fullPage />;

  // ── Styles ────────────────────────────────────────────────────────────────
  const th = { fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#737373', letterSpacing: '0.12em', padding: '14px 20px', textAlign: 'left', borderBottom: '1.5px solid var(--color-border)', background: '#FAF9F6' };
  const td = { fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-primary)', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' };
  const inp = (err) => ({ width: '100%', boxSizing: 'border-box', background: err ? '#FFF5F5' : 'var(--color-bg-soft)', border: `1.5px solid ${err ? '#FECACA' : 'var(--color-border)'}`, borderRadius: '8px', padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-primary)', outline: 'none' });
  const label = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '7px' };

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-soft)' }}>
      <div className="admin-page-inner">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ marginBottom: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="pill-label" style={{ marginBottom: '12px', display: 'inline-flex' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', display: 'inline-block' }} />
              Access & Security
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: '#0A0A0A', lineHeight: 1.15, marginTop: '10px' }}>
              User Management
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
              Manage user accounts, roles, and configure per-page access permissions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowRoleModal(true)} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', fontSize: '12px' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281a8.62 8.62 0 011.553.896l1.233-.452c.51-.188 1.08.03 1.36.49l1.296 2.247c.277.46.17 1.05-.25 1.39l-1.02.829a8.7 8.7 0 010 1.79l1.02.83c.42.34.527.93.25 1.39l-1.296 2.247c-.28.46-.85.678-1.36.49l-1.233-.452a8.62 8.62 0 01-1.553.896l-.213 1.281c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281a8.62 8.62 0 01-1.553-.896l-1.233.452c-.51.188-1.08-.03-1.36-.49L3.34 16.14c-.277-.46-.17-1.05.25-1.39l1.02-.83a8.7 8.7 0 010-1.79l-1.02-.829c-.42-.34-.527-.93-.25-1.39l1.296-2.247c.28-.46.85-.678 1.36-.49l1.233.452a8.62 8.62 0 011.553-.896l.213-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Manage Roles
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', fontSize: '12px' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add New User
            </button>
          </div>
        </div>

        {/* ── Users Table ────────────────────────────────── */}
        <div className="animate-fade-up admin-content-card" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>User</th>
                  <th style={th}>Role</th>
                  <th style={th}>Page Permissions</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 && (
                  <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#9CA3AF', padding: '40px' }}>No users found.</td></tr>
                )}
                {profiles.map((p) => {
                  const isSelf = p.id === user.id;
                  const perms = getEffectivePermissions(p);
                  const allowedCount = Object.values(perms).filter(Boolean).length;

                  return (
                    <tr key={p.id} style={{ background: isSelf ? '#FFFDF9' : 'transparent' }}>
                      {/* User info with email */}
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: p.role === 'admin' ? '#FEF3C7' : '#F3F4F6', color: p.role === 'admin' ? '#E8890C' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-serif)', flexShrink: 0, border: `2px solid ${p.role === 'admin' ? '#FDE68A' : '#E5E7EB'}` }}>
                            {p.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {p.full_name}
                              {isSelf && <span style={{ color: '#E8890C', fontSize: '10px', fontWeight: 700, background: '#FEF9EE', border: '1px solid #F5C97A', padding: '1px 6px', borderRadius: '99px' }}>You</span>}
                            </div>
                            {p.email ? (
                              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {p.email}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '2px' }}>Run migration 017 to see email</div>
                            )}
                          </div>
                        </div>
                      </td>


                      {/* Inline Role Selector */}
                      <td style={td}>
                        <select
                          value={p.role}
                          disabled={isSelf}
                          onChange={e => handleQuickRoleChange(p, e.target.value)}
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px', fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: p.role === 'admin' ? '#B45309' : '#4B5563',
                            background: p.role === 'admin' ? '#FEF3C7' : '#F3F4F6',
                            border: `1.5px solid ${p.role === 'admin' ? '#FDE68A' : '#E5E7EB'}`,
                            padding: '5px 10px',
                            borderRadius: '8px',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            opacity: isSelf ? 0.6 : 1,
                          }}
                        >
                          {roles.map(r => <option key={r.name} value={r.name}>{r.display_name || r.name}</option>)}
                          {/* Fallback if roles table empty */}
                          {roles.length === 0 && <option value="admin">Admin</option>}
                        </select>
                      </td>

                      {/* Permissions summary */}
                      <td style={td}>
                        {p.role === 'admin' ? (
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', fontWeight: 600 }}>All pages (admin)</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {PERMISSION_PAGES.map(pg => {
                              const level = perms[pg.key] || 'none';
                              const opt = ACCESS_OPTIONS.find(o => o.value === level);
                              return (
                                <span key={pg.key} style={{ fontSize: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: opt?.bg || '#F3F4F6', color: opt?.color || '#9CA3AF', border: `1px solid ${opt?.border || '#E5E7EB'}` }}>
                                  {pg.label}{level !== 'none' ? ` (${level})` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => openEdit(p)} className="btn-outline" style={{ padding: '6px 14px', fontSize: '11px' }}>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={isSelf}
                            style={{ padding: '6px 14px', fontSize: '11px', background: '#FEE2E2', border: '1.5px solid #FCA5A5', color: '#DC2626', borderRadius: '8px', cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.4 : 1, fontFamily: 'var(--font-sans)', fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-up" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: '#1A1208' }}>Edit User Profile</h3>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name */}
              <div>
                <label style={label}>Full Name</label>
                <input type="text" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} style={inp(false)} />
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label style={label}>Email Address (Read-only)</label>
                <input type="email" value={editTarget.email || 'N/A'} disabled style={{ ...inp(false), background: '#F5F5F4', color: '#78716C', cursor: 'not-allowed', opacity: 0.8 }} />
              </div>

              {/* Role */}
              <div>
                <label style={label}>Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  disabled={editTarget.id === user.id}
                  style={{ ...inp(false), cursor: editTarget.id === user.id ? 'not-allowed' : 'pointer' }}
                >
                  {roles.map(r => <option key={r.name} value={r.name}>{r.display_name}{r.name === 'admin' ? ' — Full access to all pages' : ''}</option>)}
                  {roles.length === 0 && <option value="admin">Administrator — Full access to all pages</option>}
                </select>
                {editTarget.id === user.id && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>You cannot change your own role.</p>
                )}
              </div>

              {/* Page Permissions */}
              <div>
                <label style={{ ...label, marginBottom: '4px' }}>Page Permissions</label>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#9CA3AF', marginBottom: '14px' }}>
                  {editForm.role === 'admin'
                    ? 'Administrators always have access to all pages.'
                    : 'Toggle which pages this user can access.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', border: '1.5px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                  {PERMISSION_PAGES.map((pg, i) => (
                    <div key={pg.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: i % 2 === 0 ? '#FAFAF9' : '#FFFFFF', borderBottom: i < PERMISSION_PAGES.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#111827' }}>{pg.label}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{pg.desc}</div>
                      </div>
                      <AccessSelector
                        value={editForm.role === 'admin' ? 'write' : normalizePermValue(editForm.permissions[pg.key] ?? DEFAULT_PERMISSIONS[pg.key])}
                        onChange={(val) => setEditForm(f => ({ ...f, permissions: { ...f.permissions, [pg.key]: val } }))}
                        disabled={editForm.role === 'admin'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save / Cancel */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
                <button onClick={() => setEditTarget(null)} disabled={saving} className="btn-outline">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ───────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-up" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: '#1A1208' }}>Create New User</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={label}>Full Name *</label>
                <input type="text" value={createForm.fullName} onChange={e => { setCreateForm(f => ({ ...f, fullName: e.target.value })); setCreateErrors(e => ({ ...e, fullName: undefined })); }} placeholder="e.g. Rajesh Patel" style={inp(!!createErrors.fullName)} />
                {createErrors.fullName && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>{createErrors.fullName}</p>}
              </div>

              <div>
                <label style={label}>Email Address *</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <input type="text" value={createForm.email} onChange={e => { setCreateForm(f => ({ ...f, email: e.target.value })); setCreateErrors(e => ({ ...e, email: undefined })); }} placeholder="e.g. rajesh" style={{ ...inp(!!createErrors.email), flex: 1 }} />
                  <select
                    value={createForm.domain}
                    onChange={e => setCreateForm(f => ({ ...f, domain: e.target.value }))}
                    style={{ ...inp(false), width: 'auto', minWidth: '140px', fontSize: '12px', fontWeight: 600, color: '#B45309', background: '#FEF9EE', border: '1.5px solid #FDE68A', flexShrink: 0 }}
                  >
                    <option value="@sumiro.com">@sumiro.com</option>
                    <option value="">Custom email</option>
                  </select>
                </div>
                {createForm.email && !createForm.email.includes('@') && createForm.domain && (
                  <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>Final email: <strong>{createForm.email.trim()}{createForm.domain}</strong></p>
                )}
                {createErrors.email && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>{createErrors.email}</p>}
              </div>

              <div>
                <label style={label}>Initial Password *</label>
                <input type="password" value={createForm.password} onChange={e => { setCreateForm(f => ({ ...f, password: e.target.value })); setCreateErrors(e => ({ ...e, password: undefined })); }} placeholder="Minimum 6 characters" style={inp(!!createErrors.password)} />
                {createErrors.password && <p style={{ color: '#DC2626', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>{createErrors.password}</p>}
              </div>

              <div>
                <label style={label}>Role *</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={inp(false)}>
                  {roles.map(r => <option key={r.name} value={r.name}>{r.display_name}{r.name === 'admin' ? ' — Full access' : ''}</option>)}
                  {roles.length === 0 && <option value="admin">Administrator</option>}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} disabled={saving} className="btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Roles Modal ──────────────────────────────────────────────── */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-up" style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: '#1A1208' }}>Manage Roles</h3>
              <button onClick={() => setShowRoleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Existing Roles List */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ ...label, marginBottom: '10px' }}>Current Roles</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {roles.map(r => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: r.is_system ? '#FEF9EE' : '#F9FAFB', border: `1.5px solid ${r.is_system ? '#FDE68A' : '#E5E7EB'}`, borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {r.display_name || r.name}
                        {r.is_system && <span style={{ fontSize: '9px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: '99px', border: '1px solid #FDE68A' }}>BUILT-IN</span>}
                      </div>
                      {r.description && <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{r.description}</div>}
                      <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: '#D1D5DB', marginTop: '2px' }}>slug: {r.name}</div>
                    </div>
                    {!r.is_system && (
                      <button onClick={() => handleDeleteRole(r)} style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5', color: '#DC2626', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Delete</button>
                    )}
                  </div>
                ))}
                {roles.length === 0 && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#9CA3AF' }}>Run migration 020 in Supabase SQL Editor to enable custom roles.</p>}
              </div>
            </div>

            {/* Add New Role Form */}
            <div style={{ background: '#F9FAFB', border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <label style={{ ...label, marginBottom: '14px' }}>Create New Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ ...label, fontSize: '9px' }}>Role Name *</label>
                  <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Designer" style={inp(false)} />
                  {newRoleName && <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px', fontFamily: 'var(--font-sans)' }}>Slug: <strong>{newRoleName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}</strong></p>}
                </div>
                <div>
                  <label style={{ ...label, fontSize: '9px' }}>Display Name</label>
                  <input type="text" value={newRoleDisplay} onChange={e => setNewRoleDisplay(e.target.value)} placeholder="e.g. Fabric Designer" style={inp(false)} />
                </div>
                <div>
                  <label style={{ ...label, fontSize: '9px' }}>Description (optional)</label>
                  <input type="text" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="e.g. Can view and upload designs" style={inp(false)} />
                </div>
                <button onClick={handleAddRole} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '9px 20px', fontSize: '12px' }}>
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
