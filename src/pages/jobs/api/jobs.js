// src/pages/jobs/api/jobs.js

import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import { secureFetch } from "../../../utils/secureFetch";

async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function toCsv(arr) {
    const a = Array.isArray(arr) ? arr : [];
    return a.map((x) => String(x || "").trim()).filter(Boolean).join(",");
}

function buildFeedParams({ search, sort, filters, limit, cursor } = {}) {
    const params = new URLSearchParams();

    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const s = String(sort || "").trim();
    if (s) params.set("sort", s);

    const f = filters && typeof filters === "object" ? filters : {};

    const category = String(f.category || "").trim();
    if (category && category !== "All") params.set("category", category);

    const jobTypes = toCsv(f.jobTypes);
    if (jobTypes) params.set("jobTypes", jobTypes);

    const workModes = toCsv(f.workModes);
    if (workModes) params.set("workModes", workModes);

    const city = String(f.city || "").trim();
    if (city) params.set("city", city);

    const county = String(f.county || "").trim();
    // Radius expansion: send comma-joined counties when >1
    const countiesArr = Array.isArray(f.counties) ? f.counties.filter(Boolean) : [];
    if (countiesArr.length > 1) {
        params.set("counties", countiesArr.join(","));
    } else if (county) {
        params.set("county", county);
    }

    if (f.statewideOnly) params.set("statewideOnly", "1");

    const salaryRange = String(f.salaryRange || "").trim();
    if (salaryRange) params.set("salaryRange", salaryRange);

    if (Number.isFinite(Number(limit))) params.set("limit", String(Number(limit)));
    if (cursor != null && String(cursor).trim() !== "") params.set("cursor", String(cursor));

    return params;
}

export async function fetchJobsFeed({ search, sort, filters, limit = 20, cursor = null } = {}) {
    const params = buildFeedParams({ search, sort, filters, limit, cursor });
    const url = `/api/jobs/feed?${params.toString()}`;

    const res = await secureFetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...getAccountHeaders() },
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to load jobs feed.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return {
        items,
        nextCursor: data?.nextCursor ?? null,
        hasMore: Boolean(data?.hasMore),
    };
}

/**
 * Fetch jobs the current user has posted.
 * Supports status filter ("active" | "expired" | "all") and same filters as feed.
 */
export async function fetchMyJobs({ signal, status, search, sort, filters } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const s = String(sort || "").trim();
    if (s) params.set("sort", s);

    const f = filters && typeof filters === "object" ? filters : {};
    const category = String(f.category || "").trim();
    if (category && category !== "All") params.set("category", category);
    const jobTypes = toCsv(f.jobTypes);
    if (jobTypes) params.set("jobTypes", jobTypes);
    const workModes = toCsv(f.workModes);
    if (workModes) params.set("workModes", workModes);
    const city = String(f.city || "").trim();
    if (city) params.set("city", city);

    const county = String(f.county || "").trim();
    const countiesArr = Array.isArray(f.counties) ? f.counties.filter(Boolean) : [];
    if (countiesArr.length > 1) params.set("counties", countiesArr.join(","));
    else if (county) params.set("county", county);

    if (f.statewideOnly) params.set("statewideOnly", "1");

    const salaryRange = String(f.salaryRange || "").trim();
    if (salaryRange) params.set("salaryRange", salaryRange);

    const qs = params.toString();
    const url = `/api/jobs/my${qs ? `?${qs}` : ""}`;

    const res = await secureFetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...getAccountHeaders() },
        signal,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        if (res.status === 401) return [];
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to load your jobs.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

export async function fetchJobCategories({ search, sort, filters } = {}) {
    const params = new URLSearchParams();

    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const f = filters && typeof filters === "object" ? filters : {};

    const jobTypes = toCsv(f.jobTypes);
    if (jobTypes) params.set("jobTypes", jobTypes);

    const workModes = toCsv(f.workModes);
    if (workModes) params.set("workModes", workModes);

    const city = String(f.city || "").trim();
    if (city) params.set("city", city);

    const county = String(f.county || "").trim();
    const countiesArr = Array.isArray(f.counties) ? f.counties.filter(Boolean) : [];
    if (countiesArr.length > 1) params.set("counties", countiesArr.join(","));
    else if (county) params.set("county", county);

    if (f.statewideOnly) params.set("statewideOnly", "1");

    const salaryRange = String(f.salaryRange || "").trim();
    if (salaryRange) params.set("salaryRange", salaryRange);

    const s = String(sort || "").trim();
    if (s) params.set("sort", s);

    const url = `/api/jobs/categories?${params.toString()}`;

    const res = await secureFetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...getAccountHeaders() },
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to load job categories.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    const categories = Array.isArray(data?.categories) ? data.categories : Array.isArray(data) ? data : [];
    return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: Number(c.count) || 0,
        sortOrder: Number(c.sortOrder) || 0,
    }));
}

