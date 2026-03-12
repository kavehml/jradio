const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

export function getApiBase(): string {
  return API_BASE.replace(/\/$/, '');
}

export async function login(email: string, password: string) {
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Login failed');
  }
  return res.json() as Promise<{ token: string; user: { id: number; name: string; email: string; role: string } }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${getApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json() as Promise<{ user: { id: number; role: string; name: string } }>;
}

export async function createUser(
  token: string,
  data: { name: string; email: string; password: string; role: string }
) {
  const res = await fetch(`${getApiBase()}/api/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create user');
  }
  return res.json();
}

export interface RadiologistProfileDto {
  subspecialties: string[];
  maxRvuPerShift: number | null;
  sites: string[];
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  radiologistProfile: RadiologistProfileDto | null;
}

export async function getUsers(token: string) {
  const res = await fetch(`${getApiBase()}/api/auth/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load users');
  }
  const json = (await res.json()) as { users: UserDto[] };
  return json.users;
}

export async function updateRadiologistProfile(
  token: string,
  userId: number,
  data: { subspecialties: string[]; maxRvuPerShift?: number | null; sites?: string[] }
) {
  const res = await fetch(`${getApiBase()}/api/auth/users/${userId}/radiologist-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update radiologist profile');
  }
  return res.json() as Promise<RadiologistProfileDto & { id: number; userId: number }>;
}

export async function getImagingCategories(token: string) {
  const res = await fetch(`${getApiBase()}/api/imaging-categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json() as Promise<
    { id: number; name: string; modality: string; bodyPart: string; imagePath: string | null }[]
  >;
}

export async function getPublicImagingCategories() {
  const res = await fetch(`${getApiBase()}/api/imaging-categories/public`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json() as Promise<
    { id: number; name: string; modality: string; bodyPart: string; imagePath: string | null }[]
  >;
}

export interface ImagingSubCategoryDto {
  id: number;
  categoryId: number;
  name: string;
}

export interface TimeDelayOptionDto {
  id: number;
  code: string;
  label: string;
  hours: number;
}

export async function getImagingSubCategories(token: string) {
  const res = await fetch(`${getApiBase()}/api/imaging-categories/subcategories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load subcategories');
  const json = (await res.json()) as { subCategories: ImagingSubCategoryDto[] };
  return json.subCategories;
}

export async function getPublicImagingSubCategories() {
  const res = await fetch(`${getApiBase()}/api/imaging-categories/subcategories/public`);
  if (!res.ok) throw new Error('Failed to load subcategories');
  const json = (await res.json()) as { subCategories: ImagingSubCategoryDto[] };
  return json.subCategories;
}

export async function createImagingSubCategory(token: string, categoryId: number, name: string) {
  const res = await fetch(`${getApiBase()}/api/imaging-categories/${categoryId}/subcategories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create subcategory');
  }
  return res.json() as Promise<ImagingSubCategoryDto>;
}

export async function createRequisition(
  token: string,
  data: {
    patientIdOrTempLabel: string;
    patientName?: string;
    patientDateOfBirth?: string;
    isNewExternalPatient: boolean;
    orderingDoctorName: string;
    orderingClinic: string;
    site: string;
    dateOfRequest?: string;
    timeDelayPreset?: string;
    hasImagingWithin24h?: boolean;
    categoryId: number;
    modality: string;
    bodyParts: string[];
    withContrast?: boolean;
    notes?: string;
    selectedSubCategories?: string[];
  }
) {
  const res = await fetch(`${getApiBase()}/api/requisitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create requisition');
  }
  return res.json();
}

export async function createPublicRequisition(
  data: {
    patientIdOrTempLabel: string;
    patientName?: string;
    patientDateOfBirth?: string;
    isNewExternalPatient: boolean;
    orderingDoctorName: string;
    orderingClinic: string;
    site: string;
    dateOfRequest?: string;
    timeDelayPreset?: string;
    hasImagingWithin24h?: boolean;
    categoryId: number;
    modality: string;
    bodyParts: string[];
    withContrast?: boolean;
    notes?: string;
    selectedSubCategories?: string[];
  }
) {
  const res = await fetch(`${getApiBase()}/api/requisitions/public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create requisition');
  }
  return res.json();
}

export async function getClinics(token: string) {
  const res = await fetch(`${getApiBase()}/api/meta/clinics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load clinics');
  const json = (await res.json()) as { clinics: { id: number; name: string }[] };
  return json.clinics;
}

export async function getPublicClinics() {
  const res = await fetch(`${getApiBase()}/api/meta/public/clinics`);
  if (!res.ok) throw new Error('Failed to load clinics');
  const json = (await res.json()) as { clinics: { id: number; name: string }[] };
  return json.clinics;
}

export async function createClinic(token: string, name: string) {
  const res = await fetch(`${getApiBase()}/api/meta/clinics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create clinic');
  }
  return res.json() as Promise<{ id: number; name: string }>;
}

export async function getSites(token: string) {
  const res = await fetch(`${getApiBase()}/api/meta/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load sites');
  const json = (await res.json()) as { sites: { id: number; name: string }[] };
  return json.sites;
}

export async function getPublicSites() {
  const res = await fetch(`${getApiBase()}/api/meta/public/sites`);
  if (!res.ok) throw new Error('Failed to load sites');
  const json = (await res.json()) as { sites: { id: number; name: string }[] };
  return json.sites;
}

export async function getTimeDelayOptions(token: string) {
  const res = await fetch(`${getApiBase()}/api/meta/time-delay-options`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load time delay options');
  const json = (await res.json()) as { options: TimeDelayOptionDto[] };
  return json.options;
}

export async function getPublicTimeDelayOptions() {
  const res = await fetch(`${getApiBase()}/api/meta/public/time-delay-options`);
  if (!res.ok) throw new Error('Failed to load time delay options');
  const json = (await res.json()) as { options: TimeDelayOptionDto[] };
  return json.options;
}

export async function createTimeDelayOption(token: string, data: { label: string; hours: number }) {
  const res = await fetch(`${getApiBase()}/api/meta/time-delay-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create time delay option');
  }
  return res.json() as Promise<TimeDelayOptionDto>;
}

export interface RequisitionSummary {
  id: number;
  patientIdOrTempLabel: string;
  patientName?: string | null;
  patientDateOfBirth?: string | null;
  orderingDoctorName: string;
  orderingClinic: string;
  site: string;
  status: string;
  calculatedDueDate: string | null;
  createdAt: string;
  visit?: { visitNumber: string | null; scheduledDateTime?: string | null } | null;
  imagingItems?: {
    rvuValue: number;
    modality: string;
    categoryId: number | null;
    specialNotes?: string | null;
    category?: { id: number; name: string } | null;
  }[];
  specialtyRequirement?: { requiredSubspecialties: string[] } | null;
}

export interface SpecialtyRuleDto {
  id: number;
  modality: string;
  categoryName: string;
  subCategory: string | null;
  requiredSubspecialties: string[];
}

export async function getRequisitions(token: string) {
  const res = await fetch(`${getApiBase()}/api/requisitions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load requisitions');
  const json = (await res.json()) as { requisitions: RequisitionSummary[] };
  return json.requisitions;
}

export async function updateRequisitionSchedule(
  token: string,
  id: number,
  data: { dueDate: string; shift: 'AM' | 'PM' | 'NIGHT' | 'NA' }
) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}/schedule`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update schedule');
  }
  return res.json() as Promise<{
    id: number;
    calculatedDueDate: string | null;
    scheduledDateTime: string | null;
  }>;
}

export async function updateRequisitionImaging(
  token: string,
  id: number,
  data: { modality: string; categoryId: number; selectedSubCategories: string[]; notes?: string }
) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}/imaging`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update imaging details');
  }
  return res.json() as Promise<{
    requisitionId: number;
    modality: string;
    categoryId: number;
    selectedSubCategories: string[];
    requiredSubspecialties: string[];
  }>;
}

export async function updateRequisitionNotes(token: string, id: number, notes: string) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update notes');
  }
  return res.json() as Promise<{ requisitionId: number; notes: string | null }>;
}

export async function deleteRequisition(token: string, id: number) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to delete requisition');
  }
  return res.json() as Promise<{ deleted: number }>;
}

export interface ShiftDto {
  id: number;
  date: string;
  shiftType: 'AM' | 'PM' | 'NIGHT';
  site: string;
  maxRvu: number | null;
}

export async function getMyShifts(token: string, from: string, to: string) {
  const res = await fetch(`${getApiBase()}/api/shifts/mine?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load my shifts');
  const json = (await res.json()) as { shifts: ShiftDto[] };
  return json.shifts;
}

