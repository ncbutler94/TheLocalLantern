// src/pages/home/hooks/usePeopleYouMayKnow.js
//
// Algorithm:
// 1. If logged in → fetch the user's following list via /users/social/:handle
// 2. For each person they follow, get THEIR following list (friends-of-friends)
// 3. Filter out: self, already-following, blocked users
// 4. Rank by: number of mutual connections (how many of your friends follow them)
// 5. Fallback: if no mutual connections or not logged in → search by location
// 6. Always mix in some location-based suggestions for diversity

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccountHeaders } from '../utils/getAccountHeadersStatic';
import { secureFetch } from '../utils/secureFetch';

const API = process.env.REACT_APP_API_URL || '';

async function safeFetch(url) {
    try {
        const res = await secureFetch(url, {
            credentials: 'include',
            headers: { Accept: 'application/json', ...getAccountHeaders() },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default function usePeopleYouMayKnow({
                                                userId = null,
                                                userHandle = '',
                                                userCity = '',
                                                userCounty = '',
                                                selectedCity = '',
                                                selectedCounty = '',
                                                isLoggedIn = false,
                                                limit = 8,
                                            } = {}) {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    const fetchSuggestions = useCallback(async () => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setLoading(true);

        try {
            const city = selectedCity || userCity || '';
            const county = selectedCounty || userCounty || '';
            const suggestions = new Map(); // id → { user, score }
            const alreadyFollowing = new Set();
            const selfId = Number(userId) || 0;

            // ── Step 1: If logged in, get following list and build mutual graph ──
            if (isLoggedIn && userHandle) {
                const socialData = await safeFetch(
                    `${API}/users/social/${encodeURIComponent(userHandle)}?type=following`
                );

                const following = Array.isArray(socialData?.following)
                    ? socialData.following
                    : [];

                // Track who we already follow
                following.forEach((u) => {
                    const id = Number(u?.id);
                    if (id) alreadyFollowing.add(id);
                });

                // ── Step 2: For up to 10 friends, get THEIR following ──
                const friendSample = following.slice(0, 10);
                const friendFollowingPromises = friendSample.map(async (friend) => {
                    const handle = friend?.handle || friend?.public_id || friend?.id;
                    if (!handle) return [];
                    const data = await safeFetch(
                        `${API}/users/social/${encodeURIComponent(handle)}?type=following`
                    );
                    return Array.isArray(data?.following) ? data.following : [];
                });

                const friendFollowings = await Promise.all(friendFollowingPromises);

                // ── Step 3: Count mutual connections ──
                friendFollowings.forEach((fofList) => {
                    fofList.forEach((fof) => {
                        const fofId = Number(fof?.id);
                        if (!fofId || fofId === selfId || alreadyFollowing.has(fofId)) return;

                        const existing = suggestions.get(fofId);
                        if (existing) {
                            existing.score += 1;
                        } else {
                            suggestions.set(fofId, { user: fof, score: 1 });
                        }
                    });
                });
            }

            // ── Step 4: Location-based fallback/supplement ──
            const locationParams = new URLSearchParams();
            if (county) locationParams.set('county', county);
            if (city) locationParams.set('city', city);
            locationParams.set('limit', '20');
            locationParams.set('offset', '0');

            const searchData = await safeFetch(
                `${API}/users/search?${locationParams.toString()}`
            );

            const locationUsers = Array.isArray(searchData)
                ? searchData
                : Array.isArray(searchData?.users)
                    ? searchData.users
                    : Array.isArray(searchData?.items)
                        ? searchData.items
                        : [];

            locationUsers.forEach((u) => {
                const id = Number(u?.id);
                if (!id || id === selfId || alreadyFollowing.has(id)) return;

                const existing = suggestions.get(id);
                if (existing) {
                    // Boost score slightly for being in same location
                    existing.score += 0.5;
                } else {
                    suggestions.set(id, { user: u, score: 0.5 });
                }
            });

            // ── Step 5: Sort by score (most mutuals first), then take top N ──
            const sorted = Array.from(suggestions.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map((entry) => ({
                    ...entry.user,
                    _mutualCount: Math.floor(entry.score),
                    _fromLocation: entry.score < 1,
                }));

            setPeople(sorted);
        } catch (err) {
            console.error('usePeopleYouMayKnow error:', err);
            setPeople([]);
        } finally {
            setLoading(false);
        }
    }, [userId, userHandle, userCity, userCounty, selectedCity, selectedCounty, isLoggedIn, limit]);

    // Reset when location changes
    useEffect(() => {
        fetchedRef.current = false;
    }, [selectedCity, selectedCounty]);

    return { people, loading, fetchSuggestions };
}
