// src/components/SmartMenu.jsx
//
// Drop-in replacement for MUI <Menu>.
// • Desktop: renders a normal MUI <Menu> with all props/children unchanged.
// • Mobile: automatically extracts MenuItems from children and renders
//   a portal-based MobileActionSheet (bottom sheet) instead.
//
// Usage — identical to MUI Menu:
//
//   import SmartMenu from '../components/SmartMenu';
//
//   <SmartMenu anchorEl={anchor} open={open} onClose={handleClose} ...>
//       <MenuItem onClick={handleCopy}>
//           <ListItemIcon><LinkIcon /></ListItemIcon>
//           <ListItemText primary="Copy link" />
//       </MenuItem>
//       <Divider />
//       <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
//           <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon /></ListItemIcon>
//           <ListItemText primary="Delete" />
//       </MenuItem>
//   </SmartMenu>
//
// To force desktop menu even on mobile, pass `forceDesktop`:
//   <SmartMenu forceDesktop anchorEl={...} ...>

import React, { useMemo } from 'react';
import { Menu, Divider, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MobileActionSheet from './MobileActionSheet';

/**
 * Recursively walk React children tree and extract action-sheet items
 * from MenuItem / Divider components.
 */
function extractItems(children) {
    const items = [];

    const walk = (node) => {
        if (!node) return;

        // Handle arrays and fragments
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }

        // React fragment
        if (node?.type === React.Fragment) {
            React.Children.forEach(node.props?.children, walk);
            return;
        }

        // Skip nulls, booleans, undefined (conditional renders)
        if (typeof node !== 'object' || node === null) return;

        const elType = node?.type;
        const displayName = elType?.displayName || elType?.muiName || elType?.name || '';
        const typeStr = typeof elType === 'string' ? elType : displayName;

        // Divider
        if (elType === Divider || typeStr === 'Divider' || typeStr === 'MuiDivider') {
            items.push({ divider: true });
            return;
        }

        // MenuItem (or wrapped in Tooltip > span > MenuItem)
        if (elType === MenuItem || typeStr === 'MenuItem' || typeStr === 'MuiMenuItem') {
            items.push(parseMenuItem(node));
            return;
        }

        // Tooltip wrapping a MenuItem (common pattern: <Tooltip><span><MenuItem>...</MenuItem></span></Tooltip>)
        if (typeStr === 'Tooltip' || typeStr === 'MuiTooltip' || displayName === 'Tooltip') {
            const inner = node.props?.children;
            walk(inner);
            return;
        }

        // <span> wrapping a MenuItem (MUI Tooltip requires a non-disabled wrapper)
        if (elType === 'span' || elType === 'div') {
            React.Children.forEach(node.props?.children, walk);
            return;
        }

        // Any other wrapper — try to recurse into its children
        if (node.props?.children) {
            React.Children.forEach(node.props.children, walk);
        }
    };

    React.Children.forEach(children, walk);
    return items;
}

/**
 * Parse a single <MenuItem> element into an action-sheet item object.
 */
