import React, { useEffect, useMemo, useState } from 'react';
import {
  deleteMyShift,
  getMyShifts,
  getShiftCoverage,
  getUsers,
  saveMyShift,
  ShiftCoverageDto,
  ShiftDto,
  UserDto,
} from '../api';
import { useAuth } from '../auth/AuthContext';

type ShiftType = 'AM' | 'PM' | 'NIGHT';

const SHIFT_TYPES: ShiftType[] = ['AM', 'PM', 'NIGHT'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { start, end };
}

function buildCalendarGrid(anchor: Date) {
  const { start } = monthRange(anchor);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export const RadiologistDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()));
  const [defaultSite, setDefaultSite] = useState('General');
  const [radiologists, setRadiologists] = useState<UserDto[]>([]);
  const [selectedRadiologistId, setSelectedRadiologistId] = useState<number | null>(null);
  const [myShifts, setMyShifts] = useState<ShiftDto[]>([]);
  const [coverage, setCoverage] = useState<ShiftCoverageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localMaxRvu, setLocalMaxRvu] = useState<Record<string, string>>({});

  const calendarDays = useMemo(() => buildCalendarGrid(monthAnchor), [monthAnchor]);
  const { start, end } = useMemo(() => monthRange(monthAnchor), [monthAnchor]);
  const from = toIsoDate(start);
  const to = toIsoDate(end);
  const targetRadiologistId = isAdmin ? selectedRadiologistId : null;

  const myShiftMap = useMemo(() => {
    const map = new Map<string, ShiftDto>();
    myShifts.forEach((s) => map.set(`${s.date}_${s.shiftType}`, s));
    return map;
  }, [myShifts]);

  const coverageMap = useMemo(() => {
    const map = new Map<string, ShiftCoverageDto>();
    coverage.forEach((c) => map.set(`${c.date}_${c.shiftType}`, c));
    return map;
  }, [coverage]);

  const refresh = () => {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    Promise.all([
      getMyShifts(token, from, to, targetRadiologistId ?? undefined),
      getShiftCoverage(token, from, to),
    ])
      .then(([mine, teamCoverage]) => {
        setMyShifts(mine);
        setCoverage(teamCoverage);
        const seed: Record<string, string> = {};
        mine.forEach((s) => {
          seed[`${s.date}_${s.shiftType}`] = s.maxRvu != null ? String(s.maxRvu) : '';
        });
        setLocalMaxRvu(seed);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load shifts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [token, from, to, targetRadiologistId]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    getUsers(token)
      .then((users) => {
        const radiologistUsers = users.filter((u) => u.role === 'radiologist');
        setRadiologists(radiologistUsers);
        if (!selectedRadiologistId && radiologistUsers.length) {
          setSelectedRadiologistId(radiologistUsers[0].id);
        }
      })
      .catch((e) =>
        setMessage(e instanceof Error ? e.message : 'Failed to load radiologists')
      );
  }, [token, isAdmin]);

  const isMine = (date: string, shiftType: ShiftType) => myShiftMap.has(`${date}_${shiftType}`);

  const toggleShift = async (date: string, shiftType: ShiftType) => {
    if (!token) return;
    if (isAdmin && !targetRadiologistId) {
      setMessage('Select a radiologist first.');
      return;
    }
    const key = `${date}_${shiftType}`;
    setSavingKey(key);
    setMessage(null);
    try {
      if (isMine(date, shiftType)) {
        await deleteMyShift(token, {
          date,
          shiftType,
          ...(targetRadiologistId ? { radiologistId: targetRadiologistId } : {}),
        });
      } else {
        const rawMax = localMaxRvu[key];
        const maxRvu = rawMax && Number.isFinite(Number(rawMax)) ? Number(rawMax) : null;
        await saveMyShift(token, {
          date,
          shiftType,
          site: defaultSite || 'General',
          maxRvu,
          ...(targetRadiologistId ? { radiologistId: targetRadiologistId } : {}),
        });
      }
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to update shift');
    } finally {
      setSavingKey(null);
    }
  };

  const saveCapacity = async (date: string, shiftType: ShiftType) => {
    if (!token) return;
    if (isAdmin && !targetRadiologistId) {
      setMessage('Select a radiologist first.');
      return;
    }
    const key = `${date}_${shiftType}`;
    if (!isMine(date, shiftType)) return;
    setSavingKey(`${key}_capacity`);
    setMessage(null);
    try {
      const rawMax = localMaxRvu[key];
      const maxRvu = rawMax && Number.isFinite(Number(rawMax)) ? Number(rawMax) : null;
      await saveMyShift(token, {
        date,
        shiftType,
        site: defaultSite || 'General',
        maxRvu,
        ...(targetRadiologistId ? { radiologistId: targetRadiologistId } : {}),
      });
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to update RVU capacity');
    } finally {
      setSavingKey(null);
    }
  };

  const monthName = monthAnchor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section style={{ maxWidth: 1320, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Radiologist Shift Calendar</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Calendar-style booking with team coverage and RVU capacity per shift.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            Previous
          </button>
          <strong style={{ minWidth: 160, textAlign: 'center' }}>{monthName}</strong>
          <button type="button" onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            Next
          </button>
        </div>
      </div>

      {isAdmin && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 440 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: '#64748b', fontSize: '0.84rem' }}>
              Book shifts for radiologist
            </span>
            <select
              value={selectedRadiologistId ?? ''}
              onChange={(e) => setSelectedRadiologistId(Number(e.target.value))}
            >
              <option value="">Select radiologist...</option>
              {radiologists.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="calendar-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 14, marginTop: 14 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} style={{ padding: '0.6rem', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '0.84rem' }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {calendarDays.map((d) => {
              const date = toIsoDate(d);
              const inMonth = d.getMonth() === monthAnchor.getMonth();
              const active = date === selectedDate;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  style={{
                    borderRadius: 0,
                    border: '1px solid #eef2f7',
                    borderLeft: 'none',
                    borderTop: 'none',
                    background: active ? '#eef2ff' : inMonth ? 'white' : '#f8fafc',
                    color: '#0f172a',
                    textAlign: 'left',
                    padding: '0.5rem',
                    minHeight: 118,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6, color: inMonth ? '#111827' : '#94a3b8' }}>
                    {d.getDate()}
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {SHIFT_TYPES.map((shiftType) => {
                      const cov = coverageMap.get(`${date}_${shiftType}`);
                      const mine = isMine(date, shiftType);
                      return (
                        <div
                          key={shiftType}
                          style={{
                            border: mine ? '1px solid #5b63f6' : '1px solid #dbe2f0',
                            borderRadius: 8,
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            background: mine ? 'rgba(91,99,246,0.12)' : '#f8fafc',
                            color: mine ? '#404ad8' : '#334155',
                          }}
                        >
                          {shiftType}: {cov?.radiologistCount || 0} R / {cov?.totalMaxRvu || 0} RVU
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '0.9rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: '0.84rem' }}>Default Site</span>
            <input value={defaultSite} onChange={(e) => setDefaultSite(e.target.value)} />
          </label>
          {message && (
            <div style={{ marginBottom: 10, color: '#b91c1c', fontSize: '0.85rem' }}>
              {message}
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {SHIFT_TYPES.map((shiftType) => {
              const key = `${selectedDate}_${shiftType}`;
              const mine = isMine(selectedDate, shiftType);
              const cov = coverageMap.get(key);
              return (
                <div key={shiftType} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.7rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong>{shiftType}</strong>
                    <button
                      type="button"
                      disabled={savingKey === key}
                      onClick={() => void toggleShift(selectedDate, shiftType)}
                    >
                      {savingKey === key ? 'Saving...' : mine ? 'Remove me' : 'Book me'}
                    </button>
                  </div>
                  <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.82rem' }}>
                    Team: {cov?.radiologistCount || 0} radiologists • Capacity: {cov?.totalMaxRvu || 0} RVU
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(cov?.radiologists || []).map((r) => (
                      <span
                        key={r.id}
                        style={{
                          border: '1px solid #dbe2f0',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          background: '#f8fafc',
                        }}
                      >
                        {r.name}
                        {r.maxRvu != null ? ` (${r.maxRvu})` : ''}
                      </span>
                    ))}
                    {!cov?.radiologists?.length && (
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        No radiologists booked yet.
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
                    <input
                      type="number"
                      min={0}
                      placeholder={isAdmin ? 'Selected radiologist max RVU' : 'My max RVU for this shift'}
                      value={localMaxRvu[key] ?? ''}
                      onChange={(e) => setLocalMaxRvu((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                    <button
                      type="button"
                      disabled={!mine || savingKey === `${key}_capacity`}
                      onClick={() => void saveCapacity(selectedDate, shiftType)}
                    >
                      {savingKey === `${key}_capacity` ? 'Saving...' : 'Save RVU'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading shifts...</p>}
    </section>
  );
};
