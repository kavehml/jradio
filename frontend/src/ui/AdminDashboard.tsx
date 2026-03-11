import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createUser } from '../api';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'radiologist' | 'clerical'>('radiologist');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMessage(null);
    try {
      await createUser(token, { name, email, password, role });
      setMessage({ type: 'ok', text: `User "${email}" created.` });
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create user' });
    }
  };

  return (
    <section style={{ maxWidth: 1024, margin: '0 auto' }}>
      <h2>Admin portal</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        Add radiologists, clerical staff, or other admins. Manage shifts and requisitions from here.
      </p>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Add user</h3>
        {message && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: message.type === 'ok' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'ok' ? '#166534' : '#b91c1c',
              borderRadius: 8,
              fontSize: '0.9rem',
            }}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleAddUser} style={{ display: 'grid', gap: '0.75rem', maxWidth: 400 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'radiologist' | 'clerical')}>
              <option value="radiologist">Radiologist</option>
              <option value="clerical">Clerical</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '0.25rem' }}>
            Add user
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Shifts</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Configure AM/PM/Night shifts and assign radiologists (coming next).</p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Requisition backlog</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>View backlog and redistribute (use API or future UI).</p>
        </div>
      </div>
    </section>
  );
};
