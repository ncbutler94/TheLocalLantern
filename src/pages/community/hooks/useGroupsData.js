import { secureFetch } from '../../../utils/secureFetch';
// src/hooks/community/useGroupsData.js
import { useCallback, useEffect, useRef, useState } from 'react';


const GROUPS_LIST_ENDPOINTS = ['/api/community/groups', '/api/groups'];
// IMPORTANT: create should prefer the community groups route (it contains the photo insert logic)
const GROUPS_CREATE_ENDPOINTS = ['/api/community/groups', '/api/groups'];

function normalizeGroupRow(raw) {
    if (!raw || typeof raw !== 'object') return raw;

    const g = { ...raw };

    // Avatar (cropped) - what UI should render.
    if (g.image_url == null && g.imageUrl != null) g.image_url = g.imageUrl;
    if (g.image_object_path == null && g.imageObjectPath != null) g.image_object_path = g.imageObjectPath;

    // Avatar (original) - stored for future re-crops / edits.
    if (g.image_original_url == null && g.imageOriginalUrl != null) g.image_original_url = g.imageOriginalUrl;
    if (g.image_original_object_path == null && g.imageOriginalObjectPath != null) g.image_original_object_path = g.imageOriginalObjectPath;

    // Cover (cropped) - what GroupHeader should render.
    if (g.cover_photo_url == null && g.coverPhotoUrl != null) g.cover_photo_url = g.coverPhotoUrl;
    if (g.cover_photo_object_path == null && g.coverPhotoObjectPath != null) g.cover_photo_object_path = g.coverPhotoObjectPath;

    // Cover (original) - stored for future re-crops / edits.
    if (g.cover_photo_original_url == null && g.coverPhotoOriginalUrl != null) g.cover_photo_original_url = g.coverPhotoOriginalUrl;
    if (g.cover_photo_original_object_path == null && g.coverPhotoOriginalObjectPath != null) g.cover_photo_original_object_path = g.coverPhotoOriginalObjectPath;

    // Keep camelCase aliases for older UI code paths (harmless if unused).
    if (g.imageUrl == null && g.image_url != null) g.imageUrl = g.image_url;
    if (g.imageObjectPath == null && g.image_object_path != null) g.imageObjectPath = g.image_object_path;
    if (g.imageOriginalUrl == null && g.image_original_url != null) g.imageOriginalUrl = g.image_original_url;
    if (g.imageOriginalObjectPath == null && g.image_original_object_path != null) g.imageOriginalObjectPath = g.image_original_object_path;
    if (g.coverPhotoUrl == null && g.cover_photo_url != null) g.coverPhotoUrl = g.cover_photo_url;
    if (g.coverPhotoObjectPath == null && g.cover_photo_object_path != null) g.coverPhotoObjectPath = g.cover_photo_object_path;
    if (g.coverPhotoOriginalUrl == null && g.cover_photo_original_url != null) g.coverPhotoOriginalUrl = g.cover_photo_original_url;
    if (g.coverPhotoOriginalObjectPath == null && g.cover_photo_original_object_path != null) g.coverPhotoOriginalObjectPath = g.cover_photo_original_object_path;

    return g;
}

function normalizeGroupsBase(base) {
    // Some parts of the app use /api/community/groups as the list endpoint.
    // Admin routes are mounted under /api/groups.
    return String(base || '').includes('/api/community/groups')
        ? '/api/groups'
        : String(base || '').trim();
}

async function fetchWithFallback(urls, options) {
    let res = null;
    for (let i = 0; i < urls.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const r = await secureFetch(urls[i], options);
        if (r.status === 404 && i < urls.length - 1) continue;
        res = r;
        break;
    }
    return res;
}


async function readJsonOrText(res) {
    const text = await res.text().catch(() => '');
    if (!text) return { json: null, text: '' };
    try {
        return { json: JSON.parse(text), text };
    } catch {
        return { json: null, text };
    }
}

function extractMessage(payload, fallbackText = '') {
    const msg = String(payload?.message || '').trim();
    if (msg) return msg;

    const errorsArr = Array.isArray(payload?.errors) ? payload.errors : [];
    const joined = errorsArr
        .map((e) => String(e?.msg || e?.message || '').trim())
        .filter(Boolean)
        .join(' ');
    if (joined) return joined;

    return String(fallbackText || '').trim();
}

