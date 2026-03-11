import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  approveRequisition,
  getImagingCategories,
  getImagingSubCategories,
  getRequisitions,
  RequisitionSummary,
  updateRequisitionImaging,
  updateRequisitionRvu,
  updateRequisitionSchedule,
} from '../api';

interface Category {
  id: number;
  name: string;
  modality: string;
  bodyPart: string;
  imagePath: string | null;
}

export const RequisitionsAdmin: React.FC = () => {
  const { token } = useAuth();
  const [rows, setRows] = useState<RequisitionSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategoryMap, setSubCategoryMap] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [localRows, setLocalRows] = useState<
    Record<number, { dueDate: string; shift: 'AM' | 'PM' | 'NIGHT' | 'NA' }>
  >({});
  const [localImaging, setLocalImaging] = useState<
    Record<number, { modality: string; categoryId: number | null; selectedSubCategories: string[] }>
  >({});

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
    if (!token) return;
    Promise.all([getImagingCategories(token), getImagingSubCategories(token)])
      .then(([cats, subs]) => {
        setCategories(cats);
        const map: Record<number, string[]> = {};
        subs.forEach((s) => {
          if (!map[s.categoryId]) map[s.categoryId] = [];
          map[s.categoryId].push(s.name);
        });
        setSubCategoryMap(map);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load categories/subcategories'));
  }, [token]);

  useEffect(() => {
    const map: Record<number, { dueDate: string; shift: 'AM' | 'PM' | 'NIGHT' | 'NA' }> = {};
    const imagingMap: Record<
      number,
      { modality: string; categoryId: number | null; selectedSubCategories: string[] }
    > = {};
    rows.forEach((r) => {
      const due = r.calculatedDueDate
        ? new Date(r.calculatedDueDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const shift: 'AM' | 'PM' | 'NIGHT' | 'NA' = r.visit?.scheduledDateTime
        ? (() => {
            const scheduled = new Date(r.visit.scheduledDateTime!).getHours();
            return scheduled >= 6 && scheduled < 14 ? 'AM' : scheduled >= 14 && scheduled < 22 ? 'PM' : 'NIGHT';
          })()
        : 'NA';
      map[r.id] = { dueDate: due, shift };
      imagingMap[r.id] = {
        modality: r.imagingItems?.[0]?.modality || '',
        categoryId: r.imagingItems?.[0]?.categoryId ?? null,
        selectedSubCategories: r.imagingItems?.[0]?.selectedSubCategories || [],
      };
    });
    setLocalRows(map);
    setLocalImaging(imagingMap);
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
                    : [
                        {
                          rvuValue: value,
                          modality: '',
                          categoryId: null,
                          selectedSubCategories: [],
                          category: null,
                        },
                      ],
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

  const handleUpdateImaging = async (id: number) => {
    if (!token) return;
    const current = localImaging[id];
    if (!current || !current.modality || current.categoryId == null) return;
    setSavingId(id);
    try {
      await updateRequisitionImaging(token, id, {
        modality: current.modality,
        categoryId: current.categoryId,
        selectedSubCategories: current.selectedSubCategories,
      });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update requisition imaging');
    } finally {
      setSavingId(null);
    }
  };

  const getCategoryOptions = (rowId: number) => {
    const currentModality = localImaging[rowId]?.modality || '';
    const opts = categories.filter((c) => c.modality === currentModality);
    const currentCatId = localImaging[rowId]?.categoryId;
    const currentCat =
      rows.find((r) => r.id === rowId)?.imagingItems?.[0]?.category ||
      categories.find((c) => c.id === currentCatId);
    if (currentCat && !opts.some((o) => o.id === currentCat.id)) {
      return [currentCat as Category, ...opts];
    }
    return opts;
  };

  const getSubCategoryOptionsForRow = (rowId: number) => {
    const categoryId = localImaging[rowId]?.categoryId;
    if (!categoryId) return localImaging[rowId]?.selectedSubCategories || [];
    const dynamic = subCategoryMap[categoryId] || [];
    const selected = localImaging[rowId]?.selectedSubCategories || [];
    return Array.from(new Set([...dynamic, ...selected]));
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
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Modality</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Subcategories</th>
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
                    {r.status === 'pending_approval' ? (
                      <select
                        value={localImaging[r.id]?.modality ?? ''}
                        onChange={(e) =>
                          setLocalImaging((prev) => ({
                            ...prev,
                            [r.id]: {
                              ...prev[r.id],
                              modality: e.target.value,
                              categoryId: null,
                              selectedSubCategories: [],
                            },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        {Array.from(new Set(categories.map((c) => c.modality))).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      r.imagingItems?.[0]?.modality || '—'
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {r.status === 'pending_approval' ? (
                      <select
                        value={localImaging[r.id]?.categoryId ?? ''}
                        onChange={(e) =>
                          setLocalImaging((prev) => ({
                            ...prev,
                            [r.id]: {
                              ...prev[r.id],
                              categoryId: Number(e.target.value),
                              selectedSubCategories: [],
                            },
                          }))
                        }
                      >
                        <option value="">Select...</option>
                        {getCategoryOptions(r.id).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      r.imagingItems?.[0]?.category?.name || '—'
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {r.status === 'pending_approval' ? (
                      <select
                        multiple
                        size={3}
                        value={localImaging[r.id]?.selectedSubCategories ?? []}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                          setLocalImaging((prev) => ({
                            ...prev,
                            [r.id]: { ...prev[r.id], selectedSubCategories: values },
                          }));
                        }}
                      >
                        {getSubCategoryOptionsForRow(r.id).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (r.imagingItems?.[0]?.selectedSubCategories || []).join(', ') || '—'
                    )}
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
                          [r.id]: { ...(prev[r.id] ?? { shift: 'NA', dueDate: e.target.value }), dueDate: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <select
                      value={localRows[r.id]?.shift ?? 'NA'}
                      onChange={(e) =>
                        setLocalRows((prev) => ({
                          ...prev,
                          [r.id]: { ...(prev[r.id] ?? { dueDate: new Date().toISOString().slice(0, 10) }), shift: e.target.value as 'AM' | 'PM' | 'NIGHT' | 'NA' },
                        }))
                      }
                    >
                      <option value="NA">N/A</option>
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
                          onClick={() => void handleUpdateImaging(r.id)}
                          style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                        >
                          {savingId === r.id ? 'Saving…' : 'Save imaging'}
                        </button>
                      )}
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
                  <td colSpan={15} style={{ padding: '0.75rem', color: '#94a3b8' }}>
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

