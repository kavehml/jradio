import React, { useEffect, useMemo, useState } from 'react';
import { createRvuCredit, getRvuCredits, getUsers, RvuCreditEntryDto } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useAppStrings } from '../i18n/useAppStrings';

export const AdminRvuCredits: React.FC = () => {
  const { token } = useAuth();
  const rv = useAppStrings().rvuPage;
  const tr = useAppStrings().requisitions;
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
      setError(e instanceof Error ? e.message : rv.loadFailed);
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
      setError(rv.errAmountPositive);
      return;
    }
    if (!window.confirm(rv.confirmAdd)) return;
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
      setMessage(rv.addedOk);
      setAmount('1');
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : rv.createFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="v3-page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 className="v3-page-title" style={{ fontSize: '1.35rem' }}>
        {rv.title}
      </h1>
      <p className="v3-page-lead">{rv.lead}</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="v3-rvu-pill">
          {rv.total} {summary.total}
        </div>
        <div className="v3-rvu-pill">
          {rv.earned} {summary.earned}
        </div>
        <div className="v3-rvu-pill">
          {rv.given} {summary.given}
        </div>
      </div>

      {message && <p style={{ color: '#166534' }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <form onSubmit={handleCreate} className="v3-card" style={{ marginBottom: 16 }}>
        <div className="v3-card__header">{rv.addEntry}</div>
        <div className="v3-card__body" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>
            {rv.radiologist}
            <select value={radiologistId} onChange={(e) => setRadiologistId(Number(e.target.value) || '')} required>
              <option value="">{tr.selectPlaceholder}</option>
              {radiologists.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {rv.category}
            <select value={creditType} onChange={(e) => setCreditType(e.target.value as 'earned' | 'given')}>
              <option value="earned">{rv.earnedCredits}</option>
              <option value="given">{rv.givenCredits}</option>
            </select>
          </label>
          <label>
            {rv.amount}
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            {rv.applyDate}
            <input type="date" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} required />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            {rv.noteOptional}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={rv.notePlaceholder} />
          </label>
          <div>
            <button type="submit" disabled={saving}>
              {saving ? rv.saving : rv.addCredit}
            </button>
          </div>
        </div>
      </form>

      <div className="v3-card">
        <div className="v3-card__header">{rv.history}</div>
        <div className="v3-card__body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <p>{rv.loading}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{rv.colApplyDate}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{rv.colRad}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{rv.colCategory}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{rv.colAmount}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{rv.colNote}</th>
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
                    <td colSpan={5} style={{ padding: 8, color: '#64748b' }}>
                      {rv.noEntries}
                    </td>
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
