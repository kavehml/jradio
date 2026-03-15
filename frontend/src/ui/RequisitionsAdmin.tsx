import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { useAuth } from '../auth/AuthContext';
import {
  approveRequisition,
  createRequisitionsBulk,
  deleteRequisition,
  getImagingCategories,
  getImagingSubCategories,
  getRequisitions,
  BulkRequisitionCreateInput,
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importFailed, setImportFailed] = useState(false);

  const resolveCategoryModality = (modality: string) => {
    if (modality === 'PET' || modality === 'X-ray') return 'Other';
    return modality;
  };

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const normalizeModality = (value: unknown) => {
    const normalized = normalizeText(value);
    if (normalized === 'xray' || normalized === 'x-ray') return 'x-ray';
    return normalized;
  };

  const categoryModalityForUi = (category: Category): string => {
    if (category.modality === 'Other') {
      const upper = category.name.toUpperCase();
      if (upper.startsWith('PET ')) return 'PET';
      if (upper.startsWith('XR ')) return 'X-ray';
    }
    return category.modality;
  };

  const mergeExamNotesForCreate = (selectedSubCategories: string[], notes?: string) => {
    const cleanNotes = (notes || '').trim();
    if (!selectedSubCategories.length) return cleanNotes || undefined;
    const examBlock = `Exams:\n${selectedSubCategories.map((s) => `- ${s}`).join('\n')}`;
    return cleanNotes ? `${examBlock}\nNotes: ${cleanNotes}` : examBlock;
  };

  const toRangeName = (prefix: string, value: string) => {
    const core = value
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
    const safeCore = core || 'EMPTY';
    return `${prefix}${/^[0-9]/.test(safeCore) ? '_' : ''}${safeCore}`;
  };

  const downloadExcelTemplate = async () => {
    const columnLetter = (n: number) => {
      let value = n;
      let result = '';
      while (value > 0) {
        const mod = (value - 1) % 26;
        result = String.fromCharCode(65 + mod) + result;
        value = Math.floor((value - mod) / 26);
      }
      return result;
    };

    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('Requisitions');
    const listsSheet = workbook.addWorksheet('Lists');
    const instructionsSheet = workbook.addWorksheet('Instructions');

    const modalityValues = Array.from(
      new Set(categories.map((c) => categoryModalityForUi(c)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    listsSheet.getCell('A1').value = 'Modalities';
    modalityValues.forEach((value, idx) => {
      listsSheet.getCell(`A${idx + 2}`).value = value;
    });
    const modalityListEnd = Math.max(modalityValues.length + 1, 2);
    workbook.definedNames.add('MODALITY_LIST', `Lists!$A$2:$A$${modalityListEnd}`);

    // Build named ranges for cascading dropdowns:
    // - MOD_<MODALITY> points to that modality's categories
    // - CAT_<CATEGORY> points to that category's subcategories
    let nextListColumn = 2;
    modalityValues.forEach((modality) => {
      const modalityCategories = categories
        .filter((c) => normalizeModality(categoryModalityForUi(c)) === normalizeModality(modality))
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b));
      const letter = columnLetter(nextListColumn);
      const rangeName = toRangeName('MOD_', modality);
      listsSheet.getCell(`${letter}1`).value = rangeName;
      if (!modalityCategories.length) {
        listsSheet.getCell(`${letter}2`).value = '';
      } else {
        modalityCategories.forEach((name, idx) => {
          listsSheet.getCell(`${letter}${idx + 2}`).value = name;
        });
      }
      const end = Math.max(modalityCategories.length + 1, 2);
      workbook.definedNames.add(rangeName, `Lists!$${letter}$2:$${letter}$${end}`);
      nextListColumn += 1;
    });

    categories.forEach((category) => {
      const rangeName = toRangeName('CAT_', category.name);
      const values = Array.from(
        new Set((subCategoryMap[category.id] || []).map((s) => s.trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      const letter = columnLetter(nextListColumn);
      listsSheet.getCell(`${letter}1`).value = rangeName;
      if (!values.length) {
        listsSheet.getCell(`${letter}2`).value = '';
      } else {
        values.forEach((value, idx) => {
          listsSheet.getCell(`${letter}${idx + 2}`).value = value;
        });
      }
      const end = Math.max(values.length + 1, 2);
      workbook.definedNames.add(rangeName, `Lists!$${letter}$2:$${letter}$${end}`);
      nextListColumn += 1;
    });

    const headers = [
      'patientIdOrTempLabel',
      'patientName',
      'patientDateOfBirth',
      'isNewExternalPatient',
      'orderingDoctorName',
      'orderingClinic',
      'site',
      'dateOfRequest',
      'timeDelayPreset',
      'hasImagingWithin24h',
      'modality',
      'categoryName',
      'subCategory1',
      'subCategory2',
      'subCategory3',
      'subCategories',
      'withContrast',
      'notes',
    ];
    dataSheet.addRow(headers);
    dataSheet.addRow([
      'MRN-001',
      'Jane Doe',
      '1985-08-17',
      'FALSE',
      'Dr. Smith',
      'Downtown Clinic',
      'Jewish General Hospital',
      '2026-03-12',
      '24h',
      'FALSE',
      'CT',
      'CT HEAD',
      'CT Head C+',
      'CT C1A1',
      '',
      'CT Head C+|CT C1A1',
      'FALSE',
      'Clinical context here',
    ]);
    dataSheet.getRow(1).font = { bold: true };

    for (let row = 2; row <= 500; row += 1) {
      // Helper keys for dependent dropdown named ranges
      dataSheet.getCell(`R${row}`).value = {
        formula: `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(UPPER($K${row})," ","_"),"-","_"),"/","_"),"(",""),")","")`,
      };
      dataSheet.getCell(`S${row}`).value = {
        formula: `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(UPPER($L${row})," ","_"),"-","_"),"/","_"),"(",""),")","")`,
      };

      dataSheet.getCell(`K${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['MODALITY_LIST'],
      };
      dataSheet.getCell(`L${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT("MOD_"&$R${row})`],
      };
      dataSheet.getCell(`M${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT("CAT_"&$S${row})`],
      };
      dataSheet.getCell(`N${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT("CAT_"&$S${row})`],
      };
      dataSheet.getCell(`O${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT("CAT_"&$S${row})`],
      };
      dataSheet.getCell(`D${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
      dataSheet.getCell(`J${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
      dataSheet.getCell(`Q${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
    }

    const widthByColumn = [22, 20, 16, 18, 20, 20, 24, 16, 14, 20, 12, 24, 20, 20, 20, 26, 14, 34];
    widthByColumn.forEach((width, index) => {
      dataSheet.getColumn(index + 1).width = width;
    });
    // Hide helper columns with normalized keys.
    dataSheet.getColumn(18).hidden = true;
    dataSheet.getColumn(19).hidden = true;
    listsSheet.state = 'veryHidden';

    const helpRows: Array<[string, string, string]> = [
      ['Field', 'Required', 'Expected format'],
      ['patientIdOrTempLabel', 'Yes', 'Any identifier (MRN / temp label)'],
      ['patientName', 'No', 'Patient full name'],
      ['patientDateOfBirth', 'No', 'YYYY-MM-DD'],
      ['isNewExternalPatient', 'No', 'Dropdown TRUE/FALSE'],
      ['orderingDoctorName', 'Yes', 'Ordering doctor name'],
      ['orderingClinic', 'Yes', 'Clinic name'],
      ['site', 'Yes', 'Site/location'],
      ['dateOfRequest', 'No', 'YYYY-MM-DD'],
      ['timeDelayPreset', 'No', 'Example: 24h, 7d, 30d, 3m'],
      ['hasImagingWithin24h', 'No', 'Dropdown TRUE/FALSE'],
      ['modality', 'Yes', 'Dropdown; drives category options'],
      ['categoryName', 'Yes', 'Dropdown filtered by modality'],
      ['subCategory1/2/3', 'No', 'Dropdowns filtered by category'],
      ['subCategories', 'No', 'Optional text override; use | or comma for multiple'],
      ['withContrast', 'No', 'Dropdown TRUE/FALSE'],
      ['notes', 'No', 'Additional notes'],
    ];
    helpRows.forEach((row) => instructionsSheet.addRow(row));
    instructionsSheet.getRow(1).font = { bold: true };
    instructionsSheet.getColumn(1).width = 24;
    instructionsSheet.getColumn(2).width = 12;
    instructionsSheet.getColumn(3).width = 44;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'requisition-bulk-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportExcel = async () => {
    if (!token) return;
    if (!importFile) {
      setImportFailed(true);
      setImportResult('Please choose an Excel file before importing.');
      return;
    }
    if (!categories.length) {
      setImportFailed(true);
      setImportResult('Categories are still loading. Please wait and try again.');
      return;
    }

    setImporting(true);
    setImportResult(null);
    setImportFailed(false);

    try {
      const buffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames.includes('Requisitions')
        ? 'Requisitions'
        : workbook.SheetNames[0];
      if (!sheetName) throw new Error('No worksheet found in uploaded file.');

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) throw new Error('Uploaded sheet is empty.');

      const rowErrors: string[] = [];
      const payload: BulkRequisitionCreateInput[] = [];

      rows.forEach((row: Record<string, unknown>, index: number) => {
        const excelRowNumber = index + 2;
        const keyMap = new Map<string, unknown>();
        Object.entries(row).forEach(([k, v]) => {
          keyMap.set(normalizeText(k), v);
        });

        const readValue = (...keys: string[]) => {
          for (const key of keys) {
            const value = keyMap.get(normalizeText(key));
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim();
            }
          }
          return '';
        };

        const readBoolean = (...keys: string[]) => {
          const raw = normalizeText(readValue(...keys));
          if (!raw) return undefined;
          return raw === 'true' || raw === 'yes' || raw === '1' || raw === 'y';
        };

        const parseSubCategories = (value: string) =>
          value
            .split(/[|,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean);

        const patientIdOrTempLabel = readValue('patientIdOrTempLabel', 'patientId', 'mrn');
        const orderingDoctorName = readValue('orderingDoctorName', 'orderingDoctor', 'doctor');
        const orderingClinic = readValue('orderingClinic', 'clinic');
        const site = readValue('site', 'location');
        const modality = readValue('modality');
        const categoryName = readValue('categoryName', 'category');
        const patientName = readValue('patientName');
        const patientDateOfBirth = readValue('patientDateOfBirth', 'patientDob', 'dob');
        const dateOfRequest = readValue('dateOfRequest');
        const timeDelayPreset = readValue('timeDelayPreset', 'timeDelay');
        const notes = readValue('notes');
        const selectedSubCategories = Array.from(
          new Set(
            [
              ...parseSubCategories(readValue('subCategory1')),
              ...parseSubCategories(readValue('subCategory2')),
              ...parseSubCategories(readValue('subCategory3')),
              ...parseSubCategories(readValue('subCategories', 'subcategories')),
            ].filter(Boolean)
          )
        );
        const isNewExternalPatient = readBoolean('isNewExternalPatient') ?? false;
        const hasImagingWithin24h = readBoolean('hasImagingWithin24h');
        const withContrast = readBoolean('withContrast');

        if (
          !patientIdOrTempLabel ||
          !orderingDoctorName ||
          !orderingClinic ||
          !site ||
          !modality ||
          !categoryName
        ) {
          rowErrors.push(
            `Row ${excelRowNumber}: missing required fields (patientIdOrTempLabel, orderingDoctorName, orderingClinic, site, modality, categoryName).`
          );
          return;
        }

        const normalizedModality = normalizeModality(modality);
        const normalizedCategoryName = normalizeText(categoryName);
        const categoryMatches = categories.filter(
          (c) =>
            normalizeText(c.name) === normalizedCategoryName &&
            normalizeModality(categoryModalityForUi(c)) === normalizedModality
        );

        if (!categoryMatches.length) {
          rowErrors.push(
            `Row ${excelRowNumber}: category "${categoryName}" with modality "${modality}" was not found.`
          );
          return;
        }

        const matchedCategory = categoryMatches[0];
        payload.push({
          patientIdOrTempLabel,
          ...(patientName ? { patientName } : {}),
          ...(patientDateOfBirth ? { patientDateOfBirth } : {}),
          isNewExternalPatient,
          orderingDoctorName,
          orderingClinic,
          site,
          ...(dateOfRequest ? { dateOfRequest } : {}),
          ...(timeDelayPreset ? { timeDelayPreset } : {}),
          ...(hasImagingWithin24h !== undefined ? { hasImagingWithin24h } : {}),
          modality: categoryModalityForUi(matchedCategory),
          categoryId: matchedCategory.id,
          bodyParts: [matchedCategory.bodyPart],
          ...(withContrast !== undefined ? { withContrast } : {}),
          ...(selectedSubCategories.length ? { selectedSubCategories } : {}),
          ...(mergeExamNotesForCreate(selectedSubCategories, notes)
            ? { notes: mergeExamNotesForCreate(selectedSubCategories, notes) }
            : {}),
        });
      });

      if (!payload.length) {
        setImportFailed(true);
        setImportResult(`No valid rows to import.\n${rowErrors.slice(0, 8).join('\n')}`);
        return;
      }

      const result = await createRequisitionsBulk(token, payload);
      refresh();

      const combinedErrors = [
        ...rowErrors,
        ...result.errors.map((e) => `Server row ${e.index}: ${e.error}`),
      ];
      const successLine = `Imported ${result.createdCount}/${result.total} valid rows.`;
      const skippedLine = rowErrors.length
        ? `Skipped ${rowErrors.length} rows before upload (template/validation issues).`
        : '';
      const failedLine = result.failedCount
        ? `Server failed ${result.failedCount} rows during creation.`
        : '';
      const errorPreview = combinedErrors.length
        ? `\n${combinedErrors.slice(0, 8).join('\n')}${combinedErrors.length > 8 ? '\n...' : ''}`
        : '';

      setImportFailed(result.failedCount > 0 || rowErrors.length > 0);
      setImportResult([successLine, skippedLine, failedLine].filter(Boolean).join(' ') + errorPreview);
      setImportFile(null);
    } catch (e) {
      setImportFailed(true);
      setImportResult(e instanceof Error ? e.message : 'Failed to import Excel file.');
    } finally {
      setImporting(false);
    }
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
      <div
        style={{
          marginBottom: '0.9rem',
          padding: '0.75rem',
          border: '1px solid #f0cdb8',
          borderRadius: 10,
          background: '#f8fbff',
          display: 'grid',
          gap: '0.55rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => void downloadExcelTemplate()}>
            Download sample Excel
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            style={{ maxWidth: 320 }}
          />
          <button
            type="button"
            onClick={() => void handleImportExcel()}
            disabled={importing || !importFile}
          >
            {importing ? 'Importing…' : 'Upload to requisitions'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
          Use the template to add multiple requisitions in one upload.
        </p>
        {importResult && (
          <pre
            style={{
              margin: 0,
              padding: '0.55rem',
              borderRadius: 8,
              border: `1px solid ${importFailed ? '#fecaca' : '#bbf7d0'}`,
              background: importFailed ? '#fff1f2' : '#f0fdf4',
              color: importFailed ? '#9f1239' : '#166534',
              whiteSpace: 'pre-wrap',
              fontSize: '0.8rem',
            }}
          >
            {importResult}
          </pre>
        )}
      </div>
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

