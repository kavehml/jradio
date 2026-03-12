import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  approveRequisition,
  deleteRequisition,
  getImagingCategories,
  getImagingSubCategories,
  getRequisitions,
  RequisitionSummary,
  updateRequisitionImaging,
  updateRequisitionNotes,
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

function parseSubCategoriesFromNotes(notes?: string | null): string[] {
  if (!notes) return [];
  const lines = notes.split(/\r?\n/);
  const examsIndex = lines.findIndex((l) => /^Exams:/i.test(l.trim()));
  if (examsIndex >= 0) {
    const values: string[] = [];
    const firstLineRemainder = lines[examsIndex].replace(/^Exams:\s*/i, '').trim();
    if (firstLineRemainder && !firstLineRemainder.startsWith('-')) {
      values.push(
        ...firstLineRemainder
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    for (let i = examsIndex + 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith('- ')) {
        const value = line.slice(2).trim();
        if (value) values.push(value);
        continue;
      }
      break;
    }
    if (values.length) return Array.from(new Set(values));
  }

  const legacy = notes.match(/Exams:\s*([^·\n]+)/i);
  if (!legacy?.[1]) return [];
  return legacy[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAdditionalNotes(notes?: string | null): string {
  if (!notes) return '';
  const lines = notes.split(/\r?\n/);
  const notesIndex = lines.findIndex((l) => /^Notes:/i.test(l.trim()));
  if (notesIndex >= 0) {
    const first = lines[notesIndex].replace(/^Notes:\s*/i, '').trim();
    const rest = lines.slice(notesIndex + 1).join('\n').trim();
    return [first, rest].filter(Boolean).join('\n').trim();
  }
  return notes
    .replace(/Exams:\s*([^\n]*)(\n|$)/gi, '')
    .replace(/^\s*-\s+.*$/gim, '')
    .replace(/^\s*·\s*/g, '')
    .trim();
}

function modalityForUi(item?: {
  modality: string;
  category?: { id: number; name: string } | null;
}): string {
  if (!item) return '';
  if (item.modality === 'Other') {
    const categoryName = item.category?.name?.toUpperCase() || '';
    if (categoryName.startsWith('PET ')) return 'PET';
    if (categoryName.startsWith('XR ')) return 'X-ray';
  }
  return item.modality;
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
  const [localNotes, setLocalNotes] = useState<Record<number, string>>({});
  const [subCategoryDraft, setSubCategoryDraft] = useState<Record<number, string>>({});

  const resolveCategoryModality = (modality: string) => {
    if (modality === 'PET' || modality === 'X-ray') return 'Other';
    return modality;
  };

  const buildRowImagingFromData = (r: RequisitionSummary) => {
    const item = r.imagingItems?.[0];
    const inferredCategory =
      item?.categoryId != null ? categories.find((c) => c.id === item.categoryId) : undefined;
    const inferredModality = inferredCategory
      ? inferredCategory.modality === 'Other'
        ? inferredCategory.name.toUpperCase().startsWith('PET ')
          ? 'PET'
          : inferredCategory.name.toUpperCase().startsWith('XR ')
          ? 'X-ray'
          : 'Other'
        : inferredCategory.modality
      : '';
    return {
      modality: modalityForUi(item) || inferredModality,
      categoryId: item?.categoryId ?? null,
      selectedSubCategories: parseSubCategoriesFromNotes(item?.specialNotes),
    };
  };

  const getRowImaging = (r: RequisitionSummary) => {
    return localImaging[r.id] || buildRowImagingFromData(r);
  };

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
    const notesMap: Record<number, string> = {};
    rows.forEach((r) => {
      const item = r.imagingItems?.[0];
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
        modality: modalityForUi(item),
        categoryId: item?.categoryId ?? null,
        selectedSubCategories: parseSubCategoriesFromNotes(item?.specialNotes),
      };
      notesMap[r.id] = parseAdditionalNotes(item?.specialNotes);
    });
    setLocalRows(map);
    setLocalImaging(imagingMap);
    setLocalNotes((prev) => ({ ...prev, ...notesMap }));
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
                          category: null,
                          specialNotes: null,
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
        notes: localNotes[id] || '',
      });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update requisition imaging');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateNotes = async (id: number) => {
    if (!token) return;
    setSavingId(id);
    try {
      await updateRequisitionNotes(token, id, localNotes[id] || '');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update notes');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Delete this requisition?')) return;
    setSavingId(id);
    try {
      await deleteRequisition(token, id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete requisition');
    } finally {
      setSavingId(null);
    }
  };

  const getCategoryOptions = (rowId: number) => {
    const row = rows.find((r) => r.id === rowId);
    const current = row ? getRowImaging(row) : undefined;
    const currentModality = current?.modality || '';
    const opts = categories.filter((c) => c.modality === resolveCategoryModality(currentModality));
    const currentCatId = current?.categoryId;
    const currentCat =
      rows.find((r) => r.id === rowId)?.imagingItems?.[0]?.category ||
      categories.find((c) => c.id === currentCatId);
    if (currentCat && !opts.some((o) => o.id === currentCat.id)) {
      return [currentCat as Category, ...opts];
    }
    return opts;
  };

  const getSubCategoryOptionsForRow = (rowId: number) => {
    const row = rows.find((r) => r.id === rowId);
    const current = row ? getRowImaging(row) : undefined;
    const categoryId = current?.categoryId;
    if (!categoryId) return current?.selectedSubCategories || [];
    const dynamic = subCategoryMap[categoryId] || [];
    const selected = current?.selectedSubCategories || [];
    return Array.from(new Set([...dynamic, ...selected]));
  };

  const toggleSubCategory = (rowId: number, value: string) => {
    setLocalImaging((prev) => {
      const row = rows.find((r) => r.id === rowId);
      const base =
        prev[rowId] ||
        (row
          ? buildRowImagingFromData(row)
          : { modality: '', categoryId: null, selectedSubCategories: [] });
      const exists = base.selectedSubCategories.includes(value);
      return {
        ...prev,
        [rowId]: {
          ...base,
          selectedSubCategories: exists
            ? base.selectedSubCategories.filter((s) => s !== value)
            : [...base.selectedSubCategories, value],
        },
      };
    });
  };

  const addCustomSubCategory = (rowId: number) => {
    const draft = (subCategoryDraft[rowId] || '').trim();
    if (!draft) return;
    setLocalImaging((prev) => {
      const row = rows.find((r) => r.id === rowId);
      const base =
        prev[rowId] ||
        (row
          ? buildRowImagingFromData(row)
          : { modality: '', categoryId: null, selectedSubCategories: [] });
      if (base.selectedSubCategories.includes(draft)) return prev;
      return {
        ...prev,
        [rowId]: {
          ...base,
          selectedSubCategories: [...base.selectedSubCategories, draft],
        },
      };
    });
    setSubCategoryDraft((prev) => ({ ...prev, [rowId]: '' }));
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
                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Additional notes</th>
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
                        value={getRowImaging(r).modality ?? ''}
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
                        {Array.from(
                          new Set([
                            ...categories.map((c) => c.modality),
                            getRowImaging(r).modality || '',
                          ].filter(Boolean))
                        ).map((m) => (
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
                        value={getRowImaging(r).categoryId ?? ''}
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
                      <div style={{ minWidth: 260 }}>
                        <div
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '0.4rem',
                            maxHeight: 120,
                            overflowY: 'auto',
                            display: 'grid',
                            gap: 4,
                          }}
                        >
                          {getSubCategoryOptionsForRow(r.id).length === 0 ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                              No predefined options for this category.
                            </span>
                          ) : (
                            getSubCategoryOptionsForRow(r.id).map((s) => (
                              <label
                                key={s}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={getRowImaging(r).selectedSubCategories.includes(s)}
                                  onChange={() => toggleSubCategory(r.id, s)}
                                />
                                <span>{s}</span>
                              </label>
                            ))
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <input
                            type="text"
                            placeholder="Add custom subcategory"
                            value={subCategoryDraft[r.id] || ''}
                            onChange={(e) =>
                              setSubCategoryDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomSubCategory(r.id);
                              }
                            }}
                            style={{ flex: 1, minWidth: 0 }}
                          />
                          <button type="button" onClick={() => addCustomSubCategory(r.id)}>
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      parseSubCategoriesFromNotes(r.imagingItems?.[0]?.specialNotes).join(', ') || '—'
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    {(r.specialtyRequirement?.requiredSubspecialties || ['general']).join(', ')}
                  </td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <textarea
                      value={localNotes[r.id] ?? r.imagingItems?.[0]?.specialNotes ?? ''}
                      onChange={(e) =>
                        setLocalNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      rows={2}
                      style={{ minWidth: 220 }}
                    />
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
                      <button
                        type="button"
                        disabled={savingId === r.id}
                        onClick={() => void handleUpdateNotes(r.id)}
                        style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}
                      >
                        {savingId === r.id ? 'Saving…' : 'Save notes'}
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
                      <button
                        type="button"
                        disabled={savingId === r.id}
                        onClick={() => void handleDelete(r.id)}
                        style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', color: '#b91c1c' }}
                      >
                        {savingId === r.id ? 'Saving…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={16} style={{ padding: '0.75rem', color: '#94a3b8' }}>
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

