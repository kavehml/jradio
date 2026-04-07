import React, { useEffect, useMemo, useState } from 'react';
import { createRvuCredit, getRvuCredits, getUsers, RvuCreditEntryDto } from '../api';
import { useAuth } from '../auth/AuthContext';

export const AdminRvuCredits: React.FC = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<RvuCreditEntryDto[]>([]);
  const [radiologists, setRadiologists] = useState<Array<{ id: number; name: string }>>([]);
  const [radiologistId, setRadiologistId] = useState<number | ''>('');
  const [creditType, setCreditType] = useState<'earned' | 'given'>('earned');
  const [amount, setAmount] = useState('1');
  const [applyDate, setApplyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [users, creditRes] = await Promise.all([getUsers(token), getRvuCredits(token)]);
      setRadiologists(
        users
          .filter((u) => u.role === 'radiologist')
          .map((u) => ({ id: u.id, name: u.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEntries(creditRes.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load RVU credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const summary = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.total += e.amount;
        if (e.creditType === 'earned') acc.earned += e.amount;
        if (e.creditType === 'given') acc.given += e.amount;
        return acc;
      },
      { total: 0, earned: 0, given: 0 }
    );
  }, [entries]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !radiologistId) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive integer.');
      return;
    }
    if (!window.confirm('Add this RVU credit entry? It will be applied to the selected date.')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createRvuCredit(token, {
        radiologistId,
        creditType,
        amount: Math.round(parsedAmount),
        applyDate,
        note: note.trim() || undefined,
      });
      setMessage('RVU credit added successfully.');
      setAmount('1');
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create RVU credit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="v3-page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 className="v3-page-title" style={{ fontSize: '1.35rem' }}>RVU credits</h1>
      <p className="v3-page-lead">
        Admin-only manual credits. Earned and given categories are tracked separately, but both add RVU to the
        radiologist's workload on the selected apply date.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="v3-rvu-pill">Total: {summary.total}</div>
        <div className="v3-rvu-pill">Earned: {summary.earned}</div>
        <div className="v3-rvu-pill">Given: {summary.given}</div>
      </div>

      {message && <p style={{ color: '#166534' }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <form onSubmit={handleCreate} className="v3-card" style={{ marginBottom: 16 }}>
        <div className="v3-card__header">Add credit entry</div>
        <div className="v3-card__body" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>
            Radiologist
            <select value={radiologistId} onChange={(e) => setRadiologistId(Number(e.target.value) || '')} required>
              <option value="">Select...</option>
              {radiologists.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={creditType} onChange={(e) => setCreditType(e.target.value as 'earned' | 'given')}>
              <option value="earned">Earned credits</option>
              <option value="given">Given credits</option>
            </select>
          </label>
          <label>
            RVU amount
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            Apply date
            <input type="date" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} required />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / context" />
          </label>
          <div>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add RVU credit'}</button>
          </div>
        </div>
      </form>

      <div className="v3-card">
        <div className="v3-card__header">Credit history</div>
        <div className="v3-card__body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <p>Loading credits…</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Apply date</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Radiologist</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Category</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ padding: 8 }}>{e.applyDate}</td>
                    <td style={{ padding: 8 }}>{e.radiologist?.name || `#${e.radiologistId}`}</td>
                    <td style={{ padding: 8, textTransform: 'capitalize' }}>{e.creditType}</td>
                    <td style={{ padding: 8 }}>{e.amount}</td>
                    <td style={{ padding: 8 }}>{e.note || '—'}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 8, color: '#64748b' }}>No credit entries yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};