function toBool(value) {
    if (typeof value === 'string') {
        const s = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
        if (['false', '0', 'no', 'n', 'off', ''].includes(s)) return false;
    }
    return Boolean(value);
}

function getNetworkErrorMessage(err, fallback = 'Couldn’t load groups. Please check your connection and try again.') {
    const raw = String(err?.message || '').trim();
    if (!raw) return fallback;

    const normalized = raw.toLowerCase();
    if (
        normalized === 'failed to fetch' ||
        normalized.includes('networkerror') ||
        normalized.includes('network error') ||
        normalized.includes('load failed') ||
        normalized.includes('fetch failed')
    ) {
        return 'Failed to fetch';
    }

    return raw;
}

function isProbablyGroupRow(item) {
    if (!item || typeof item !== 'object') return false;

    const hasName = typeof item.name === 'string' || typeof item.group_name === 'string';
    const hasMemberCount = item.member_count != null || item.members_count != null || item.memberCount != null;
    const hasVisibility = item.visibility != null || item.is_private != null || item.isPrivate != null;

    const looksLikePost =
        item.category != null &&
        (item.title != null || item.description != null || item.posted_at != null || item.date_created != null);

    if (looksLikePost && !hasName) return false;

    return Boolean(hasName && (hasMemberCount || hasVisibility || item.id != null));
}

function normalizeGroupsPayload(data) {
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
        if (Array.isArray(data.groups)) return data.groups;
        if (Array.isArray(data.data?.groups)) return data.data.groups;
    }

    return [];
}

