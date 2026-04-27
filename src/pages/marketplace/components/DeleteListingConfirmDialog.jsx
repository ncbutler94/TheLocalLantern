import React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function DeleteListingConfirmDialog({ open, onClose, onConfirm, listingTitle }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ pr: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                    Delete listing?
                </Typography>
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ position: "absolute", right: 10, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                        This will permanently remove the listing from Marketplace. This action cannot be undone.
                    </Typography>
                    {listingTitle ? (
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            &ldquo;{listingTitle}&rdquo;
                        </Typography>
                    ) : null}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    color="error"
                    sx={(t) => ({
                        textTransform: "none",
                        fontWeight: 950,
                        borderRadius: 999,
                        boxShadow: `0 6px 14px ${alpha(t.palette.error.main, 0.3)}`,
                    })}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

DeleteListingConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    listingTitle: PropTypes.string,
};

DeleteListingConfirmDialog.defaultProps = {
    listingTitle: "",
};
