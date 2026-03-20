import React, { useEffect, useMemo, useState } from 'react';
import {
  AssigningDistributionResult,
  AssigningSummary,
  downloadAssigningRadiologistPdf,
  distributeAssigning,
  getAssigningDistributionState,
  getAssigningRadiologistWorklist,
  getAssigningSummary,
  getShiftCoverage,
  getUsers,
  RadiologistWorklistResult,
  updateAssigningUrgentFindingsStatus,
  updateAssigningReportingStatus,
} from '../api';
import { useAuth } from '../auth/AuthContext';

type ShiftChoice = 'AM' | 'PM' | 'NIGHT' | 'NA';

interface ParticipantRow {
  radiologistId: number;
  name: string;
  weight: number;
  fromCalendar: boolean;
}

export const AssigningTab: React.FC = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<ShiftChoice>('AM');
  const [summary, setSummary] = useState<AssigningSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [allRadiologists, setAllRadiologists] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedRadiologistId, setSelectedRadiologistId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [downloadingPdfFor, setDownloadingPdfFor] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [distributionResult, setDistributionResult] = useState<AssigningDistributionResult | null>(null);
  const [activeWorklist, setActiveWorklist] = useState<RadiologistWorklistResult | null>(null);
  const [loadingWorklistFor, setLoadingWorklistFor] = useState<number | null>(null);
  const [savingReportFor, setSavingReportFor] = useState<number | null>(null);
  const [savingUrgentFor, setSavingUrgentFor] = useState<number | null>(null);

  const loadAssigningContext = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [users, coverage, summaryRes, state] = await Promise.all([
        getUsers(token),
        getShiftCoverage(token, date, date),
        getAssigningSummary(token, date, shift),
        getAssigningDistributionState(token, { date, shift }),
      ]);
      const radiologists = users
        .filter((u) => u.role === 'radiologist')
        .map((u) => ({ id: u.id, name: u.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAllRadiologists(radiologists);

      const relevantCoverage =
        shift === 'NA'
          ? coverage.filter((c) => c.date === date)
          : coverage.filter((c) => c.date === date && c.shiftType === shift);
      const byId = new Map<number, ParticipantRow>();
      relevantCoverage.forEach((entry) => {
        entry.radiologists.forEach((r) => {
          if (!byId.has(r.id)) {
            byId.set(r.id, {
              radiologistId: r.id,
              name: r.name,
              weight: 1,
              fromCalendar: true,
            });
          }
        });
      });
      const autoParticipants: ParticipantRow[] = Array.from(byId.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      if (state.participants.length) {
        setParticipants(
          state.participants.map((p) => ({
            radiologistId: p.radiologistId,
            name: p.radiologistName,
            weight: p.weight || 1,
            fromCalendar: true,
          }))
        );
        setDistributionResult(state);
      } else {
        setParticipants(autoParticipants);
        setDistributionResult(null);
      }
      setSummary(summaryRes);
      setSelectedRadiologistId(radiologists[0]?.id ?? null);
      setActiveWorklist(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assigning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAssigningContext();
  }, [token, date, shift]);

  const totalWeight = useMemo(
    () => participants.reduce((sum, p) => sum + (Number.isFinite(p.weight) && p.weight > 0 ? p.weight : 0), 0),
    [participants]
  );

  const availableToAdd = useMemo(
    () => allRadiologists.filter((u) => !participants.some((p) => p.radiologistId === u.id)),
    [allRadiologists, participants]
  );
  const activeWorklistCompletedCount = useMemo(
    () => (activeWorklist ? activeWorklist.rows.filter((r) => r.isCompleted).length : 0),
    [activeWorklist]
  );

  const addRadiologist = () => {
    if (!selectedRadiologistId) return;
    const user = allRadiologists.find((u) => u.id === selectedRadiologistId);
    if (!user) return;
    if (participants.some((p) => p.radiologistId === user.id)) return;
    setParticipants((prev) => [
      ...prev,
      { radiologistId: user.id, name: user.name, weight: 1, fromCalendar: false },
    ]);
  };

  const runDistribution = async () => {
    if (!token) return;
    if (!participants.length) {
      setError('Add at least one radiologist before distributing.');
      return;
    }
    setDistributing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await distributeAssigning(token, {
        date,
        shift,
        participants: participants.map((p) => ({
          radiologistId: p.radiologistId,
          weight: p.weight > 0 ? p.weight : 0,
        })),
      });
      setDistributionResult(result);
      setMessage(`Assigned ${result.assignedCount} requisitions across ${result.participants.length} radiologists.`);
      const refreshed = await getAssigningSummary(token, date, shift);
      setSummary(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to distribute requisitions');
    } finally {
      setDistributing(false);
    }
  };

  const handleDownloadPdf = async (radiologistId: number, radiologistName: string) => {
    if (!token) return;
    setDownloadingPdfFor(radiologistId);
    setError(null);
    try {
      const blob = await downloadAssigningRadiologistPdf(token, { date, shift, radiologistId });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = radiologistName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `requisition-worklist-${safeName}-${date}-${shift.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download PDF');
    } finally {
      setDownloadingPdfFor(null);
    }
  };

  const handleViewSchedule = async (radiologistId: number) => {
    if (!token) return;
    setLoadingWorklistFor(radiologistId);
    setError(null);
    try {
      const data = await getAssigningRadiologistWorklist(token, { date, shift, radiologistId });
      setActiveWorklist(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load worklist');
    } finally {
      setLoadingWorklistFor(null);
    }
  };

  const handleToggleReported = async (assignmentId: number, completed: boolean) => {
    if (!token || !activeWorklist) return;
    setSavingReportFor(assignmentId);
    setError(null);
    try {
      await updateAssigningReportingStatus(token, assignmentId, completed);
      setActiveWorklist((prev) =>
        prev
          ? {
              ...prev,
              rows: prev.rows.map((r) =>
                r.assignmentId === assignmentId ? { ...r, isCompleted: completed } : r
              ),
            }
          : prev
      );
      const refreshedSummary = await getAssigningSummary(token, date, shift);
      setSummary(refreshedSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update reporting status');
    } finally {
      setSavingReportFor(null);
    }
  };

  const handleToggleUrgentFindings = async (assignmentId: number, urgentFindings: boolean) => {
    if (!token || !activeWorklist) return;
    setSavingUrgentFor(assignmentId);
    setError(null);
    try {
      await updateAssigningUrgentFindingsStatus(token, assignmentId, urgentFindings);
      setActiveWorklist((prev) =>
        prev
          ? {
              ...prev,
              rows: prev.rows.map((r) =>
                r.assignmentId === assignmentId ? { ...r, hasUrgentFindings: urgentFindings } : r
              ),
            }
          : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update urgent findings status');
    } finally {
      setSavingUrgentFor(null);
    }
  };

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Assigning</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
        <label style={{ minWidth: 180 }}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label style={{ minWidth: 150 }}>
          Shift
          <select value={shift} onChange={(e) => setShift(e.target.value as ShiftChoice)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="NIGHT">Night</option>
            <option value="NA">N/A (All day)</option>
          </select>
        </label>
        <button type="button" onClick={() => void loadAssigningContext()} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
            background: '#f8fbff',
            border: '1px solid #f0cdb8',
            borderRadius: 10,
            padding: '0.75rem',
          }}
        >
          <div>Approved for slot: {summary.approvedForShiftCount}</div>
          <div>Eligible to assign: {summary.eligibleCount}</div>
          <div>Already assigned: {summary.alreadyAssignedCount}</div>
          <div>Completed (locked): {summary.completedCount ?? 0}</div>
          <div>Total eligible RVU: {summary.totalRvu}</div>
          <div>Total member weight: {totalWeight.toFixed(2)}</div>
        </div>
      )}

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', display: 'grid', gap: 10 }}>
        <strong>Radiologists for this shift</strong>
        {shift === 'NA' && (
          <p style={{ margin: 0, color: '#475569', fontSize: '0.86rem' }}>
            N/A (All day) auto-loads radiologists from AM, PM, and Night shifts on this date.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedRadiologistId ?? ''}
            onChange={(e) => setSelectedRadiologistId(e.target.value ? Number(e.target.value) : null)}
            style={{ minWidth: 260 }}
          >
            <option value="">Select radiologist</option>
            {availableToAdd.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={addRadiologist} disabled={!selectedRadiologistId}>
            Add radiologist
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Radiologist</th>
                <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Source</th>
                <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Weight</th>
                <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.radiologistId}>
                  <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.name}</td>
                  <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                    {p.fromCalendar ? 'Calendar auto-added' : 'Manual'}
                  </td>
                  <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9', maxWidth: 120 }}>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={p.weight}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setParticipants((prev) =>
                          prev.map((x) =>
                            x.radiologistId === p.radiologistId ? { ...x, weight: Number.isFinite(value) ? value : 0 } : x
                          )
                        );
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setParticipants((prev) => prev.filter((x) => x.radiologistId !== p.radiologistId))
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '0.6rem', color: '#94a3b8' }}>
                    No radiologists selected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void runDistribution()}
          disabled={distributing || participants.length === 0 || (summary?.eligibleCount ?? 0) === 0}
        >
          {distributing ? 'Distributing...' : 'Distribute / Redistribute'}
        </button>
        {message && <span style={{ color: '#166534' }}>{message}</span>}
        {error && <span style={{ color: '#b91c1c' }}>{error}</span>}
      </div>

      {distributionResult && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem' }}>
          <strong>Last distribution result</strong>
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Radiologist</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Weight</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Target RVU</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Assigned RVU</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Assigned cases</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>View schedule</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Worklist PDF</th>
                </tr>
              </thead>
              <tbody>
                {distributionResult.participants.map((p) => (
                  <tr key={p.radiologistId}>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.radiologistName}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.weight}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.targetRvu}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.assignedRvu}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{p.assignedRequisitionCount}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        disabled={loadingWorklistFor === p.radiologistId}
                        onClick={() => void handleViewSchedule(p.radiologistId)}
                      >
                        {loadingWorklistFor === p.radiologistId ? 'Loading...' : 'View list'}
                      </button>
                    </td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        disabled={downloadingPdfFor === p.radiologistId}
                        onClick={() => void handleDownloadPdf(p.radiologistId, p.radiologistName)}
                      >
                        {downloadingPdfFor === p.radiologistId ? 'Preparing...' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeWorklist && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem' }}>
          <strong>
            Worklist on page: {activeWorklist.radiologistName} ({activeWorklist.count})
          </strong>
          <div style={{ marginTop: 6, color: '#475569', fontSize: '0.92rem' }}>
            Done / Total: {activeWorklistCompletedCount} / {activeWorklist.rows.length}
          </div>
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>MRN</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>DOB</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    Reported
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    Urgent findings
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Modality</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Sub-categories</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid #e2e8f0' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activeWorklist.rows.map((r) => (
                  <tr key={r.requisitionId}>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.mrn}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.name}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.dob}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input
                        type="checkbox"
                        checked={r.isCompleted}
                        disabled={savingReportFor === r.assignmentId}
                        onChange={(e) => void handleToggleReported(r.assignmentId, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>
                      <input
                        type="checkbox"
                        checked={r.hasUrgentFindings}
                        disabled={savingUrgentFor === r.assignmentId}
                        onChange={(e) =>
                          void handleToggleUrgentFindings(r.assignmentId, e.target.checked)
                        }
                      />
                    </td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.modality}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.category}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.subCategories}</td>
                    <td style={{ padding: '0.4rem', borderBottom: '1px solid #f1f5f9' }}>{r.additionalNotes}</td>
                  </tr>
                ))}
                {activeWorklist.rows.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '0.5rem', color: '#94a3b8' }}>
                      No requisitions assigned for this radiologist in the selected date/shift.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
