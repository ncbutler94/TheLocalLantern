// src/utils/commentBlockUtils.js
// =============================================================================
// Shared client-side utilities for entity-aware comment blocking.
//
// When a personal account is blocked, only their PERSONAL comments are hidden.
// Comments posted as a business or artist account remain visible unless that
// specific business/artist was also blocked.
// =============================================================================

/**
 * Check if a comment node is from a blocked entity.
 *
 * Entity-aware: a personal block only hides personal comments, not comments
 * posted as a business or artist account owned by that person.
 *
 * @param {object} node - Comment object with user_id, business_id, artist_id, etc.
 * @param {object} sets - Blocked ID sets
 * @param {Set<number>} sets.blockedUserIds - Personal user IDs
 * @param {Set<number>} sets.blockedBusinessIds - Business entity IDs
 * @param {Set<number>} sets.blockedArtistIds - Artist entity IDs
 * @param {Set<string>} [sets.blockedHandles] - Lowercase handles
 * @returns {boolean}
 */
export function isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles }) {
    if (!node) return false;

    const cUserId = Number(node.user_id || 0);
    const cPublicId = Number(node.public_id || 0);
    const cBizId = Number(node.business_id || 0);
    const cArtId = Number(node.artist_id || 0);
    const cHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || '').toLowerCase().trim();
    const cAccountType = String(node.account_type || '').toLowerCase();

    const isBusinessComment = cBizId > 0 || cAccountType === 'business';
    const isArtistComment = cArtId > 0 || cAccountType === 'artist';

    // Business comment: only block if that specific business is blocked
    if (isBusinessComment && blockedBusinessIds && blockedBusinessIds.size > 0 && cBizId > 0) {
        if (blockedBusinessIds.has(cBizId)) return true;
    }

    // Artist comment: only block if that specific artist is blocked
    if (isArtistComment && blockedArtistIds && blockedArtistIds.size > 0 && cArtId > 0) {
        if (blockedArtistIds.has(cArtId)) return true;
    }

    // Personal comment (not business, not artist): check personal blocked set
    if (!isBusinessComment && !isArtistComment) {
        if (blockedUserIds && blockedUserIds.size > 0) {
            if ((cUserId > 0 && blockedUserIds.has(cUserId)) ||
                (cPublicId > 0 && blockedUserIds.has(cPublicId))) {
                return true;
            }
        }
        if (blockedHandles && blockedHandles.size > 0 && cHandle && blockedHandles.has(cHandle)) {
            return true;
        }
    }

    return false;
}

/**
 * Parse moderation-state API response into blocked ID sets.
 *
 * @param {object} data - Response from /api/users/moderation-state
 * @returns {{ blockedUserIds: Set<number>, blockedBusinessIds: Set<number>, blockedArtistIds: Set<number> }}
 */
export function parseBlockedSets(data) {
    const toSet = (arr) => new Set(
        (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
    );
    return {
        blockedUserIds: toSet(data?.blocked_user_ids),
        blockedBusinessIds: toSet(data?.blocked_business_ids),
        blockedArtistIds: toSet(data?.blocked_artist_ids),
    };
}

/**
 * Route a block-changed event to the correct setter based on targetType.
 *
 * @param {CustomEvent} e - The ll:user:blocked-changed event
 * @param {Function} setBlockedUserIds
 * @param {Function} setBlockedBusinessIds
 * @param {Function} setBlockedArtistIds
 */
export function handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds) {
    const uid = Number(e?.detail?.userId || 0);
    if (!uid) return;
    const blocked = Boolean(e?.detail?.blocked);
    const targetType = String(e?.detail?.targetType || 'personal').toLowerCase();

    const updater = (prev) => {
        const next = new Set(prev);
        if (blocked) next.add(uid);
        else next.delete(uid);
        return next;
    };

    if (targetType === 'business') setBlockedBusinessIds(updater);
    else if (targetType === 'artist') setBlockedArtistIds(updater);
    else setBlockedUserIds(updater);
}
