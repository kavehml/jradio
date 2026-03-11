import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  approveRequisition,
  getRequisitions,
  RequisitionSummary,
  updateRequisitionRvu,
  updateRequisitionSchedule,
} from '../api';

export const RequisitionsAdmin: React.FC = () => {
  const { token } = useAuth();
  const [rows, setRows] = useState<RequisitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [localRows, setLocalRows] = useState<Record<number, { dueDate: string; shift: 'AM' | 'PM' | 'NIGHT' }>>({});

  const refresh = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getRequisitions(token)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load requisitions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [token]);

  useEffect(() => {
    const map: Record<number, { dueDate: string; shift: 'AM' | 'PM' | 'NIGHT' }> = {};
    rows.forEach((r) => {
      const due = r.calculatedDueDate
        ? new Date(r.calculatedDueDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const scheduled = r.visit?.scheduledDateTime ? new Date(r.visit.scheduledDateTime).getHours() : 8;
      const shift: 'AM' | 'PM' | 'NIGHT' =
        scheduled >= 6 && scheduled < 14 ? 'AM' : scheduled >= 14 && scheduled < 22 ? 'PM' : 'NIGHT';
      map[r.id] = { dueDate: due, shift };
    });
    setLocalRows(map);
  }, [rows]);

  const handleApprove = async (id: number) => {
    if (!token) return;
    setSavingId(id);
    try {
      await approveRequisition(token, id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve requisition');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateRvu = async (id: number, value: number) => {
    if (!token) return;
    setSavingId(id);
    try {
      await updateRequisitionRvu(token, id, value);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                imagingItems:
                  r.imagingItems && r.imagingItems.length
                    ? [{ ...r.imagingItems[0], rvuValue: value }]
                    : [{ rvuValue: value }],
              }
            : r
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update RVU');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateSchedule = async (id: number) => {
    if (!token) return;
    const current = localRows[id];
    if (!current) return;
    setSavingId(id);
    try {
      await updateRequisitionSchedule(token, id, current);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update schedule');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <h3 style={{ marginTop: 0 }}>All requisitions</h3>
      {loading && <p>Loading requisitions…</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Visit #</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Patient ID</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  Ordering doctor
                </th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Clinic</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Site</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Required specialty</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>RVU</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Due date</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Shift</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {r.visit?.visitNumber ?? '—'}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{r.patientIdOrTempLabel}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{r.orderingDoctorName}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{r.orderingClinic}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{r.site}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', textTransform: 'capitalize' }}>
                    {r.status.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {(r.specialtyRequirement?.requiredSubspecialties || ['general']).join(', ')}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      defaultValue={r.imagingItems?.[0]?.rvuValue ?? 1}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (!val || val < 1 || val > 3) return;
                        if (val === (r.imagingItems?.[0]?.rvuValue ?? 1)) return;
                        void handleUpdateRvu(r.id, val);
                      }}
                      style={{ width: 50 }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      type="date"
                      value={localRows[r.id]?.dueDate ?? ''}
                      onChange={(e) =>
                        setLocalRows((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] ?? { shift: 'AM', dueDate: e.target.value }), dueDate: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <select
                      value={localRows[r.id]?.shift ?? 'AM'}
                      onChange={(e) =>
                        setLocalRows((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] ?? { dueDate: new Date().toISOString().slice(0, 10) }), shift: e.target.value as 'AM' | 'PM' | 'NIGHT' },
                        }))
                      }
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                      <option value="NIGHT">Night</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={savingId === r.id}
                        onClick={() => void handleUpdateSchedule(r.id)}
                        style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                      >
                        {savingId === r.id ? 'Saving…' : 'Save schedule'}
                      </button>
                      {r.status === 'pending_approval' && (
                        <button
                          type="button"
                          disabled={savingId === r.id}
                          onClick={() => void handleApprove(r.id)}
                          style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                        >
                          {savingId === r.id ? 'Saving…' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: '0.75rem', color: '#94a3b8' }}>
                    No requisitions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

