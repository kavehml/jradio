import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { deleteMyShift, getMyShifts, saveMyShift, ShiftDto } from '../api';

type ShiftType = 'AM' | 'PM' | 'NIGHT';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const RadiologistDashboard: React.FC = () => {
  const { token } = useAuth();
  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultSite, setDefaultSite] = useState('General');
  const [message, setMessage] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const days = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(isoDate(d));
    }
    return list;
  }, []);

  const from = days[0];
  const to = days[days.length - 1];

  const refresh = () => {
    if (!token) return;
    setLoading(true);
    getMyShifts(token, from, to)
      .then(setShifts)
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load shifts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [token, from, to]);

  const hasShift = (date: string, shiftType: ShiftType) =>
    shifts.some((s) => s.date === date && s.shiftType === shiftType);

  const onToggle = async (date: string, shiftType: ShiftType) => {
    if (!token) return;
    const key = `${date}_${shiftType}`;
    setSavingKey(key);
    setMessage(null);
    try {
      if (hasShift(date, shiftType)) {
        await deleteMyShift(token, { date, shiftType });
      } else {
        await saveMyShift(token, { date, shiftType, site: defaultSite || 'General' });
      }
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to update shift');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section style={{ maxWidth: 1040, margin: '0 auto' }}>
      <h2>Radiologist shift calendar</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        Book your AM, PM, and Night shifts for the next 14 days.
      </p>
      <div
        style={{
          background: 'white',
          padding: '1rem',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
          marginBottom: '1rem',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Default site:</span>
          <input value={defaultSite} onChange={(e) => setDefaultSite(e.target.value)} />
        </label>
        {message && <span style={{ color: '#b91c1c' }}>{message}</span>}
      </div>
      <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
        {loading ? (
          <p>Loading shifts…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>AM</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>PM</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Night</th>
                </tr>
              </thead>
              <tbody>
                {days.map((date) => (
                  <tr key={date}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      {new Date(date).toLocaleDateString()}
                    </td>
                    {(['AM', 'PM', 'NIGHT'] as ShiftType[]).map((shiftType) => {
                      const selected = hasShift(date, shiftType);
                      const key = `${date}_${shiftType}`;
                      return (
                        <td key={shiftType} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <button
                            type="button"
                            disabled={savingKey === key}
                            onClick={() => void onToggle(date, shiftType)}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: 6,
                              cursor: 'pointer',
                              border: selected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                              background: selected ? '#eff6ff' : 'white',
                            }}
                          >
                            {savingKey === key ? 'Saving…' : selected ? 'Booked' : 'Book'}
                          </button>
                        </td>
                      );
                    })}
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
