// backend/src/middleware/extractAccountContext.js
//
// =====================================================================
// CENTRALIZED ACCOUNT IDENTITY EXTRACTION — Express middleware
// =====================================================================
//
// Attaches `req.accountContext` to every request with:
//
//   {
//     accountType:  'personal' | 'business' | 'artist',
//     businessId:   number | null,
//     artistId:     number | null,
//     isPersonal:   boolean,
//     isBusiness:   boolean,
//     isArtist:     boolean,
//   }
//
// CASCADING RESOLUTION (first non-empty source wins):
//
//   1. Headers:  x-account-type, x-business-id, x-artist-id
//                (set automatically by the frontend axios interceptor)
//
//   2. Body:     business_id, artist_id, account_type
//                (set explicitly by components via getAccountPayload())
//
//   3. Query:    activeBusinessId, activeArtistId
//                (set explicitly by components via getAccountParams())
//
// This means even if a component forgets to pass body/query fields,
// the interceptor headers will still identify the correct account.
//
// INSTALLATION:
//
//   import extractAccountContext from './middleware/extractAccountContext.js';
//
//   // Apply globally (recommended):
//   app.use(extractAccountContext);
//
//   // Or per-route:
//   router.post('/like', authenticateToken, extractAccountContext, handler);
//
// USAGE IN ROUTE HANDLERS:
//
//   const { businessId, artistId, accountType, isBusiness, isArtist } = req.accountContext;
//
//   // For inserts:
//   const insert = {
//     user_id: req.user.id,
//     ...(businessId ? { business_id: businessId } : {}),
//     ...(artistId  ? { artist_id: artistId }    : {}),
//   };
//
//   // For queries:
//   const viewerLikedSql = buildViewerLikedSql(req.user.id, businessId, artistId);
//
// =====================================================================

/**
 * Parse a raw value into a positive integer or null.
 * @param {*} raw
 * @returns {number|null}
 */
function parsePositiveInt(raw) {
    if (raw === null || raw === undefined || raw === '' || raw === '0') return null;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Express middleware that extracts account identity from the request.
 */
function extractAccountContext(req, _res, next) {
    let accountType = 'personal';
    let businessId = null;
    let artistId = null;

    // ---------------------------------------------------------------
    // Source 1: Headers (set by the axios interceptor — most reliable)
    // ---------------------------------------------------------------
    const headerType = String(req.headers?.['x-account-type'] || '').toLowerCase().trim();
    const headerBizId = parsePositiveInt(req.headers?.['x-business-id']);
    const headerArtId = parsePositiveInt(req.headers?.['x-artist-id']);

    if (headerType === 'business' && headerBizId) {
        accountType = 'business';
        businessId = headerBizId;
    } else if (headerType === 'artist' && headerArtId) {
        accountType = 'artist';
        artistId = headerArtId;
    } else if (headerType === 'personal') {
        accountType = 'personal';
    }

    // ---------------------------------------------------------------
    // Source 2: Request body (for POST/PATCH/DELETE)
    // Only override if headers didn't resolve to business/artist.
    // ---------------------------------------------------------------
    if (accountType === 'personal' && req.body && typeof req.body === 'object') {
        const bodyBizId = parsePositiveInt(req.body.business_id);
        const bodyArtId = parsePositiveInt(req.body.artist_id);
        const bodyType = String(req.body.account_type || '').toLowerCase().trim();

        if (bodyType === 'business' && bodyBizId) {
            accountType = 'business';
            businessId = bodyBizId;
        } else if (bodyType === 'artist' && bodyArtId) {
            accountType = 'artist';
            artistId = bodyArtId;
        } else if (bodyBizId) {
            accountType = 'business';
            businessId = bodyBizId;
        } else if (bodyArtId) {
            accountType = 'artist';
            artistId = bodyArtId;
        }
    }

    // ---------------------------------------------------------------
    // Source 3: Query parameters (for GET requests)
    // Only override if headers + body didn't resolve.
    // ---------------------------------------------------------------
    if (accountType === 'personal' && req.query) {
        const queryBizId = parsePositiveInt(req.query.activeBusinessId);
        const queryArtId = parsePositiveInt(req.query.activeArtistId);

        if (queryBizId) {
            accountType = 'business';
            businessId = queryBizId;
        } else if (queryArtId) {
            accountType = 'artist';
            artistId = queryArtId;
        }
    }

    // ---------------------------------------------------------------
    // Attach to request
    // ---------------------------------------------------------------
    req.accountContext = {
        accountType,
        businessId,
        artistId,
        isPersonal: accountType === 'personal',
        isBusiness: accountType === 'business',
        isArtist: accountType === 'artist',
    };

    next();
}

export default extractAccountContext;