function parseMenuItem(menuItemEl) {
    const props = menuItemEl?.props || {};
    const onClick = props.onClick;
    const disabled = props.disabled;
    const sx = props.sx || {};

    // Detect destructive color
    let color = null;
    if (typeof sx === 'function') {
        // Can't evaluate theme functions here, check children for error color hints
    } else if (typeof sx === 'object') {
        const c = sx.color || '';
        if (typeof c === 'string' && c.includes('error')) color = 'error';
    }

    // Walk MenuItem children to find icon and label
    let icon = null;
    let label = '';

    const walkChildren = (child) => {
        if (!child) return;
        if (typeof child === 'string') {
            label += child;
            return;
        }
        if (typeof child === 'number') {
            label += String(child);
            return;
        }
        if (typeof child !== 'object') return;

        const ct = child?.type;
        const cn = ct?.displayName || ct?.muiName || ct?.name || (typeof ct === 'string' ? ct : '');

        // ListItemIcon — extract its child as the icon
        if (ct === ListItemIcon || cn === 'ListItemIcon' || cn === 'MuiListItemIcon') {
            const iconChild = React.Children.toArray(child.props?.children)?.[0];
            if (iconChild) {
                // Check if ListItemIcon has error color
                const liSx = child.props?.sx || {};
                if (typeof liSx === 'object' && typeof liSx.color === 'string' && liSx.color.includes('error')) {
                    color = 'error';
                }
                icon = iconChild;
            }
            return;
        }

        // ListItemText — extract primary text
        if (ct === ListItemText || cn === 'ListItemText' || cn === 'MuiListItemText') {
            const primary = child.props?.primary || child.props?.children || '';
            if (typeof primary === 'string') label += primary;
            else if (React.isValidElement(primary)) {
                // Try to extract text from Typography or similar
                const innerText = primary.props?.children;
                if (typeof innerText === 'string') label += innerText;
            }
            return;
        }

        // Typography or plain text wrapper — detect by displayName OR by
        // structure (single text child, no `primary` prop)
        if (
            cn === 'Typography' ||
            cn === 'MuiTypography' ||
            typeof ct === 'string' ||
            (React.isValidElement(child) &&
                !('primary' in (child.props || {})) &&
                typeof child.props?.children === 'string')
        ) {
            const innerText = child.props?.children;
            if (typeof innerText === 'string') label += innerText;
            return;
        }

        // SVG icon component — MUI icons have muiName === 'SvgIcon' which
        // survives minification. Also match by name suffix as a fallback.
        const childMuiName = ct?.muiName || ct?.type?.muiName;
        if (
            childMuiName === 'SvgIcon' ||
            (cn && (cn.endsWith('Icon') || cn.endsWith('Rounded') || cn.endsWith('Outlined')))
        ) {
            if (!icon) icon = child;
            return;
        }

        // Stack or Box wrapper — recurse into children
        if (child.props?.children) {
            React.Children.forEach(child.props.children, walkChildren);
            return;
        }

        // Unrecognized element with no children — if we still don't have an
        // icon, treat this element as the icon (last-resort fallback for
        // production builds where component names are minified)
        if (!icon && React.isValidElement(child)) {
            icon = child;
        }
    };

    React.Children.forEach(props.children, walkChildren);

    // Wrap the click handler so it always receives an event-shaped argument.
    // The MobileActionSheet calls item.onClick() with no args, but many
    // existing MenuItem handlers are written as `(e) => { e.stopPropagation(); ... }`
    // which would crash if `e` is undefined. We pass a synthetic no-op event
    // so those handlers just work without modification.
    const wrappedOnClick = onClick
        ? () => {
            const syntheticEvent = {
                stopPropagation: () => {},
                preventDefault: () => {},
                nativeEvent: { stopImmediatePropagation: () => {} },
                currentTarget: null,
                target: null,
            };
            onClick(syntheticEvent);
        }
        : undefined;

    return {
        icon,
        label: label.trim() || 'Action',
        onClick: disabled ? undefined : wrappedOnClick,
        color,
        disabled,
    };
}

export default function SmartMenu({
                                      children,
                                      forceDesktop = false,
                                      // MobileActionSheet title (optional)
                                      sheetTitle,
                                      // All remaining props are forwarded to MUI <Menu>
                                      ...menuProps
                                  }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const useMobileSheet = isMobile && !forceDesktop;

    // Extract items from children for the mobile action sheet
    const sheetItems = useMemo(() => {
        if (!useMobileSheet) return [];
        return extractItems(children);
    }, [useMobileSheet, children]);

    // Mobile: render action sheet
    if (useMobileSheet) {
        return (
            <MobileActionSheet
                open={Boolean(menuProps.open)}
                onClose={menuProps.onClose}
                items={sheetItems}
                title={sheetTitle}
            />
        );
    }

    // Desktop: render normal MUI Menu
    return (
        <Menu {...menuProps}>
            {children}
        </Menu>
    );
}
