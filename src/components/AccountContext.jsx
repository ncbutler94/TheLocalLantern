// src/components/AccountContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

/**
 * =====================================================================
 * CENTRALIZED ACCOUNT IDENTITY CONTEXT
 * =====================================================================
 *
 * This is the SINGLE SOURCE OF TRUTH for determining which account the
 * user is currently acting as: personal, business, or artist.
 *
 * The Header sets the active account via localStorage and dispatches
 * the `ll:account:changed` event. This context listens for that event
 * and provides a reactive `activeAccount` value to consumers.
 *
 * HELPER METHODS (available from useActiveAccount()):
 *
 *   getAccountPayload()
 *     → Returns an object to spread into POST/PATCH/DELETE request bodies.
 *       Personal:  {}
 *       Business:  { business_id: 5, account_type: 'business' }
 *       Artist:    { artist_id: 12, account_type: 'artist' }
 *
 *   getAccountParams()
 *     → Returns an object to merge into GET query-string parameters.
 *       Personal:  {}
 *       Business:  { activeBusinessId: 5 }
 *       Artist:    { activeArtistId: 12 }
 *
 *   getAccountHeaders()
 *     → Returns headers that identify the active account.
 *       Always includes: x-account-type ('personal' | 'business' | 'artist')
 *       Business adds:   x-business-id
 *       Artist adds:     x-artist-id
 *       (Used by the axios interceptor – see accountInterceptor.js)
 *
 *   getCommentPayload()
 *     → Same as getAccountPayload() but also includes account display info
 *       (name, handle, avatar) for optimistic UI on comments.
 *
 *   accountCacheKey
 *     → A stable string key for React effect dependencies so components
 *       can re-fetch when the active account changes.
 *       e.g. 'personal', 'business:5', 'artist:12'
 *
 * USAGE:
 *
 *   import { useActiveAccount } from './AccountContext';
 *
 *   function MyComponent() {
 *     const {
 *       activeAccount,
 *       isBusinessAccount,
 *       isArtistAccount,
 *       activeBusinessId,
 *       activeArtistId,
 *       accountCacheKey,
 *       getAccountPayload,
 *       getAccountParams,
 *       getAccountHeaders,
 *       getCommentPayload,
 *     } = useActiveAccount();
 *
 *     // POST example:
 *     axios.post('/api/community/123/like', { ...getAccountPayload() });
 *
 *     // GET example:
 *     axios.get('/api/community', { params: { ...getAccountParams(), limit: 20 } });
 *
 *     // The axios interceptor (accountInterceptor.js) also auto-attaches
 *     // headers on every request as a safety net.
 *   }
 *
 * IMPORTANT: The useActiveAccount() hook works both WITH and WITHOUT
 * the AccountProvider in the component tree. If the provider is missing,
 * it falls back to reading directly from localStorage + event listeners.
 */

const ACTIVE_ACCOUNT_KEY = 'll:activeAccount';

