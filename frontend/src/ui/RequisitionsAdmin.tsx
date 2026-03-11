import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getRequisitions, RequisitionSummary } from '../api';

export const RequisitionsAdmin: React.FC = () => {
  const { token } = useAuth();
  const [rows, setRows] = useState<RequisitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getRequisitions(token)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load requisitions'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <section style={{ marginTop: '1.5rem' }}>
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
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Due date</th>
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
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {r.calculatedDueDate ? new Date(r.calculatedDueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '0.75rem', color: '#94a3b8' }}>
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