export async function fetchJobById(jobId, { signal } = {}) {
    const idStr = jobId != null ? String(jobId) : "";
    if (!idStr) throw new Error("Missing jobId.");

    const res = await secureFetch(`/api/jobs/${encodeURIComponent(idStr)}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", ...getAccountHeaders() },
        signal,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to load job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function createJob(payload) {
    const res = await secureFetch("/api/jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...getAccountHeaders() },
        body: JSON.stringify(payload || {}),
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to create job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    if (data && typeof data === "object" && data.job) return data.job;
    return data;
}

export async function updateJob(jobId, payload) {
    const idStr = jobId != null ? String(jobId) : "";
    if (!idStr) throw new Error("Missing jobId.");

    const res = await secureFetch(`/api/jobs/${encodeURIComponent(idStr)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...getAccountHeaders() },
        body: JSON.stringify(payload || {}),
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to update job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    if (data && typeof data === "object" && data.job) return data.job;
    return data;
}

export async function deleteJob(jobId) {
    const idStr = jobId != null ? String(jobId) : "";
    if (!idStr) throw new Error("Missing jobId.");

    const res = await secureFetch(`/api/jobs/${encodeURIComponent(idStr)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json", ...getAccountHeaders() },
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to delete job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function renewJob(jobId, expiresInDays = 30) {
    const idStr = jobId != null ? String(jobId) : "";
    if (!idStr) throw new Error("Missing jobId.");

    const res = await secureFetch(`/api/jobs/${encodeURIComponent(idStr)}/renew`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...getAccountHeaders() },
        body: JSON.stringify({ expiresInDays }),
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to renew job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    if (data && typeof data === "object" && data.job) return data.job;
    return data;
}

export async function saveJob(jobId) {
    const idStr = jobId != null ? String(jobId) : "";
    if (!idStr) throw new Error("Missing jobId.");

    const res = await secureFetch(`/api/jobs/${encodeURIComponent(idStr)}/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...getAccountHeaders() },
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        const message =
            (data && typeof data === "object" && (data.message || data.error)) ||
            "Failed to save job.";
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export async function fetchJobLocationCounts({ search, sort, filters } = {}) {
    const params = new URLSearchParams();

    const q = String(search || "").trim();
    if (q) params.set("q", q);

    const s = String(sort || "").trim();
    if (s) params.set("sort", s);

    const f = filters && typeof filters === "object" ? filters : {};

    const category = String(f.category || "").trim();
    if (category && category !== "All") params.set("category", category);

    const jobTypes = toCsv(f.jobTypes);
    if (jobTypes) params.set("jobTypes", jobTypes);

    const workModes = toCsv(f.workModes);
    if (workModes) params.set("workModes", workModes);

    const county = String(f.county || "").trim();
    if (county) params.set("county", county);

    const city = String(f.city || "").trim();
    if (city) params.set("city", city);

    if (f.statewideOnly) params.set("statewideOnly", "1");

    const salaryRange = String(f.salaryRange || "").trim();
    if (salaryRange) params.set("salaryRange", salaryRange);

    const url = `/api/jobs/location-counts?${params.toString()}`;

    try {
        const res = await secureFetch(url, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json", ...getAccountHeaders() },
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) return { counties: {}, cities: {} };
        return {
            counties: data?.counties && typeof data.counties === "object" ? data.counties : {},
            cities: data?.cities && typeof data.cities === "object" ? data.cities : {},
        };
    } catch {
        return { counties: {}, cities: {} };
    }
}

export async function fetchJobLimits() {
    try {
        const res = await secureFetch("/api/jobs/limits", {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json", ...getAccountHeaders() },
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) return null;
        return {
            canCreate: Boolean(data?.canCreate),
            activeCount: Number(data?.activeCount || 0),
            maxAllowed: Number(data?.maxAllowed || 20),
            remaining: Number(data?.remaining || 0),
        };
    } catch {
        return null;
    }
}
