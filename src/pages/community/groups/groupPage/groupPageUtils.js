// src/pages/community/groups/groupPageUtils.js
// Pure helpers for GroupPage (no React hooks)

import React from "react";
import GroupIcon from "@mui/icons-material/Group";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

export const TAB = Object.freeze({
    POSTS: "posts",
    ABOUT: "about",
    MEMBERS: "members",
    RULES: "rules",
    PHOTOS: "photos",
    ADMIN: "admin",
});

export const PAGE_SIZE = 50;

export const MEMBERS_ENDPOINT = (id, qs) =>
    `/api/groups/${encodeURIComponent(String(id))}/members${qs || ""}`;

export function normalizeLower(v) {
    return String(v || "").trim().toLowerCase();
}

export function isPrivateGroup(group) {
    const visibility = normalizeLower(group?.visibility);
    return visibility === "private" || visibility === "hidden" || Boolean(group?.is_private);
}

export function membershipFlags(viewerMembership) {
    const status = normalizeLower(viewerMembership?.status);
    return {
        isMember: status === "joined",
        hasRequested: status === "pending" || status === "invited",
    };
}

export function canViewPosts(group, viewerMembership) {
    if (!group) return false;
    if (!isPrivateGroup(group)) return true;
    return membershipFlags(viewerMembership).isMember;
}

export function canViewMembers(group, viewerMembership) {
    if (!group) return false;
    if (!isPrivateGroup(group)) return true;
    return membershipFlags(viewerMembership).isMember;
}

export function membershipBadge(viewerMembership) {
    const flags = membershipFlags(viewerMembership);
    if (flags.hasRequested) return { label: "Requested", icon: <GroupIcon fontSize="small" /> };
    if (!flags.isMember) return null;

    const role = normalizeLower(viewerMembership?.role);
    if (role === "owner") return { label: "Owner", icon: <WorkspacePremiumIcon fontSize="small" /> };
    if (role === "admin") return { label: "Admin", icon: <AdminPanelSettingsIcon fontSize="small" /> };
    return { label: "Member", icon: <GroupIcon fontSize="small" /> };
}

export function formatCount(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return 0;
    return num;
}

export function pluralize(count, word) {
    return count === 1 ? word : `${word}s`;
}

export function safeName(u) {
    const first = u?.first_name || u?.firstName || "";
    const last = u?.last_name || u?.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || u?.name || u?.username || u?.handle || "User";
}

export function safeHandleNoAt(u) {
    return String(u?.handle || u?.username || u?.public_id || "").replace(/^@/, "").trim();
}

export function safeHandle(u) {
    const h = safeHandleNoAt(u);
    return h ? `@${h}` : "@user";
}

export function dateRangeToMs(dateRange) {
    const v = String(dateRange || "all").trim().toLowerCase();
    if (v === "24h") return 86_400_000;
    if (v === "7d") return 604_800_000;
    if (v === "30d") return 2_592_000_000;
    return null;
}

export function getDateMsForPost(p) {
    const raw = p?.posted_at || p?.postedAt || p?.date_created || p?.created_at || p?.createdAt || null;
    const d = raw ? new Date(raw) : null;
    const ms = d ? d.getTime() : 0;
    return Number.isNaN(ms) ? 0 : ms;
}

export function getLikesCountForPost(p) {
    return Number(p?.likesCount ?? p?.likes_count ?? p?.like_count ?? p?.likes ?? 0) || 0;
}

export function getCommentsCountForPost(p) {
    return Number(p?.commentsCount ?? p?.comments_count ?? p?.comment_count ?? p?.comments ?? 0) || 0;
}

export function getRepostsCountForPost(p) {
    return Number(p?.repostsCount ?? p?.reposts_count ?? p?.repost_count ?? p?.reposts ?? 0) || 0;
}

export function getPopularityScoreForPost(p) {
    const likes = getLikesCountForPost(p);
    const comments = getCommentsCountForPost(p);
    const reposts = getRepostsCountForPost(p);
    return likes + comments * 2 + reposts * 3;
}