function readActiveAccount() {
    try {
        const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

function deriveAccountFields(activeAccount) {
    const acctType = (
        activeAccount?.type ||
        activeAccount?.account_type ||
        activeAccount?.accountType ||
        'personal'
    ).toLowerCase();

    const isBusinessAccount = acctType === 'business';
    const isArtistAccount = acctType === 'artist';

    const activeAccountId = activeAccount?.id || activeAccount?.account_id || 'personal';
    const activeAccountType = acctType;

    let activeBusinessId = null;
    if (isBusinessAccount) {
        // Prefer the explicit businessId / business_id fields — these point to
        // the businesses table PK. The generic `id` may be a business_accounts
        // join-table row ID which won't match the business's own id.
        const raw =
            activeAccount?.businessId ??
            activeAccount?.business_id ??
            activeAccount?.id ??
            activeAccount?.account_id ??
            null;
        const num = Number(raw);
        activeBusinessId = Number.isFinite(num) && num > 0 ? num : raw;
    }

    let activeArtistId = null;
    if (isArtistAccount) {
        const rawId = activeAccount?.artistId ?? activeAccount?.artist_id ?? null;
        if (rawId != null) {
            activeArtistId = Number(rawId) || null;
        } else {
            const idStr = String(activeAccount?.id || '');
            if (idStr.startsWith('artist:')) {
                const num = Number(idStr.replace('artist:', ''));
                activeArtistId = Number.isFinite(num) && num > 0 ? num : null;
            } else {
                // Fallback: activeAccount.id IS the artist ID (e.g. { id: 5, type: 'artist' })
                const num = Number(activeAccount?.id);
                activeArtistId = Number.isFinite(num) && num > 0 ? num : null;
            }
        }
    }

    // Stable cache key for React effect dependency arrays.
    // Changes whenever the active account identity changes.
    let accountCacheKey = 'personal';
    if (isBusinessAccount && activeBusinessId) {
        accountCacheKey = `business:${activeBusinessId}`;
    } else if (isArtistAccount && activeArtistId) {
        accountCacheKey = `artist:${activeArtistId}`;
    }

    return {
        activeAccount,
        isBusinessAccount,
        isArtistAccount,
        activeAccountId,
        activeAccountType,
        activeBusinessId,
        activeArtistId,
        accountCacheKey,
    };
}

/**
 * Build the centralized helper functions from derived fields.
 * These are stable closures over the current account state.
 */
function buildAccountHelpers(derived) {
    const {
        activeAccount,
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
    } = derived;

    const getAccountPayload = () => {
        if (isBusinessAccount && activeBusinessId) {
            return {
                business_id: activeBusinessId,
                account_type: 'business',
            };
        }
        if (isArtistAccount && activeArtistId) {
            return {
                artist_id: activeArtistId,
                account_type: 'artist',
            };
        }
        return {};
    };

    const getAccountParams = () => {
        if (isBusinessAccount && activeBusinessId) {
            return { activeBusinessId };
        }
        if (isArtistAccount && activeArtistId) {
            return { activeArtistId };
        }
        return {};
    };

    const getAccountHeaders = () => {
        const headers = {};
        if (isBusinessAccount && activeBusinessId) {
            headers['x-account-type'] = 'business';
            headers['x-business-id'] = String(activeBusinessId);
        } else if (isArtistAccount && activeArtistId) {
            headers['x-account-type'] = 'artist';
            headers['x-artist-id'] = String(activeArtistId);
        } else {
            headers['x-account-type'] = 'personal';
        }
        return headers;
    };

    const getCommentPayload = () => {
        const base = getAccountPayload();
        if (isBusinessAccount && activeBusinessId && activeAccount) {
            return {
                ...base,
                account_id: activeBusinessId,
                account_handle: activeAccount.slug || activeAccount.handle || '',
                account_name: activeAccount.name || '',
                account_avatar_url: activeAccount.avatar_url || activeAccount.logo_url || '',
            };
        }
        if (isArtistAccount && activeArtistId && activeAccount) {
            return {
                ...base,
                account_id: activeArtistId,
                account_handle: activeAccount.slug || activeAccount.handle || '',
                account_name: activeAccount.name || '',
                account_avatar_url: activeAccount.avatar_url || '',
            };
        }
        return base;
    };

    return {
        getAccountPayload,
        getAccountParams,
        getAccountHeaders,
        getCommentPayload,
    };
}

// ── Context ──────────────────────────────────────────────────────────

// Sentinel value to detect when no provider is present.
const NO_PROVIDER = '__no_provider__';

const AccountContext = createContext(NO_PROVIDER);

export function AccountProvider({ children }) {
    const [activeAccount, setActiveAccount] = useState(() => readActiveAccount());

    const refreshActiveAccount = useCallback(() => {
        setActiveAccount(readActiveAccount());
    }, []);

    useEffect(() => {
        const handleAccountChanged = (e) => {
            const nextAccount = e?.detail?.account || null;
            if (nextAccount && typeof nextAccount === 'object' && nextAccount.id) {
                setActiveAccount(nextAccount);
            } else {
                setActiveAccount(readActiveAccount());
            }
            // Flush all ActionBar in-memory caches so stale liked/reposted
            // state from the previous account doesn't persist.
            try {
                window.dispatchEvent(new CustomEvent('ll:action-cache:flush'));
            } catch { /* no-op */ }
        };

        const handleStorage = (e) => {
            if (e.key === ACTIVE_ACCOUNT_KEY) {
                setActiveAccount(readActiveAccount());
                try {
                    window.dispatchEvent(new CustomEvent('ll:action-cache:flush'));
                } catch { /* no-op */ }
            }
        };

        window.addEventListener('ll:account:changed', handleAccountChanged);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ll:account:changed', handleAccountChanged);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const derived = deriveAccountFields(activeAccount);
    const accountCacheKey = derived.accountCacheKey;

    // Memoize helpers so the context value has a stable identity when the
    // underlying account hasn't actually changed. This prevents consumers
    // from re-rendering on every parent render.
    const helpers = useMemo(
        () => buildAccountHelpers(derived),
        // accountCacheKey is a stable primitive that changes only when the
        // account identity changes (e.g. 'personal' → 'business:5').
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accountCacheKey]
    );

    // Memoize the entire context value object.
    const value = useMemo(
        () => ({
            ...derived,
            ...helpers,
            refreshActiveAccount,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accountCacheKey, refreshActiveAccount]
    );

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
}

/**
 * Standalone hook that reads the active account from localStorage + events.
 * Works even when AccountProvider is NOT in the component tree.
 *
 * NOTE: Unlike the old implementation, this no longer calls
 * setActiveAccount(readActiveAccount()) inside useEffect on mount.
 * The initial state already comes from readActiveAccount() via the
 * useState initializer — calling it again in the effect was redundant
 * and caused a cascade of re-renders that led to "Maximum update depth exceeded".
 */
function useActiveAccountStandalone() {
    const [activeAccount, setActiveAccount] = useState(() => readActiveAccount());

    useEffect(() => {
        const handleAccountChanged = (e) => {
            const nextAccount = e?.detail?.account || null;
            if (nextAccount && typeof nextAccount === 'object' && nextAccount.id) {
                setActiveAccount(nextAccount);
            } else {
                setActiveAccount(readActiveAccount());
            }
            try {
                window.dispatchEvent(new CustomEvent('ll:action-cache:flush'));
            } catch { /* no-op */ }
        };

        const handleStorage = (e) => {
            if (e.key === ACTIVE_ACCOUNT_KEY) {
                setActiveAccount(readActiveAccount());
                try {
                    window.dispatchEvent(new CustomEvent('ll:action-cache:flush'));
                } catch { /* no-op */ }
            }
        };

        // NOTE: Removed the unconditional setActiveAccount(readActiveAccount())
        // that was here before. The useState initializer already reads from
        // localStorage — doing it again here triggers a state update on every
        // mount, causing an infinite render loop when the returned object
        // (derived + helpers) gets new references each time.

        window.addEventListener('ll:account:changed', handleAccountChanged);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ll:account:changed', handleAccountChanged);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const refreshActiveAccount = useCallback(() => {
        setActiveAccount(readActiveAccount());
    }, []);

    const derived = deriveAccountFields(activeAccount);
    const accountCacheKey = derived.accountCacheKey;

    // Memoize helpers so the returned value is referentially stable
    // when the account hasn't changed.
    const helpers = useMemo(
        () => buildAccountHelpers(derived),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accountCacheKey]
    );

    return useMemo(
        () => ({
            ...derived,
            ...helpers,
            refreshActiveAccount,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accountCacheKey, refreshActiveAccount]
    );
}

/**
 * Hook to access the active account.
 *
 * If AccountProvider is in the tree, uses the context.
 * If NOT, falls back to reading localStorage directly (standalone mode).
 *
 * ⚠️  Both code paths must always execute (hooks can't be conditional),
 * so we always call useActiveAccountStandalone(). However, its return
 * value is only used when no provider is present. The standalone hook
 * is now properly memoized and no longer triggers mount-time setState,
 * so the cost of calling it unconditionally is minimal.
 *
 * Returns:
 *   - activeAccount: the full account object (or null for personal)
 *   - isBusinessAccount: boolean
 *   - isArtistAccount: boolean
 *   - activeAccountId: 'personal' or a business/artist account ID
 *   - activeAccountType: 'personal', 'business', or 'artist'
 *   - activeBusinessId: numeric business ID or null
 *   - activeArtistId: numeric artist ID or null
 *   - accountCacheKey: stable string for effect deps ('personal', 'business:5', 'artist:12')
 *   - getAccountPayload: () => object for POST bodies
 *   - getAccountParams: () => object for GET query params
 *   - getAccountHeaders: () => object for HTTP headers
 *   - getCommentPayload: () => extended object for comment POST bodies
 *   - refreshActiveAccount: function to manually refresh
 */
export function useActiveAccount() {
    const ctx = useContext(AccountContext);
    const standalone = useActiveAccountStandalone();

    // If the context value is the sentinel, the provider is missing — use standalone
    if (ctx === NO_PROVIDER) {
        return standalone;
    }

    return ctx;
}

export default AccountContext;
