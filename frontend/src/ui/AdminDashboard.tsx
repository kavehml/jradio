import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  createTimeDelayOption,
  createClinic,
  createSite,
  createUser,
  getClinics,
  getSites,
  getTimeDelayOptions,
  TimeDelayOptionDto,
  getUsers,
  updateRadiologistProfile,
  UserDto,
} from '../api';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'radiologist' | 'clerical'>('radiologist');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([]);
  const [sites, setSites] = useState<{ id: number; name: string }[]>([]);
  const [newClinicName, setNewClinicName] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [timeDelayOptions, setTimeDelayOptions] = useState<TimeDelayOptionDto[]>([]);
  const [newDelayLabel, setNewDelayLabel] = useState('');
  const [newDelayHours, setNewDelayHours] = useState('');

  const subspecialtyOptions = [
    { id: 'general', label: 'General' },
    { id: 'neuroradiology', label: 'Neuroradiology' },
    { id: 'musculoskeletal_radiology', label: 'Musculoskeletal Radiology' },
    { id: 'body_imaging_abdominal_radiology', label: 'Body Imaging / Abdominal Radiology' },
    { id: 'breast_imaging', label: 'Breast Imaging' },
    { id: 'cardiothoracic_radiology', label: 'Cardiothoracic Radiology' },
    { id: 'pediatric_radiology', label: 'Pediatric Radiology' },
    { id: 'interventional_radiology', label: 'Interventional Radiology' },
    { id: 'nuclear_medicine', label: 'Nuclear Medicine' },
    { id: 'emergency_radiology', label: 'Emergency Radiology' },
    { id: 'genitourinary_radiology', label: 'Genitourinary Radiology' },
    { id: 'gastrointestinal_radiology', label: 'Gastrointestinal Radiology' },
    { id: 'vascular_radiology', label: 'Vascular Radiology' },
  ] as const;

  const normalizeSubspecialties = (subs: string[]) => {
    const mapping: Record<string, string> = {
      general_body: 'general',
      neck: 'neuroradiology',
      angio: 'vascular_radiology',
      interventional: 'interventional_radiology',
      virtual_colonoscopy: 'gastrointestinal_radiology',
      coronary: 'cardiothoracic_radiology',
    };
    return Array.from(new Set(subs.map((s) => mapping[s] ?? s)));
  };

  const loadUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const list = await getUsers(token);
      setUsers(list);
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to load users' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    const loadMeta = async () => {
      if (!token) return;
      try {
        const [clinicList, siteList, delayList] = await Promise.all([
          getClinics(token),
          getSites(token),
          getTimeDelayOptions(token),
        ]);
        setClinics(clinicList);
        setSites(siteList);
        setTimeDelayOptions(delayList);
      } catch (err) {
        setMessage({
          type: 'err',
          text: err instanceof Error ? err.message : 'Failed to load clinics/sites',
        });
      }
    };
    void loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      await loadUsers();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create user' });
    }
  };

  const handleToggleSubspecialty = async (user: UserDto, subspecialtyId: string) => {
    if (!token) return;
    if (user.role !== 'radiologist') return;
    const current = user.radiologistProfile?.subspecialties ?? [];
    const normalizedCurrent = normalizeSubspecialties(current);
    const exists = normalizedCurrent.includes(subspecialtyId);
    const next = exists
      ? normalizedCurrent.filter((s) => s !== subspecialtyId)
      : [...normalizedCurrent, subspecialtyId];
    try {
      const updated = await updateRadiologistProfile(token, user.id, {
        subspecialties: next,
        maxRvuPerShift: user.radiologistProfile?.maxRvuPerShift ?? null,
        sites: user.radiologistProfile?.sites ?? [],
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, radiologistProfile: { subspecialties: updated.subspecialties, maxRvuPerShift: updated.maxRvuPerShift, sites: updated.sites } }
            : u
        )
      );
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to update subspecialties',
      });
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newClinicName.trim()) return;
    try {
      const created = await createClinic(token, newClinicName.trim());
      setClinics((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewClinicName('');
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add clinic' });
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSiteName.trim()) return;
    try {
      const created = await createSite(token, newSiteName.trim());
      setSites((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSiteName('');
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add site' });
    }
  };

  const handleAddTimeDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const label = newDelayLabel.trim();
    const hours = Number(newDelayHours);
    if (!label || !Number.isFinite(hours) || hours <= 0) {
      setMessage({ type: 'err', text: 'Provide a valid delay label and hours' });
      return;
    }
    try {
      const created = await createTimeDelayOption(token, { label, hours });
      setTimeDelayOptions((prev) => [...prev, created].sort((a, b) => a.hours - b.hours));
      setNewDelayLabel('');
      setNewDelayHours('');
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to add time delay option',
      });
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

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Clinics</h3>
          <form onSubmit={handleAddClinic} style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={newClinicName}
              onChange={(e) => setNewClinicName(e.target.value)}
              placeholder="Add clinic name…"
              style={{ flex: 1 }}
            />
            <button type="submit" style={{ padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
              Add
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto', fontSize: '0.9rem' }}>
            {clinics.map((c) => (
              <li key={c.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
                {c.name}
              </li>
            ))}
            {clinics.length === 0 && <li style={{ color: '#94a3b8' }}>No clinics yet.</li>}
          </ul>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Sites / locations</h3>
          <form onSubmit={handleAddSite} style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              placeholder="Add site name…"
              style={{ flex: 1 }}
            />
            <button type="submit" style={{ padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
              Add
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto', fontSize: '0.9rem' }}>
            {sites.map((s) => (
              <li key={s.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
                {s.name}
              </li>
            ))}
            {sites.length === 0 && <li style={{ color: '#94a3b8' }}>No sites yet.</li>}
          </ul>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Time delay options</h3>
          <form onSubmit={handleAddTimeDelay} style={{ display: 'grid', gap: 8, marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={newDelayLabel}
              onChange={(e) => setNewDelayLabel(e.target.value)}
              placeholder='Label (e.g. "1 year")'
            />
            <input
              type="number"
              min={1}
              value={newDelayHours}
              onChange={(e) => setNewDelayHours(e.target.value)}
              placeholder="Hours (e.g. 8760)"
            />
            <button type="submit" style={{ padding: '0.4rem 0.75rem', cursor: 'pointer', justifySelf: 'start' }}>
              Add
            </button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 180, overflowY: 'auto', fontSize: '0.9rem' }}>
            {timeDelayOptions.map((opt) => (
              <li key={opt.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
                {opt.label} ({opt.hours}h)
              </li>
            ))}
            {timeDelayOptions.length === 0 && <li style={{ color: '#94a3b8' }}>No options yet.</li>}
          </ul>
        </div>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Users</h3>
        {loadingUsers ? (
          <p>Loading users…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Active</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Subspecialties (radiologists)</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{u.name}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{u.email}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', textTransform: 'capitalize' }}>{u.role}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{u.active ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      {u.role !== 'radiologist' ? (
                        <span style={{ color: '#94a3b8' }}>N/A</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {subspecialtyOptions.map((opt) => {
                            const subs = normalizeSubspecialties(u.radiologistProfile?.subspecialties ?? []);
                            const checked = subs.includes(opt.id);
                            return (
                              <label
                                key={opt.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 6px',
                                  borderRadius: 999,
                                  border: checked ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                  background: checked ? '#eff6ff' : '#f8fafc',
                                  cursor: 'pointer',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleToggleSubspecialty(u, opt.id)}
                                  style={{ margin: 0 }}
                                />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
