// src/components/ShareEventDialog.jsx
//
// Backward-compatible shim — delegates to the unified ShareDialog.
// Safe to delete once all consumers import ShareDialog directly.
//
import React from 'react';
import ShareDialog from './ShareDialog';

export default function ShareEventDialog(props) {
    return <ShareDialog {...props} contentType="event" />;
}
