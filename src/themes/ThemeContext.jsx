// src/themes/ThemeContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DEFAULT_THEME, getThemeById, THEMES } from './index';

const LS_PREFIX = 'll:theme';
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const ThemeCtx = createContext({ themeId: DEFAULT_THEME, setThemeId: () => {}, themes: THEMES });
export const useThemeSelector = () => useContext(ThemeCtx);

const isValid = (id) => id && THEMES.some((t) => t.id === id);

/* ── Account-scoped localStorage helpers ──────────────────────────────────── */
function accountKey(activeAccount) {
    if (!activeAccount || activeAccount.type === 'personal') return LS_PREFIX;
    return `${LS_PREFIX}:${activeAccount.type}:${activeAccount.id}`;
}
function readLocal(activeAccount) {
    try { return localStorage.getItem(accountKey(activeAccount)) || null; } catch { return null; }
}
function writeLocal(id, activeAccount) {
    try { localStorage.setItem(accountKey(activeAccount), id); } catch {}
}

/* ── Resolve theme: localStorage wins, then server pref, then default ───── */
function resolveTheme(user, activeAccount) {
    // 1. localStorage is the source of truth (written on every pick)
    const cached = readLocal(activeAccount);
    if (isValid(cached)) return cached;

    // 2. Server-side preference (first login / fresh device)
    if (isValid(user?.theme_preference)) {
        writeLocal(user.theme_preference, activeAccount);
        return user.theme_preference;
    }

    // 3. Default
    return DEFAULT_THEME;
}

export default function ThemeContextProvider({ children, user, activeAccount }) {
    const [themeId, setThemeIdRaw] = useState(() => resolveTheme(user, activeAccount));

    // Track account identity to detect profile swaps
    const prevAccountRef = useRef(activeAccount?.id ?? 'personal');
    // Track whether the user has ever explicitly picked a theme in this session
    // so we don't let a late-arriving server pref overwrite their choice
    const userPickedRef = useRef(false);

    // Re-resolve on account swap or when user data arrives for the first time
    useEffect(() => {
        const currentAccountId = activeAccount?.id ?? 'personal';
        const accountChanged = currentAccountId !== prevAccountRef.current;
        prevAccountRef.current = currentAccountId;

        if (accountChanged) {
            // Profile swap → load that account's theme
            userPickedRef.current = false;
            setThemeIdRaw(resolveTheme(user, activeAccount));
            return;
        }

        // Same account — only apply the server pref if we have NO local cache
        // (e.g. brand-new device, first login). If localStorage already has a
        // value, trust it — it was written by the user's last explicit pick.
        if (!userPickedRef.current && isValid(user?.theme_preference)) {
            const cached = readLocal(activeAccount);
            if (!cached) {
                writeLocal(user.theme_preference, activeAccount);
                setThemeIdRaw(user.theme_preference);
            }
        }
    }, [user?.theme_preference, activeAccount?.id, activeAccount?.type]);

    const setThemeId = useCallback((id) => {
        if (!isValid(id)) return;
        userPickedRef.current = true;
        setThemeIdRaw(id);
        writeLocal(id, activeAccount);

        // Persist to server
        if (user?.id) {
            const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
            const params = new URLSearchParams();
            if (activeAccount && activeAccount.type !== 'personal' && activeAccount.id) {
                params.set('account_id', activeAccount.id);
                params.set('account_type', activeAccount.type);
            }
            const qs = params.toString();
            fetch(`${API_BASE}/api/users/me/theme${qs ? `?${qs}` : ''}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ theme: id }),
            }).catch(() => {});
        }
    }, [user?.id, activeAccount]);

    const muiTheme = useMemo(() => getThemeById(themeId), [themeId]);
    const ctx = useMemo(() => ({ themeId, setThemeId, themes: THEMES }), [themeId, setThemeId]);

    return (
        <ThemeCtx.Provider value={ctx}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline/>
                {children}
            </MuiThemeProvider>
        </ThemeCtx.Provider>
    );
}
