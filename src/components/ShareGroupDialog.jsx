// src/components/ShareGroupDialog.jsx
//
// Backward-compatible shim — delegates to the unified ShareDialog.
// Safe to delete once all consumers import ShareDialog directly.
//
import React from 'react';
import ShareDialog from './ShareDialog';

export default function ShareGroupDialog(props) {
    return <ShareDialog {...props} contentType="group" />;
}
