// src/hooks/useHomepagePreviews.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { secureFetch } from '../utils/secureFetch';

function normalize(val, allLabel) {
    const v = String(val ?? '').trim();
    if (!v || v.toLowerCase() === allLabel?.toLowerCase()) return '';
    return v;
}

function safeJson(res) {
    return res.ok ? res.json().catch(() => null) : Promise.resolve(null);
}

function extractItems(data, ...keys) {
    if (Array.isArray(data)) return data;
    for (const k of keys) {
        if (data && Array.isArray(data[k])) return data[k];
    }
    return [];
}

function extractTotal(data, ...keys) {
    if (!data || typeof data !== 'object') return 0;
    for (const k of keys) {
        const n = Number(data[k]);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

export default function useHomepagePreviews({ county = '', city = '' } = {}) {
    const [data, setData] = useState({
        events: [], community: [], businesses: [],
        jobs: [], marketplace: [], music: [], services: [],
        people: [],
        counts: { jobs: 0, marketplace: 0, music: 0, services: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const abortRef = useRef(null);
    const requestIdRef = useRef(0);

    const nc = useMemo(() => normalize(county, 'All Counties'), [county]);
    const nci = useMemo(() => normalize(city, 'All Cities'), [city]);

    const fetchAll = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const rid = ++requestIdRef.current;

        setLoading(true);
        setError(null);

        const opts = { credentials: 'include', signal: controller.signal, cache: 'no-store' };

        const lp = new URLSearchParams();
        if (nc) lp.set('county', nc);
        if (nci) lp.set('city', nci);
        const loc = lp.toString();
        const amp = loc ? `${loc}&` : '';

        // People-you-may-know params
        const pymkParams = new URLSearchParams();
        pymkParams.set('limit', '5');
        if (nc) pymkParams.set('county', nc);
        if (nci) pymkParams.set('city', nci);

        try {
            const [ev, co, bz, jb, mp, mu, sv, ppl] = await Promise.allSettled([
                secureFetch(`/api/events?${amp}limit=4&sort=soonest&range=month&page=1&includeStatewide=1`, opts).then(safeJson),
                secureFetch(`/api/community?${amp}limit=4&sort=newest&includeStatewide=1&includeTotal=0`, opts).then(safeJson),
                secureFetch(`/api/business?${amp}limit=4&sort=highest_rated`, opts).then(safeJson),
                secureFetch(`/api/jobs/feed?${amp}limit=3&sort=newest`, opts).then(safeJson),
                secureFetch(`/api/marketplace/listings?${amp}limit=3&sort=newest&status=available`, opts).then(safeJson),
                secureFetch(`/api/music/artists?${amp}limit=3`, opts).then(safeJson),
                secureFetch(`/api/services/feed?${amp}limit=3`, opts).then(safeJson),
                secureFetch(`/api/community/people-you-may-know?${pymkParams.toString()}`, opts).then(safeJson).catch(() => null),
            ]);

            if (rid !== requestIdRef.current) return;

            setData({
                events:      extractItems(ev.value, 'items').slice(0, 4),
                community:   extractItems(co.value, 'posts', 'items').slice(0, 4),
                businesses:  extractItems(bz.value, 'items', 'businesses').slice(0, 4),
                jobs:        extractItems(jb.value, 'items').slice(0, 3),
                marketplace: extractItems(mp.value, 'items', 'listings').slice(0, 3),
                music:       extractItems(mu.value, 'items', 'artists').slice(0, 3),
                services:    extractItems(sv.value, 'items', 'services').slice(0, 3),
                people:      extractItems(ppl.value, 'users', 'items', 'suggestions', 'people').slice(0, 5),
                counts: {
                    jobs:        extractTotal(jb.value, 'total', 'totalCount', 'count') || extractItems(jb.value, 'items').length,
                    marketplace: extractTotal(mp.value, 'total', 'totalCount', 'count') || extractItems(mp.value, 'items', 'listings').length,
                    music:       extractTotal(mu.value, 'total', 'totalCount', 'count') || extractItems(mu.value, 'items', 'artists').length,
                    services:    extractTotal(sv.value, 'total', 'totalCount', 'count') || extractItems(sv.value, 'items', 'services').length,
                },
            });
            setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') return;
            if (rid !== requestIdRef.current) return;
            setError(err.message);
            setLoading(false);
        }
    }, [nc, nci]);

    useEffect(() => {
        fetchAll();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [fetchAll]);

    return { ...data, loading, error, refetch: fetchAll };
}
