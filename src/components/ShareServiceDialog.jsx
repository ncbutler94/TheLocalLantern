// src/pages/services/components/ShareServiceDialog.jsx
//
// Backward-compatible shim — delegates to the unified ShareDialog.
// Automatically sets contentType to 'service_request' when a request prop
// is provided, or 'service' otherwise.
// Safe to delete once all consumers import ShareDialog directly.
//
import React from 'react';
import ShareDialog from '../components/ShareDialog';

export default function ShareServiceDialog({ sx, ...props }) {
    const type = props.request ? 'service_request' : 'service';
    return <ShareDialog {...props} contentType={type} dialogSx={sx} />;
}
