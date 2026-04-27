// src/pages/business/api/pagesApi.js
/**
 * Pages API client (v1)
 * ---------------------
 * Centralize all "Pages" requests (Businesses/Musicians/Services/etc).
 * Cookie-based auth: credentials: 'include'
 */

import { secureFetch } from '../../../utils/secureFetch';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

const safeJson = async (res) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

export async function fetchPageMembers(pageId) {
    const id = Number(pageId);
    if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid page id.');

    const res = await secureFetch(apiUrl(`/api/pages/${encodeURIComponent(String(id))}/members`), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data;
}

export async function createPageInvite(pageId, { email, role }) {
    const id = Number(pageId);
    if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid page id.');

    const payload = {
        email: String(email || '').trim(),
        role: String(role || 'editor').trim(),
    };

    const res = await secureFetch(apiUrl(`/api/pages/${encodeURIComponent(String(id))}/invites`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { ok, invite, token }
}

export async function acceptPageInvite(token) {
    const t = String(token || '').trim();
    if (!t) throw new Error('Missing invite token.');

    const res = await secureFetch(apiUrl('/api/pages/invites/accept'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { ok, page_id, role }
}

export async function updatePageMember(pageId, userId, { role, status } = {}) {
    const pid = Number(pageId);
    const uid = Number(userId);
    if (!Number.isFinite(pid) || pid <= 0) throw new Error('Invalid page id.');
    if (!Number.isFinite(uid) || uid <= 0) throw new Error('Invalid user id.');

    const payload = {};
    if (role != null) payload.role = String(role).trim();
    if (status != null) payload.status = String(status).trim();

    const res = await secureFetch(
        apiUrl(`/api/pages/${encodeURIComponent(String(pid))}/members/${encodeURIComponent(String(uid))}`),
        {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }
    );

    const data = await safeJson(res);
    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status}).`);
    }
    return data; // { ok: true }
}
