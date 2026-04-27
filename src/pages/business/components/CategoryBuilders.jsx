// src/pages/business/components/CategoryBuilders.jsx
//
// Phase 2 builder components for category-specific data.
// Each builder manages a list of items with add/edit/delete + optional photo upload.
// All data is stored in category_data_json under specific keys.

import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import HotelIcon from '@mui/icons-material/Hotel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

// ─── Shared: Photo thumbnail + upload button ──────────────────────
function PhotoUploadSlot({ photoUrl, onUpload, onRemove, uploading, size = 100 }) {
    const inputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <Box sx={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
            {photoUrl ? (
                <Box
                    component="img"
                    src={photoUrl}
                    alt="Item"
                    sx={{
                        width: size, height: size, borderRadius: 2,
                        objectFit: 'cover', border: '1px solid',
                        borderColor: 'divider', display: 'block',
                    }}
                />
            ) : (
                <Box
                    onClick={() => inputRef.current?.click()}
                    sx={{
                        width: size, height: size, borderRadius: 2,
                        bgcolor: 'grey.50', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', border: '1px dashed', borderColor: 'divider',
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { bgcolor: 'grey.100', borderColor: 'primary.main' },
                    }}
                >
                    {uploading ? <CircularProgress size={18} /> : <ImageIcon sx={{ fontSize: size * 0.3, color: 'text.disabled' }} />}
                </Box>
            )}
            {/* Overlay action buttons when photo exists */}
            {photoUrl && (
                <Stack
                    direction="row"
                    spacing={0.25}
                    sx={{
                        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1.5, px: 0.25, py: 0.15,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        sx={{ color: '#fff', p: 0.35, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                        {uploading ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <EditIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={onRemove}
                        sx={{ color: '#ff6b6b', p: 0.35, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Stack>
            )}
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
        </Box>
    );
}

// ─── Shared: Section header with add button ───────────────────────
function BuilderHeader({ icon, title, subtitle, onAdd, addLabel }) {
    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                {icon}
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{title}</Typography>
                    {subtitle && <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>{subtitle}</Typography>}
                </Box>
            </Stack>
            <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, borderRadius: 2 }}
            >
                {addLabel}
            </Button>
        </Stack>
    );
}

// ─── Shared: Item card wrapper ────────────────────────────────────
function ItemCard({ children, onDelete }) {
    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                p: 1.5, borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.01),
                borderColor: alpha(t.palette.primary.main, 0.12),
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: alpha(t.palette.primary.main, 0.3) },
            })}
        >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.75, flexShrink: 0, cursor: 'grab' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {children}
                </Box>
                <IconButton size="small" color="error" onClick={onDelete} sx={{ mt: 0.25, flexShrink: 0 }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Stack>
        </Paper>
    );
}


// ═══════════════════════════════════════════════════════════════════
// 1. MENU BUILDER  (food_drink)
// ═══════════════════════════════════════════════════════════════════
//
// Data shape: { menu_sections: [ { title, items: [{ name, description, price, photo_url }] } ] }

