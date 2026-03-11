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

export async function createRequisition(
  token: string,
  data: {
    patientIdOrTempLabel: string;
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

export interface RequisitionSummary {
  id: number;
  patientIdOrTempLabel: string;
  orderingDoctorName: string;
  orderingClinic: string;
  site: string;
  status: string;
  calculatedDueDate: string | null;
  createdAt: string;
  visit?: { visitNumber: string | null } | null;
}

export async function getRequisitions(token: string) {
  const res = await fetch(`${getApiBase()}/api/requisitions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load requisitions');
  const json = (await res.json()) as { requisitions: RequisitionSummary[] };
  return json.requisitions;
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
