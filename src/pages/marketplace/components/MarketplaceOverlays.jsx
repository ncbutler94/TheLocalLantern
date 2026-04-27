// src/pages/marketplace/components/MarketplaceOverlays.jsx
// Keeps modal/snackbar overlays out of the main page layout
// Hosts: CreateListingModal, DeleteListingConfirmDialog, success Snackbar

import React from "react";
import PropTypes from "prop-types";

import CreateListingModal from "../modals/CreateListingModal";
import DeleteListingConfirmDialog from "./DeleteListingConfirmDialog";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

export default function MarketplaceOverlays({
                                                user,
                                                // Create / edit modal
                                                createOpen,
                                                onCloseCreate,
                                                onCreated,
                                                onUpdated,
                                                editMode,
                                                editListingId,
                                                editInitialListing,
                                                forceYardSale,
                                                // Delete dialog
                                                deleteOpen,
                                                onCloseDelete,
                                                onConfirmDelete,
                                                deleteTitle,
                                                // Snackbar
                                                snackOpen,
                                                snackMessage,
                                                onCloseSnack,
                                            }) {
    return (
        <>
            <CreateListingModal
                open={createOpen}
                onClose={onCloseCreate}
                onCreated={onCreated}
                onUpdated={onUpdated}
                user={user}
                mode={editMode ? "edit" : "create"}
                listingId={editListingId}
                initialListing={editInitialListing}
                forceYardSale={forceYardSale}
                sx={{ zIndex: 100001 }}
            />

            <DeleteListingConfirmDialog
                open={deleteOpen}
                onClose={onCloseDelete}
                onConfirm={onConfirmDelete}
                listingTitle={deleteTitle}
                sx={{ zIndex: 100001 }}
            />

            <SuccessSnackbar
                open={snackOpen}
                onClose={onCloseSnack}
                message={snackMessage || "Done!"}
            />
        </>
    );
}

MarketplaceOverlays.propTypes = {
    user: PropTypes.object,
    createOpen: PropTypes.bool.isRequired,
    onCloseCreate: PropTypes.func.isRequired,
    onCreated: PropTypes.func.isRequired,
    onUpdated: PropTypes.func,
    editMode: PropTypes.bool,
    editListingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    editInitialListing: PropTypes.object,
    forceYardSale: PropTypes.bool,
    deleteOpen: PropTypes.bool.isRequired,
    onCloseDelete: PropTypes.func.isRequired,
    onConfirmDelete: PropTypes.func.isRequired,
    deleteTitle: PropTypes.string,
    snackOpen: PropTypes.bool.isRequired,
    snackMessage: PropTypes.string,
    onCloseSnack: PropTypes.func.isRequired,
};

MarketplaceOverlays.defaultProps = {
    user: null,
    onUpdated: undefined,
    editMode: false,
    editListingId: undefined,
    editInitialListing: null,
    forceYardSale: false,
    deleteTitle: "",
    snackMessage: "",
};