export function MenuBuilder({ sections = [], onChange, onUploadPhoto }) {
    const [uploadingKey, setUploadingKey] = useState(null);

    const addSection = () => {
        onChange([...sections, { title: '', items: [{ name: '', description: '', price: '', photo_url: '' }] }]);
    };

    const removeSection = (sIdx) => {
        onChange(sections.filter((_, i) => i !== sIdx));
    };

    const updateSectionTitle = (sIdx, title) => {
        const updated = [...sections];
        updated[sIdx] = { ...updated[sIdx], title };
        onChange(updated);
    };

    const addItem = (sIdx) => {
        const updated = [...sections];
        updated[sIdx] = {
            ...updated[sIdx],
            items: [...(updated[sIdx].items || []), { name: '', description: '', price: '', photo_url: '' }],
        };
        onChange(updated);
    };

    const removeItem = (sIdx, iIdx) => {
        const updated = [...sections];
        updated[sIdx] = {
            ...updated[sIdx],
            items: updated[sIdx].items.filter((_, i) => i !== iIdx),
        };
        onChange(updated);
    };

    const updateItem = (sIdx, iIdx, field, value) => {
        const updated = [...sections];
        const items = [...updated[sIdx].items];
        items[iIdx] = { ...items[iIdx], [field]: value };
        updated[sIdx] = { ...updated[sIdx], items };
        onChange(updated);
    };

    const handlePhotoUpload = async (sIdx, iIdx, file) => {
        const key = `${sIdx}-${iIdx}`;
        setUploadingKey(key);
        try {
            const url = await onUploadPhoto(file, 'business/menu');
            updateItem(sIdx, iIdx, 'photo_url', url);
        } catch { /* ignore */ }
        setUploadingKey(null);
    };

    return (
        <Box>
            <BuilderHeader
                icon={<RestaurantMenuIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title="Menu"
                subtitle="Organize your menu by sections (e.g. Appetizers, Entrees, Drinks)"
                onAdd={addSection}
                addLabel="Add Section"
            />
            <Stack spacing={2}>
                {sections.map((section, sIdx) => (
                    <Paper
                        key={sIdx}
                        variant="outlined"
                        sx={(t) => ({
                            borderRadius: 2.5, overflow: 'hidden',
                            borderColor: alpha(t.palette.primary.main, 0.15),
                        })}
                    >
                        {/* Section header */}
                        <Stack
                            direction="row" spacing={1} alignItems="center"
                            sx={(t) => ({
                                px: 1.5, py: 1,
                                bgcolor: alpha(t.palette.primary.main, 0.05),
                                borderBottom: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                            })}
                        >
                            <TextField autoComplete="off"
                                       value={section.title || ''}
                                       onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                       placeholder="Section name (e.g. Appetizers)"
                                       size="small"
                                       variant="standard"
                                       fullWidth
                                       InputProps={{ disableUnderline: true, sx: { fontWeight: 800, fontSize: 13 } }}
                            />
                            <IconButton size="small" color="error" onClick={() => removeSection(sIdx)}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Stack>

                        {/* Items */}
                        <Stack spacing={1} sx={{ p: 1.5 }}>
                            {(section.items || []).map((item, iIdx) => (
                                <ItemCard key={iIdx} onDelete={() => removeItem(sIdx, iIdx)} index={iIdx}>
                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <PhotoUploadSlot
                                            photoUrl={item.photo_url}
                                            onUpload={(file) => handlePhotoUpload(sIdx, iIdx, file)}
                                            onRemove={() => updateItem(sIdx, iIdx, 'photo_url', '')}
                                            uploading={uploadingKey === `${sIdx}-${iIdx}`}
                                        />
                                        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" spacing={1}>
                                                <TextField autoComplete="off"
                                                           value={item.name || ''}
                                                           onChange={(e) => updateItem(sIdx, iIdx, 'name', e.target.value)}
                                                           placeholder="Item name"
                                                           size="small"
                                                           fullWidth
                                                           InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }}
                                                />
                                                <TextField autoComplete="off"
                                                           value={item.price || ''}
                                                           onChange={(e) => updateItem(sIdx, iIdx, 'price', e.target.value)}
                                                           placeholder="Price"
                                                           size="small"
                                                           sx={{ width: 90, flexShrink: 0 }}
                                                           InputProps={{
                                                               startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 12, fontWeight: 700 }}>$</Typography></InputAdornment>,
                                                               sx: { fontSize: 12 },
                                                           }}
                                                />
                                            </Stack>
                                            <TextField autoComplete="off"
                                                       value={item.description || ''}
                                                       onChange={(e) => updateItem(sIdx, iIdx, 'description', e.target.value.slice(0, 300))}
                                                       placeholder="Brief description (optional)"
                                                       size="small"
                                                       fullWidth
                                                       multiline
                                                       rows={2}
                                                       inputProps={{ maxLength: 300 }}
                                                       helperText={`${(item.description || '').length}/300`}
                                                       InputProps={{ sx: { fontSize: 11 } }}
                                            />
                                        </Stack>
                                    </Stack>
                                </ItemCard>
                            ))}
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => addItem(sIdx)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, alignSelf: 'flex-start' }}
                            >
                                Add Item
                            </Button>
                        </Stack>
                    </Paper>
                ))}
            </Stack>
            {sections.length === 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No menu sections yet. Click &ldquo;Add Section&rdquo; to get started.
                </Typography>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════
// 2. Services BUILDER  (beauty, auto, home, tech, pets, garden)
// ═══════════════════════════════════════════════════════════════════
//
// Data shape: { service_menu: [{ name, price, duration, description, photo_url }] }

export function ServiceMenuBuilder({ items = [], onChange, onUploadPhoto, durationEnabled = true, icon }) {
    const [uploadingIdx, setUploadingIdx] = useState(null);

    const addItem = () => {
        onChange([...items, { name: '', price: '', duration: '', description: '', photo_url: '' }]);
    };

    const removeItem = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    const handlePhotoUpload = async (idx, file) => {
        setUploadingIdx(idx);
        try {
            const url = await onUploadPhoto(file, 'business/services');
            updateItem(idx, 'photo_url', url);
        } catch { /* ignore */ }
        setUploadingIdx(null);
    };

    return (
        <Box>
            <BuilderHeader
                icon={icon || <AttachMoneyIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title="Services"
                subtitle="List your services with pricing and optional photos"
                onAdd={addItem}
                addLabel="Add Service"
            />
            <Stack spacing={1}>
                {items.map((item, idx) => (
                    <ItemCard key={idx} onDelete={() => removeItem(idx)} index={idx}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <PhotoUploadSlot
                                photoUrl={item.photo_url}
                                onUpload={(file) => handlePhotoUpload(idx, file)}
                                onRemove={() => updateItem(idx, 'photo_url', '')}
                                uploading={uploadingIdx === idx}
                            />
                            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.name || ''}
                                               onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                               placeholder="Service name"
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                    <TextField autoComplete="off"
                                               value={item.price || ''}
                                               onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                               placeholder="Price"
                                               size="small"
                                               sx={{ width: 90, flexShrink: 0 }}
                                               InputProps={{
                                                   startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 12, fontWeight: 700 }}>$</Typography></InputAdornment>,
                                                   sx: { fontSize: 12 },
                                               }}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.description || ''}
                                               onChange={(e) => updateItem(idx, 'description', e.target.value.slice(0, 300))}
                                               placeholder="Brief description (optional)"
                                               size="small"
                                               fullWidth
                                               multiline
                                               rows={2}
                                               inputProps={{ maxLength: 300 }}
                                               helperText={`${(item.description || '').length}/300`}
                                               InputProps={{ sx: { fontSize: 11 } }}
                                    />
                                    {durationEnabled && (
                                        <TextField autoComplete="off"
                                                   value={item.duration || ''}
                                                   onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                                                   placeholder="Duration"
                                                   size="small"
                                                   sx={{ width: 100, flexShrink: 0 }}
                                                   InputProps={{ sx: { fontSize: 11 } }}
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </Stack>
                    </ItemCard>
                ))}
            </Stack>
            {items.length === 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No services yet. Click &ldquo;Add Service&rdquo; to get started.
                </Typography>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════
// 3. PROVIDER BUILDER  (health, education)
// ═══════════════════════════════════════════════════════════════════
//
// Data shape: { providers: [{ name, title, specialty, bio, photo_url }] }

export function ProviderBuilder({ items = [], onChange, onUploadPhoto, roleLabel = 'Specialty' }) {
    const [uploadingIdx, setUploadingIdx] = useState(null);

    const addItem = () => {
        onChange([...items, { name: '', title: '', specialty: '', bio: '', photo_url: '' }]);
    };

    const removeItem = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    const handlePhotoUpload = async (idx, file) => {
        setUploadingIdx(idx);
        try {
            const url = await onUploadPhoto(file, 'business/providers');
            updateItem(idx, 'photo_url', url);
        } catch { /* ignore */ }
        setUploadingIdx(null);
    };

    return (
        <Box>
            <BuilderHeader
                icon={<PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title="Team / Providers"
                subtitle="Showcase your team members, providers, or instructors"
                onAdd={addItem}
                addLabel="Add Person"
            />
            <Stack spacing={1}>
                {items.map((item, idx) => (
                    <ItemCard key={idx} onDelete={() => removeItem(idx)} index={idx}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <PhotoUploadSlot
                                photoUrl={item.photo_url}
                                onUpload={(file) => handlePhotoUpload(idx, file)}
                                onRemove={() => updateItem(idx, 'photo_url', '')}
                                uploading={uploadingIdx === idx}
                            />
                            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.name || ''}
                                               onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                               placeholder="Full name"
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                    <TextField autoComplete="off"
                                               value={item.title || ''}
                                               onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                               placeholder="Title (e.g. MD, DDS)"
                                               size="small"
                                               sx={{ width: 130, flexShrink: 0 }}
                                               InputProps={{ sx: { fontSize: 11 } }}
                                    />
                                </Stack>
                                <TextField autoComplete="off"
                                           value={item.specialty || ''}
                                           onChange={(e) => updateItem(idx, 'specialty', e.target.value)}
                                           placeholder={`${roleLabel} (e.g. Family Medicine)`}
                                           size="small"
                                           fullWidth
                                           InputProps={{ sx: { fontSize: 11 } }}
                                />
                                <TextField autoComplete="off"
                                           value={item.bio || ''}
                                           onChange={(e) => updateItem(idx, 'bio', e.target.value.slice(0, 300))}
                                           placeholder="Short bio (optional)"
                                           size="small"
                                           fullWidth
                                           multiline
                                           rows={2}
                                           inputProps={{ maxLength: 300 }}
                                           helperText={`${(item.bio || '').length}/300`}
                                           InputProps={{ sx: { fontSize: 11 } }}
                                />
                            </Stack>
                        </Stack>
                    </ItemCard>
                ))}
            </Stack>
            {items.length === 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No team members yet. Click &ldquo;Add Person&rdquo; to get started.
                </Typography>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════
// 4. CLASS / PROGRAM BUILDER  (fitness, arts)
// ═══════════════════════════════════════════════════════════════════
//
// Data shape: { classes: [{ name, instructor, schedule, description, photo_url }] }

export function ClassBuilder({ items = [], onChange, onUploadPhoto, itemLabel = 'Class' }) {
    const [uploadingIdx, setUploadingIdx] = useState(null);

    const addItem = () => {
        onChange([...items, { name: '', instructor: '', schedule: '', description: '', photo_url: '' }]);
    };

    const removeItem = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    const handlePhotoUpload = async (idx, file) => {
        setUploadingIdx(idx);
        try {
            const url = await onUploadPhoto(file, 'business/classes');
            updateItem(idx, 'photo_url', url);
        } catch { /* ignore */ }
        setUploadingIdx(null);
    };

    return (
        <Box>
            <BuilderHeader
                icon={<EventIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title={`${itemLabel}es & Programs`}
                subtitle={`Add your ${itemLabel.toLowerCase()}es, programs, or recurring events`}
                onAdd={addItem}
                addLabel={`Add ${itemLabel}`}
            />
            <Stack spacing={1}>
                {items.map((item, idx) => (
                    <ItemCard key={idx} onDelete={() => removeItem(idx)} index={idx}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <PhotoUploadSlot
                                photoUrl={item.photo_url}
                                onUpload={(file) => handlePhotoUpload(idx, file)}
                                onRemove={() => updateItem(idx, 'photo_url', '')}
                                uploading={uploadingIdx === idx}
                            />
                            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.name || ''}
                                               onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                               placeholder={`${itemLabel} name`}
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.instructor || ''}
                                               onChange={(e) => updateItem(idx, 'instructor', e.target.value)}
                                               placeholder="Instructor / Host"
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 11 } }}
                                    />
                                    <TextField autoComplete="off"
                                               value={item.schedule || ''}
                                               onChange={(e) => updateItem(idx, 'schedule', e.target.value)}
                                               placeholder="Schedule (e.g. Mon/Wed 9AM)"
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 11 } }}
                                    />
                                </Stack>
                                <TextField autoComplete="off"
                                           value={item.description || ''}
                                           onChange={(e) => updateItem(idx, 'description', e.target.value.slice(0, 300))}
                                           placeholder="Description (optional)"
                                           size="small"
                                           fullWidth
                                           multiline
                                           rows={2}
                                           inputProps={{ maxLength: 300 }}
                                           helperText={`${(item.description || '').length}/300`}
                                           InputProps={{ sx: { fontSize: 11 } }}
                                />
                            </Stack>
                        </Stack>
                    </ItemCard>
                ))}
            </Stack>
            {items.length === 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No {itemLabel.toLowerCase()}es yet. Click &ldquo;Add {itemLabel}&rdquo; to get started.
                </Typography>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════
// 5. ACCOMMODATION BUILDER  (travel_lodging)
// ═══════════════════════════════════════════════════════════════════
//
// Data shape: { accommodations: [{ name, description, price_per_night, photo_url, amenities: [] }] }

const ACCOMMODATION_AMENITIES = [
    'Pool', 'Hot Tub', 'Free Wi-Fi', 'Kitchen', 'Washer/Dryer',
    'Free Parking', 'Pet-Friendly', 'Lake Access', 'Boat Dock',
    'Fire Pit', 'Grill', 'AC', 'Heating', 'TV', 'Balcony',
];

export function AccommodationBuilder({ items = [], onChange, onUploadPhoto }) {
    const [uploadingIdx, setUploadingIdx] = useState(null);

    const addItem = () => {
        onChange([...items, { name: '', description: '', price_per_night: '', photo_url: '', amenities: [] }]);
    };

    const removeItem = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    const toggleAmenity = (idx, amenity) => {
        const current = items[idx].amenities || [];
        const updated = current.includes(amenity)
            ? current.filter((a) => a !== amenity)
            : [...current, amenity];
        updateItem(idx, 'amenities', updated);
    };

    const handlePhotoUpload = async (idx, file) => {
        setUploadingIdx(idx);
        try {
            const url = await onUploadPhoto(file, 'business/accommodations');
            updateItem(idx, 'photo_url', url);
        } catch { /* ignore */ }
        setUploadingIdx(null);
    };

    return (
        <Box>
            <BuilderHeader
                icon={<HotelIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title="Accommodations"
                subtitle="Showcase your rooms, cabins, or rental spaces with photos"
                onAdd={addItem}
                addLabel="Add Room"
            />
            <Stack spacing={1.5}>
                {items.map((item, idx) => (
                    <ItemCard key={idx} onDelete={() => removeItem(idx)} index={idx}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <PhotoUploadSlot
                                photoUrl={item.photo_url}
                                onUpload={(file) => handlePhotoUpload(idx, file)}
                                onRemove={() => updateItem(idx, 'photo_url', '')}
                                uploading={uploadingIdx === idx}
                                size={120}
                            />
                            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1}>
                                    <TextField autoComplete="off"
                                               value={item.name || ''}
                                               onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                               placeholder="Room / space name"
                                               size="small"
                                               fullWidth
                                               InputProps={{ sx: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                    <TextField autoComplete="off"
                                               value={item.price_per_night || ''}
                                               onChange={(e) => updateItem(idx, 'price_per_night', e.target.value)}
                                               placeholder="/ night"
                                               size="small"
                                               sx={{ width: 110, flexShrink: 0 }}
                                               InputProps={{
                                                   startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 12, fontWeight: 700 }}>$</Typography></InputAdornment>,
                                                   sx: { fontSize: 12 },
                                               }}
                                    />
                                </Stack>
                                <TextField autoComplete="off"
                                           value={item.description || ''}
                                           onChange={(e) => updateItem(idx, 'description', e.target.value.slice(0, 300))}
                                           placeholder="Description (optional)"
                                           size="small"
                                           fullWidth
                                           multiline
                                           rows={2}
                                           inputProps={{ maxLength: 300 }}
                                           helperText={`${(item.description || '').length}/300`}
                                           InputProps={{ sx: { fontSize: 11 } }}
                                />
                                <Box>
                                    <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Amenities:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                        {ACCOMMODATION_AMENITIES.map((a) => (
                                            <Chip
                                                key={a}
                                                label={a}
                                                size="small"
                                                variant={(item.amenities || []).includes(a) ? 'filled' : 'outlined'}
                                                color={(item.amenities || []).includes(a) ? 'primary' : 'default'}
                                                onClick={() => toggleAmenity(idx, a)}
                                                sx={{ fontSize: 10, fontWeight: 600, height: 22, cursor: 'pointer', borderRadius: 999 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Stack>
                        </Stack>
                    </ItemCard>
                ))}
            </Stack>
            {items.length === 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No accommodations yet. Click &ldquo;Add Room&rdquo; to get started.
                </Typography>
            )}
        </Box>
    );
}