export async function saveMyShift(
  token: string,
  data: { date: string; shiftType: 'AM' | 'PM' | 'NIGHT'; site?: string }
) {
  const res = await fetch(`${getApiBase()}/api/shifts/mine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to save shift');
  }
  return res.json() as Promise<ShiftDto>;
}

export async function deleteMyShift(
  token: string,
  data: { date: string; shiftType: 'AM' | 'PM' | 'NIGHT' }
) {
  const res = await fetch(`${getApiBase()}/api/shifts/mine`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to delete shift');
  }
  return res.json() as Promise<{ deleted: number }>;
}

export async function approveRequisition(token: string, id: number) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to approve requisition');
  }
  return res.json() as Promise<{ id: number; status: string }>;
}

export async function updateRequisitionRvu(token: string, id: number, rvuValue: number) {
  const res = await fetch(`${getApiBase()}/api/requisitions/${id}/rvu`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rvuValue }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update RVU');
  }
  return res.json() as Promise<{ requisitionId: number; rvuValue: number }>;
}

export async function getSpecialtyRules(token: string) {
  const res = await fetch(`${getApiBase()}/api/specialty-rules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load specialty rules');
  const json = (await res.json()) as { rules: SpecialtyRuleDto[] };
  return json.rules;
}

export async function saveSpecialtyRule(
  token: string,
  data: { modality: string; categoryName: string; subCategory: string | null; requiredSubspecialties: string[] }
) {
  const res = await fetch(`${getApiBase()}/api/specialty-rules`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to save specialty rule');
  }
  return res.json() as Promise<SpecialtyRuleDto>;
}

export async function createSite(token: string, name: string) {
  const res = await fetch(`${getApiBase()}/api/meta/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to create site');
  }
  return res.json() as Promise<{ id: number; name: string }>;
}
