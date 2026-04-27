// src/components/SidePanel/Community/NewCommunityPosts/usePostHandlers.js
// -----------------------------------------------------------------------------
// Extracted post-submit handlers, previously inline in NewPostDialogs.jsx.
//
// This lets both the existing 2-step flow (NewPostDialogs) and the new
// SmartPostDialog (inline-composer flow) share the exact same submit logic
// without duplication.
//
// No behavior change — these are the same functions as before, just moved.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';
import { secureFetch } from '../../../utils/secureFetch';

/**
 * Fire-and-forget: tell the backend to process @mentions in the newly created
 * post's description and create notifications for tagged users.
 */
function processMentions(postId) {
    if (!postId) return;
    try {
        secureFetch(`/api/community/${postId}/process-mentions`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        }).catch(() => {
            /* best-effort, never block */
        });
    } catch {
        // ignore
    }
}

/**
 * Shared FormData-POST helper with the same event-dispatch + mention-processing
 * behavior that NewPostDialogs used.
 */
async function postFormData(url, formData, failMsg) {
    const res = await secureFetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
    if (!res.ok) {
        const msg = (await res.text()) || failMsg;
        throw new Error(msg);
    }
    const data = await res.json();

    try {
        window.dispatchEvent(
            new CustomEvent('ll:communityPost:created', {
                detail: { id: data?.id, post: data },
            }),
        );
    } catch {
        // ignore
    }

    processMentions(data?.id);
    return data;
}

/**
 * usePostHandlers()
 *
 * Returns a stable object containing every category-specific submit function.
 * Pass the result as `postHandlers` to SmartPostDialog, or consume individual
 * handlers as props in NewPostDialogs.
 */
export default function usePostHandlers() {
    return useMemo(
        () => ({
            postLostAndFound: (fd) =>
                postFormData(
                    '/api/lost-and-found',
                    fd,
                    'Failed to submit lost & found.',
                ),

            postAnnouncement: (fd) =>
                postFormData(
                    '/api/announcements',
                    fd,
                    'Failed to submit announcement.',
                ),

            postGeneralDiscussion: (fd) =>
                postFormData(
                    '/api/community-chat',
                    fd,
                    'Failed to submit Discussion post.',
                ),

            postPublicSafety: (fd) =>
                postFormData(
                    '/api/public-safety',
                    fd,
                    'Failed to submit public safety alert.',
                ),

            postRecommendation: (fd) =>
                postFormData(
                    '/api/recommendations',
                    fd,
                    'Failed to submit recommendation/tip.',
                ),

            // Polls send JSON, not FormData.
            postPoll: async (payload) => {
                const res = await secureFetch('/api/polls', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const msg =
                        (await res.text()) || 'Failed to submit poll.';
                    throw new Error(msg);
                }
                const data = await res.json();
                try {
                    window.dispatchEvent(
                        new CustomEvent('ll:communityPost:created', {
                            detail: { id: data?.id, post: data },
                        }),
                    );
                } catch {
                    // ignore
                }
                processMentions(data?.id);
                return data;
            },

            // Volunteer/Help submits inside its own dialog via createVolunteerRequest().
            // Kept here as a stub for API symmetry / future use.
            postVolunteerHelp: null,
        }),
        [],
    );
}
