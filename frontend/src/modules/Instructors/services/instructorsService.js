const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const headers = () => ({
  'Content-Type': 'application/json',
  'x-user-id': '1', // TODO: replace with actual auth user id
});

export const instructorsService = {
  /** List instructors with optional filters */
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/instructors${qs ? `?${qs}` : ''}`, { headers: headers() });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch instructors');
    return res.json();
  },

  /** Get single instructor by id */
  async get(id) {
    const res = await fetch(`${API_BASE}/instructors/${id}`, { headers: headers() });
    if (!res.ok) throw new Error((await res.json()).error || 'Instructor not found');
    return res.json();
  },

  /** Create new instructor */
  async create(data) {
    const res = await fetch(`${API_BASE}/instructors`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create instructor');
    return res.json();
  },

  /** Update instructor */
  async update(id, data) {
    const res = await fetch(`${API_BASE}/instructors/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update instructor');
    return res.json();
  },

  /** Change employment status */
  async setStatus(id, status) {
    const res = await fetch(`${API_BASE}/instructors/${id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update status');
    return res.json();
  },

  /** Soft delete */
  async remove(id) {
    const res = await fetch(`${API_BASE}/instructors/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete instructor');
    return res.json();
  },

  /** Upload profile photo */
  async uploadPhoto(id, file) {
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch(`${API_BASE}/instructors/${id}/photo`, {
      method: 'POST',
      headers: { 'x-user-id': '1' },
      body: form,
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to upload photo');
    return res.json();
  },

  /** Get documents for instructor */
  async getDocuments(id) {
    const res = await fetch(`${API_BASE}/instructors/${id}/documents`, { headers: headers() });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch documents');
    return res.json();
  },

  /** Upload a document */
  async uploadDocument(id, file, category, label) {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    form.append('label', label || file.name);
    const res = await fetch(`${API_BASE}/instructors/${id}/documents`, {
      method: 'POST',
      headers: { 'x-user-id': '1' },
      body: form,
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to upload document');
    return res.json();
  },

  /** Delete a document */
  async deleteDocument(instructorId, docId) {
    const res = await fetch(`${API_BASE}/instructors/${instructorId}/documents/${docId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete document');
    return res.json();
  },

  /** Get change log */
  async getChangelog(id) {
    const res = await fetch(`${API_BASE}/instructors/${id}/changelog`, { headers: headers() });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch changelog');
    return res.json();
  },
};
