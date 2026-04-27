// src/pages/marketplace/components/ShareListingDialog.jsx
//
// Backward-compatible shim — delegates to the unified ShareDialog.
// Safe to delete once all consumers import ShareDialog directly.
//
import React from 'react';
import ShareDialog from '../components/ShareDialog';

export default function ShareListingDialog(props) {
    return <ShareDialog {...props} contentType="listing" />;
}