export default function useGroupsData({
                                          city = '',
                                          county = '',
                                          counties = null,
                                          q = '',
                                          category = '',
                                          sort = 'newest',
                                          dateRange = 'all',
                                          randomSeed = '',
                                          mine = false,
                                          followingUserIds = '',
                                          memberType = 'all',
                                          limit = null,
                                          offset = 0,
                                          includeTotal = false,
                                          enabled = true,
                                      } = {}) {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(Boolean(enabled));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(null);
    const abortRef = useRef(null);
    const queryKeyRef = useRef('');

    const refetch = useCallback(async () => {
        if (!enabled) return;

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const isLoadMore = Number.isFinite(Number(offset)) && Number(offset) > 0;
        // Query key excludes pagination so we can decide whether to append or replace.
        const queryKey = JSON.stringify({ q, county, counties: Array.isArray(counties) ? counties.join(',') : '', city, category, mine: Boolean(mine), followingUserIds: String(followingUserIds || ''), memberType: String(memberType || 'all'), sort, dateRange, randomSeed: String(randomSeed || '').trim(), limit: limit == null ? null : Number(limit), includeTotal: Boolean(includeTotal) });

        setError('');
        if (isLoadMore) setIsLoadingMore(true);
        else setIsLoading(true);

        try {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            // Radius expansion: send comma-joined counties when >1
            const countiesArr = Array.isArray(counties) ? counties.filter(Boolean) : [];
            if (countiesArr.length > 1) {
                params.set('counties', countiesArr.join(','));
            } else if (county) {
                params.set('county', county);
            }
            if (city) params.set('city', city);
            if (category) params.set('category', category);
            if (sort) params.set('sort', sort);
            if (dateRange) params.set('dateRange', dateRange);
            if (String(sort || '').trim().toLowerCase() === 'random' && randomSeed) params.set('randomSeed', randomSeed);
            if (mine) params.set('mine', '1');
            if (followingUserIds) params.set('following_ids', String(followingUserIds));
            if (memberType && memberType !== 'all') params.set('member_type', memberType);

            if (limit != null && String(limit) !== '') params.set('limit', String(limit));
            if (Number.isFinite(Number(offset)) && Number(offset) > 0) params.set('offset', String(Number(offset)));
            if (includeTotal) params.set('includeTotal', '1');

            const suffix = params.toString() ? `?${params.toString()}` : '';
            const candidateUrls = GROUPS_LIST_ENDPOINTS.map((base) => `${base}${suffix}`);

            let res = null;
            let parsedArr = [];
            for (let i = 0; i < candidateUrls.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const r = await secureFetch(candidateUrls[i], {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });

                if (r.status === 404 && i < candidateUrls.length - 1) continue;

                if (!r.ok) {
                    res = r;
                    break;
                }

                // Parse payload and verify it actually looks like GROUP rows (not community posts).
                const data = await r.json().catch(() => null);
                const arr = normalizeGroupsPayload(data);
                const first = Array.isArray(arr) && arr.length ? arr[0] : null;

                if (first && !isProbablyGroupRow(first) && i < candidateUrls.length - 1) {
                    // Wrong router mounted at this endpoint; try the next fallback.
                    continue;
                }

                res = r;
                parsedArr = arr;
                break;
            }
            if (!res) {
                setGroups([]);
                setError('Failed to fetch');
                return;
            }

            if (!res.ok) {
                let msg = '';
                try {
                    const j = await res.json();
                    msg = String(j?.message || '').trim();
                } catch {
                    msg = '';
                }
                setGroups([]);
                setError(msg || 'Couldn’t load groups. Please try again.');
                return;
            }

            const arr = (Array.isArray(parsedArr) && parsedArr.length)
                ? parsedArr
                : normalizeGroupsPayload(await res.json().catch(() => null));
// If we are paginating with the same filters, append. Otherwise replace.
            const shouldAppend = isLoadMore && queryKeyRef.current === queryKey;
            queryKeyRef.current = queryKey;

            const normalizedArr = (Array.isArray(arr) ? arr : []).map(normalizeGroupRow);

            if (!shouldAppend) {
                setGroups(normalizedArr);
            } else {
                setGroups((prev) => {
                    const prevArr = Array.isArray(prev) ? prev : [];
                    if (!prevArr.length) return normalizedArr;

                    const seen = new Set(prevArr.map((g) => String(g?.id ?? '')));
                    const next = prevArr.slice();
                    normalizedArr.forEach((g) => {
                        const id = String(g?.id ?? '');
                        if (!id || seen.has(id)) return;
                        seen.add(id);
                        next.push(g);
                    });
                    return next;
                });
            }

            if (includeTotal) {
                const headerVal = Number(res.headers.get('x-total-count') || res.headers.get('X-Total-Count'));
                if (Number.isFinite(headerVal) && headerVal >= 0) {
                    setTotalCount(headerVal);
                } else {
                    // FIX: When the server omits the X-Total-Count header, infer
                    // a value from the response size so downstream paging logic
                    // (CommunityPage, CommunityPanel footer) doesn't break.
                    //
                    // If the returned page is full (length === limit), we don't know
                    // the true total, so leave it null — this lets the "hasMore"
                    // heuristic in CommunityPage kick in.
                    //
                    // If the returned page is smaller than the limit, we've reached
                    // the end and the total is the current offset + returned count.
                    const pageLen = Array.isArray(normalizedArr) ? normalizedArr.length : 0;
                    const effectiveLimit = limit != null ? Number(limit) : 25;
                    if (pageLen > 0 && pageLen < effectiveLimit) {
                        // We got a partial page — this IS the last page.
                        const inferredTotal = (Number.isFinite(Number(offset)) ? Number(offset) : 0) + pageLen;
                        setTotalCount(inferredTotal);
                    } else {
                        // Full page or empty — can't determine total.
                        setTotalCount(null);
                    }
                }
            } else {
                setTotalCount(null);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                // On load-more errors, keep what we already have.
                if (!(Number.isFinite(Number(offset)) && Number(offset) > 0)) setGroups([]);
                setError(getNetworkErrorMessage(err));
            }
        } finally {
            const isLoadMore = Number.isFinite(Number(offset)) && Number(offset) > 0;
            if (isLoadMore) setIsLoadingMore(false);
            else setIsLoading(false);
        }
    }, [enabled, q, county, counties, city, category, mine, followingUserIds, memberType, sort, dateRange, randomSeed, limit, offset, includeTotal]);

    const createGroup = useCallback(async (payload) => {
        // Accept either a plain object OR a FormData instance.
        // IMPORTANT: CreateGroupModal submits a FormData (like our newer forms).
        // If we try to treat FormData like a plain object, we lose fields like `name`.

        const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

        const cloneFormData = (fd) => {
            const out = new FormData();
            // eslint-disable-next-line no-restricted-syntax
            for (const [k, v] of fd.entries()) {
                out.append(k, v);
            }
            return out;
        };

        if (isFormData) {
            let res = null;
            for (let i = 0; i < GROUPS_CREATE_ENDPOINTS.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const r = await secureFetch(GROUPS_CREATE_ENDPOINTS[i], {
                    method: 'POST',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                    // FormData bodies cannot be reused safely across multiple fetch attempts.
                    body: cloneFormData(payload),
                });

                if (r.status === 404 && i < GROUPS_CREATE_ENDPOINTS.length - 1) continue;
                res = r;
                break;
            }

            if (!res) throw new Error('Groups service is unavailable. Please try again.');

            const parsed = await readJsonOrText(res);
            const data = parsed.json && typeof parsed.json === 'object' ? parsed.json : {};
            const msg = extractMessage(data, parsed.text);

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) throw new Error('Please log in to create a group.');
                if (res.status === 404) throw new Error('Groups service is unavailable (404). Please refresh and try again.');
                if (res.status === 409) throw new Error(msg || 'That group username is already in use.');
                if (res.status === 400) throw new Error(msg || 'Please check the form for missing or invalid fields.');
                throw new Error(msg || 'We couldn’t create your group. Please try again.');
            }

            return data?.group || null;
        }

        // Otherwise, build a multipart FormData payload from a plain object.
        const safe = (payload && typeof payload === 'object') ? payload : {};

        const extractFile = (p) => {
            if (!p) return null;
            if (p instanceof File) return p;
            if (p?.file instanceof File) return p.file;
            if (p?.originFileObj instanceof File) return p.originFileObj;
            if (p?.fileObj instanceof File) return p.fileObj;
            if (p?.rawFile instanceof File) return p.rawFile;
            if (p?.blob instanceof File) return p.blob;
            return null;
        };

        const rulesHtmlFinal = String(safe.rulesHtml ?? safe.rulesText ?? '').trim();

        const rawGallery = []
            .concat(Array.isArray(safe.photos) ? safe.photos : [])
            .concat(Array.isArray(safe.galleryPhotos) ? safe.galleryPhotos : [])
            .concat(Array.isArray(safe.groupPhotos) ? safe.groupPhotos : []);

        const photoFiles = rawGallery.map(extractFile).filter(Boolean);

        const uploadedMeta = Array.isArray(safe.galleryPhotos)
            ? safe.galleryPhotos
            : [];

        const buildFormData = () => {
            const form = new FormData();
            form.append('name', String(safe.name || ''));
            form.append('groupUsername', String(safe.groupUsername || ''));
            form.append('category', String(safe.category || ''));
            form.append('description', String(safe.description || ''));
            form.append('visibility', String(safe.visibility || 'public'));
            form.append('isStatewide', String(toBool(safe.isStatewide)));
            form.append('county', String(safe.county || ''));
            form.append('city', String(safe.city || ''));
            form.append('imageUrl', String(safe.imageUrl || ''));
            form.append('imageObjectPath', String(safe.imageObjectPath || ''));
            // New: also allow storing the original uploads for future re-crops.
            form.append('imageOriginalUrl', String(safe.imageOriginalUrl || ''));
            form.append('imageOriginalObjectPath', String(safe.imageOriginalObjectPath || ''));

            // New: cover photo (cropped + original)
            form.append('coverPhotoUrl', String(safe.coverPhotoUrl || safe.cover_photo_url || ''));
            form.append('coverPhotoObjectPath', String(safe.coverPhotoObjectPath || safe.cover_photo_object_path || ''));
            form.append('coverPhotoOriginalUrl', String(safe.coverPhotoOriginalUrl || safe.cover_photo_original_url || ''));
            form.append('coverPhotoOriginalObjectPath', String(safe.coverPhotoOriginalObjectPath || safe.cover_photo_original_object_path || ''));

            // Backward-compat keys some backends may expect (safe to include).
            form.append('coverPhotoURL', String(safe.coverPhotoUrl || safe.cover_photo_url || ''));
            form.append('coverPhotoObjectPATH', String(safe.coverPhotoObjectPath || safe.cover_photo_object_path || ''));
            form.append('rulesHtml', String(rulesHtmlFinal || ''));
            form.append('rulesText', String(rulesHtmlFinal || ''));
            form.append('inviteUserIds', JSON.stringify(Array.isArray(safe.inviteUserIds) ? safe.inviteUserIds : []));

            if (uploadedMeta.length > 0) {
                const metaJson = JSON.stringify(uploadedMeta);
                // Keep multiple keys for backend compatibility
                form.append('galleryPhotos', metaJson);
                form.append('groupPhotos', metaJson);
                form.append('photosMeta', metaJson);
            }

            photoFiles.forEach((f) => form.append('photos', f));
            return form;
        };

        let res = null;

        for (let i = 0; i < GROUPS_CREATE_ENDPOINTS.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const r = await secureFetch(GROUPS_CREATE_ENDPOINTS[i], {
                method: 'POST',
                credentials: 'include',
                headers: { Accept: 'application/json' },
                body: buildFormData(),
            });

            if (r.status === 404 && i < GROUPS_LIST_ENDPOINTS.length - 1) continue;
            res = r;
            break;
        }

        if (!res) throw new Error('Groups service is unavailable. Please try again.');

        const parsed = await readJsonOrText(res);
        const data = parsed.json && typeof parsed.json === 'object' ? parsed.json : {};
        const msg = extractMessage(data, parsed.text);

        if (!res.ok) {

            if (res.status === 401 || res.status === 403) {
                throw new Error('Please log in to create a group.');
            }
            if (res.status === 404) {
                throw new Error('Groups service is unavailable (404). Please refresh and try again.');
            }
            if (res.status === 409) {
                throw new Error(msg || 'That group username is already in use.');
            }
            if (res.status === 400) {
                throw new Error(msg || 'Please check the form for missing or invalid fields.');
            }

            throw new Error(msg || 'We couldn’t create your group. Please try again.');
        }

        return data?.group || null;



    }, []);

    const joinGroup = useCallback(async (groupId) => {
        const idStr = groupId != null ? String(groupId) : '';
        if (!idStr) throw new Error('Missing group id.');

        let res = null;

        for (let i = 0; i < GROUPS_LIST_ENDPOINTS.length; i += 1) {
            const base = GROUPS_LIST_ENDPOINTS[i].includes('/community/groups')
                ? GROUPS_LIST_ENDPOINTS[i].replace('/community/groups', '/groups')
                : GROUPS_LIST_ENDPOINTS[i].replace('/groups', '/groups');

            const url = `${base.replace(/\/$/, '')}/${encodeURIComponent(idStr)}/join`;

            // eslint-disable-next-line no-await-in-loop
            const r = await secureFetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({}),
            });

            if (r.status === 404 && i < GROUPS_CREATE_ENDPOINTS.length - 1) continue;
            res = r;
            break;
        }

        if (!res) throw new Error('Groups service is unavailable. Please try again.');

        const parsed = await readJsonOrText(res);
        const data = parsed.json && typeof parsed.json === 'object' ? parsed.json : {};
        const msg = extractMessage(data, parsed.text);

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) throw new Error('Please log in to join a group.');
            if (res.status === 404) throw new Error('Group not found (404).');
            if (res.status === 409) throw new Error(msg || 'You’ve already joined or requested to join this group.');
            throw new Error(msg || 'Couldn’t join this group. Please try again.');
        }

        const returned = data?.membership || data?.group || data || null;

        // Optimistic UI patch for immediate button flip in the list + selectedGroup header.
        // If backend returns membership status, use it; otherwise infer from group visibility flags if present.
        setGroups((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            if (!arr.length) return prev;

            const statusRaw = String(returned?.status || returned?.membership_status || '').toLowerCase();
            const isJoined = statusRaw === 'joined' || Boolean(returned?.is_member || returned?.isMember);
            const isPending = statusRaw === 'pending' || Boolean(returned?.has_requested || returned?.hasRequested);

            return arr.map((g) => {
                if (!g || g.id == null) return g;
                if (String(g.id) !== idStr) return g;

                const visibility = String(g.visibility || '').toLowerCase();
                const shouldPending = (!isJoined && !isPending) ? (visibility === 'private' || visibility === 'hidden') : false;

                if (isJoined) {
                    return { ...g, is_member: true, isMember: true, has_requested: false, hasRequested: false };
                }
                if (isPending || shouldPending) {
                    return { ...g, has_requested: true, hasRequested: true, is_member: false, isMember: false };
                }
                // Public group fallback: joined
                return { ...g, is_member: true, isMember: true, has_requested: false, hasRequested: false };
            });
        });

        return returned;
    }, []);


    useEffect(() => {
        refetch();
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [refetch]);

    return { groups, isLoading, isLoadingMore, error, totalCount, refetch, createGroup, joinGroup };
}

// Fetch posts for a selected group (used by CommunityPage right panel)
export async function fetchGroupPosts(groupId, { limit = 50, offset = 0 } = {}) {
    if (!groupId) return [];
    const res = await secureFetch(`/api/groups/${groupId}/posts?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch group posts');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

function buildAdminUrls(groupId, path) {
    const idStr = groupId != null ? String(groupId) : '';
    if (!idStr) return [];
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return GROUPS_LIST_ENDPOINTS.map((base) => {
        const b = normalizeGroupsBase(base).replace(/\/+$/, '');
        return `${b}/${encodeURIComponent(idStr)}/admin/${cleanPath}`;
    });
}

async function adminJson(groupId, path, { method = 'GET', body = null } = {}) {
    const urls = buildAdminUrls(groupId, path);
    if (!urls.length) throw new Error('Missing group id.');

    const options = {
        method,
        credentials: 'include',
        headers: { Accept: 'application/json' },
    };

    if (body != null) {
        options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    const res = await fetchWithFallback(urls, options);
    if (!res) throw new Error('Groups service is unavailable. Please try again.');

    const parsed = await readJsonOrText(res);
    const data = parsed.json && typeof parsed.json === 'object' ? parsed.json : {};
    const msg = extractMessage(data, parsed.text);

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('You do not have permission to do that.');
        if (res.status === 404) throw new Error('Not found.');
        throw new Error(msg || 'Request failed.');
    }
    return data;
}

// ===== Admin API helpers (used by GroupAdminTab) =====

export async function adminUpdateGroupSettings(groupId, patch) {
    return adminJson(groupId, 'settings', { method: 'POST', body: patch || {} });
}

export async function adminListAdmins(groupId) {
    return adminJson(groupId, 'admins');
}

// List group members (joined) for admin workflows (e.g., Add Admins modal)
export async function adminListMembers(groupId, { q = '', limit = 30, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', String(q));
    if (limit != null && String(limit) !== '') params.set('limit', String(Math.min(200, Math.max(1, Number(limit) || 30))));
    if (offset != null && String(offset) !== '') params.set('offset', String(Math.max(0, Number(offset) || 0)));

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return adminJson(groupId, `members${suffix}`);
}

export async function adminPromoteAdmin(groupId, query) {
    return adminJson(groupId, 'admins', { method: 'POST', body: { query } });
}

export async function adminDemoteAdmin(groupId, userId) {
    const idStr = userId != null ? String(userId) : '';
    if (!idStr) throw new Error('Missing user id.');
    return adminJson(groupId, `admins/${encodeURIComponent(idStr)}`, { method: 'DELETE' });
}

export async function adminTransferOwnership(groupId, userId) {
    return adminJson(groupId, 'transfer-ownership', { method: 'POST', body: { user_id: userId } });
}

export async function adminListJoinRequests(groupId) {
    return adminJson(groupId, 'requests');
}

export async function adminActOnJoinRequest(groupId, userId, action) {
    const idStr = userId != null ? String(userId) : '';
    const act = String(action || '').toLowerCase();
    if (!idStr) throw new Error('Missing user id.');
    if (!['approve', 'deny'].includes(act)) throw new Error('Invalid action.');
    return adminJson(groupId, `requests/${encodeURIComponent(idStr)}/${act}`, { method: 'POST', body: {} });
}

export async function adminListInvites(groupId) {
    return adminJson(groupId, 'invites');
}

export async function adminCreateInvite(groupId, { maxUses = 0, expiresInDays = 7 } = {}) {
    return adminJson(groupId, 'invites', {
        method: 'POST',
        body: { max_uses: maxUses, expires_in_days: expiresInDays },
    });
}

export async function adminRevokeInvite(groupId, inviteId) {
    const idStr = inviteId != null ? String(inviteId) : '';
    if (!idStr) throw new Error('Missing invite id.');
    return adminJson(groupId, `invites/${encodeURIComponent(idStr)}/revoke`, { method: 'POST', body: {} });
}

export async function adminPinGroupPost(groupId, postId) {
    const p = postId != null ? String(postId) : '';
    if (!p) throw new Error('Missing post id.');
    return adminJson(groupId, `posts/${encodeURIComponent(p)}/pin`, { method: 'POST', body: {} });
}

export async function adminUnpinGroupPost(groupId, postId) {
    const p = postId != null ? String(postId) : '';
    if (!p) throw new Error('Missing post id.');
    return adminJson(groupId, `posts/${encodeURIComponent(p)}/unpin`, { method: 'POST', body: {} });
}

export async function adminDeleteGroup(groupId) {
    return adminJson(groupId, 'delete', { method: 'POST', body: {} });
}

export async function adminFetchAudit(groupId) {
    return adminJson(groupId, 'audit');
}

// ===== Moderation helpers (used by moderation UI / future screens) =====

export async function adminFetchRestrictions(groupId) {
    // Returns currently blocked/banned or timed-out members.
    return adminJson(groupId, 'restrictions');
}

export async function adminModerateMember(groupId, userId, action, payload = {}) {
    const idStr = userId != null ? String(userId) : '';
    const act = String(action || '').trim();
    if (!idStr) throw new Error('Missing user id.');
    if (!act) throw new Error('Missing action.');

    // Backend expects an action string and optional fields (duration_minutes, reason).
    const body = {
        action: act,
        ...(payload && typeof payload === 'object' ? payload : {}),
    };

    return adminJson(groupId, `members/${encodeURIComponent(idStr)}/action`, { method: 'POST', body });
}

// ===== Username change tracking =====

export async function adminFetchUsernameChanges(groupId) {
    return adminJson(groupId, 'username-changes');
}

// ===== Invite candidates (fetch user's followers to invite) =====

export async function fetchInviteCandidates({ groupId, q = '', scope = 'followers' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (scope) params.set('scope', scope);
    if (groupId) params.set('group_id', String(groupId));

    const qs = params.toString();
    const url = `/api/groups/invite-candidates${qs ? `?${qs}` : ''}`;

    const res = await secureFetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
        const msg = await readJsonOrText(res);
        throw new Error(extractMessage(msg, 'Failed to load invite candidates.'));
    }
    return res.json();
}

// ===== Join by invite link =====

export async function joinGroupByInviteToken(token) {
    const trimmed = String(token || '').trim();
    if (!trimmed) throw new Error('Missing invite token.');

    const res = await secureFetch(`/api/groups/join-by-invite/${encodeURIComponent(trimmed)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!res.ok) {
        const msg = await readJsonOrText(res);
        throw new Error(extractMessage(msg, 'Failed to join group via invite.'));
    }
    return res.json();
}

// ===== Reported Posts & Comments (used by GroupAdminReportedPostsSection) =====

export async function adminFetchReportedPosts(groupId) {
    return adminJson(groupId, 'reported-posts');
}

export async function adminDismissPostReports(groupId, postId) {
    const p = postId != null ? String(postId) : '';
    if (!p) throw new Error('Missing post id.');
    return adminJson(groupId, `reported-posts/${encodeURIComponent(p)}/dismiss`, { method: 'POST', body: {} });
}

export async function adminDismissCommentReports(groupId, commentId) {
    const c = commentId != null ? String(commentId) : '';
    if (!c) throw new Error('Missing comment id.');
    return adminJson(groupId, `reported-comments/${encodeURIComponent(c)}/dismiss`, { method: 'POST', body: {} });
}

export async function adminDeleteGroupPost(groupId, postId) {
    const p = postId != null ? String(postId) : '';
    if (!p) throw new Error('Missing post id.');
    return adminJson(groupId, `posts/${encodeURIComponent(p)}`, { method: 'DELETE' });
}

export async function adminDeleteGroupComment(groupId, commentId) {
    const c = commentId != null ? String(commentId) : '';
    if (!c) throw new Error('Missing comment id.');
    return adminJson(groupId, `reported-comments/${encodeURIComponent(c)}`, { method: 'DELETE' });
}