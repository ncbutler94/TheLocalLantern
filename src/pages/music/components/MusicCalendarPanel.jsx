import React, { useMemo, useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    Box,
    Button,
    Chip,
    IconButton,
    Popover,
    Stack,
    Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";

/* ── Helpers ──────────────────────────────────────────────── */

function getMonthDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
}

function formatDateKey(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isDateInRange(date, startDate, endDate) {
    if (!date) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (startDate && endDate) {
        const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        return d >= Math.min(s, e) && d <= Math.max(s, e);
    }
    if (startDate) return isSameDay(date, startDate);
    return false;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ═══════════════════════════════════════════════════════════
   MusicCalendarPanel
   ─ Adapted from EventsRightPanel CalendarPanel
   ═══════════════════════════════════════════════════════════ */
export default function MusicCalendarPanel({ events = [], selectedDates = [], onDatesChange }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectionMode, setSelectionMode] = useState("range");
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [multipleDates, setMultipleDates] = useState([]);
    const [hoverDate, setHoverDate] = useState(null);
    const [pickerAnchor, setPickerAnchor] = useState(null);
    const [pickerYear, setPickerYear] = useState(today.getFullYear());

    const monthDays = useMemo(() => getMonthDays(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
    const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const eventCountsByDay = useMemo(() => {
        const counts = new Map();
        (Array.isArray(events) ? events : []).forEach((e) => {
            const startAt = e?.startAt || e?.start_at;
            if (!startAt) return;
            const dateKey = String(startAt).split("T")[0].split(" ")[0];
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        });
        return counts;
    }, [events]);

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const handleDayClick = (day) => {
        if (!day) return;
        const dateKey = formatDateKey(day);

        if (selectionMode === "multiple") {
            const exists = multipleDates.some((d) => d === dateKey);
            const newDates = exists ? multipleDates.filter((d) => d !== dateKey) : [...multipleDates, dateKey].sort();
            setMultipleDates(newDates);
            if (typeof onDatesChange === "function") {
                const startDate = newDates.length > 0 ? newDates[0] : null;
                const endDate = newDates.length > 0 ? newDates[newDates.length - 1] : null;
                onDatesChange(newDates, startDate, endDate);
            }
        } else {
            if (!rangeStart || (rangeStart && rangeEnd)) {
                setRangeStart(day);
                setRangeEnd(null);
                if (typeof onDatesChange === "function") onDatesChange([dateKey], dateKey, dateKey);
            } else {
                setRangeEnd(day);
                const start = rangeStart < day ? rangeStart : day;
                const end = rangeStart < day ? day : rangeStart;
                const dates = [];
                const current = new Date(start);
                while (current <= end) {
                    dates.push(formatDateKey(current));
                    current.setDate(current.getDate() + 1);
                }
                if (typeof onDatesChange === "function") onDatesChange(dates, formatDateKey(start), formatDateKey(end));
            }
        }
    };

    const handleClearSelection = () => {
        setRangeStart(null);
        setRangeEnd(null);
        setMultipleDates([]);
        if (typeof onDatesChange === "function") onDatesChange([], null, null);
    };

    const handleModeChange = (newMode) => {
        if (newMode === selectionMode) return;
        setSelectionMode(newMode);
        setRangeStart(null);
        setRangeEnd(null);
        setMultipleDates([]);
        if (typeof onDatesChange === "function") onDatesChange([], null, null);
    };

    const handleRemoveDate = (dateKey) => {
        const newDates = multipleDates.filter((d) => d !== dateKey);
        setMultipleDates(newDates);
        if (typeof onDatesChange === "function") {
            const s = newDates.length > 0 ? newDates[0] : null;
            const e = newDates.length > 0 ? newDates[newDates.length - 1] : null;
            onDatesChange(newDates, s, e);
        }
    };

    const isInSelection = (day) => {
        if (!day) return false;
        const dateKey = formatDateKey(day);
        if (selectionMode === "multiple") return multipleDates.includes(dateKey);
        const effectiveEnd = rangeEnd || (hoverDate && rangeStart && !rangeEnd ? hoverDate : null);
        if (rangeStart && effectiveEnd) return isDateInRange(day, rangeStart, effectiveEnd);
        if (rangeStart) return isSameDay(day, rangeStart);
        return false;
    };

    const isStartOfSel = (day) => {
        if (!day || selectionMode === "multiple" || !rangeStart) return false;
        const effectiveEnd = rangeEnd || hoverDate;
        if (!effectiveEnd) return isSameDay(day, rangeStart);
        const start = rangeStart < effectiveEnd ? rangeStart : effectiveEnd;
        return isSameDay(day, start);
    };

    const isEndOfSel = (day) => {
        if (!day || selectionMode === "multiple" || !rangeStart) return false;
        const effectiveEnd = rangeEnd || hoverDate;
        if (!effectiveEnd) return isSameDay(day, rangeStart);
        const end = rangeStart < effectiveEnd ? effectiveEnd : rangeStart;
        return isSameDay(day, end);
    };

    const selectedDisplay = useMemo(() => {
        if (selectionMode === "multiple") {
            return multipleDates.map((dk) => {
                const [y, m, d] = dk.split("-").map(Number);
                const date = new Date(y, m - 1, d);
                return { key: dk, label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
            });
        }
        if (!rangeStart) return [];
        const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (rangeEnd && !isSameDay(rangeStart, rangeEnd)) {
            const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
            const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
            return [{ key: "range", label: `${fmt(start)} – ${fmt(end)}`, isRange: true }];
        }
        return [{ key: formatDateKey(rangeStart), label: fmt(rangeStart) }];
    }, [selectionMode, multipleDates, rangeStart, rangeEnd]);

    const hasSelection = selectedDisplay.length > 0;

    return (
        <Box sx={{ p: { xs: 1.25, md: 1.75 } }}>
            <Typography sx={{ fontWeight: 950, mb: 1.5 }}>Event Calendar</Typography>

            {/* Mode toggle */}
            <Box sx={(t) => ({ display: "flex", p: 0.5, mb: 2, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                <Button
                    size="small"
                    onClick={() => handleModeChange("range")}
                    sx={(t) => ({
                        flex: 1, textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 1.5, py: 0.75,
                        bgcolor: selectionMode === "range" ? "background.paper" : "transparent",
                        color: selectionMode === "range" ? t.palette.primary.main : t.palette.text.secondary,
                        boxShadow: selectionMode === "range" ? `0 2px 8px ${alpha(t.palette.text.primary, 0.08)}` : "none",
                        "&:hover": { bgcolor: selectionMode === "range" ? "background.paper" : alpha(t.palette.primary.main, 0.08) },
                    })}
                >
                    Date Range
                </Button>
                <Button
                    size="small"
                    onClick={() => handleModeChange("multiple")}
                    sx={(t) => ({
                        flex: 1, textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 1.5, py: 0.75,
                        bgcolor: selectionMode === "multiple" ? "background.paper" : "transparent",
                        color: selectionMode === "multiple" ? t.palette.primary.main : t.palette.text.secondary,
                        boxShadow: selectionMode === "multiple" ? `0 2px 8px ${alpha(t.palette.text.primary, 0.08)}` : "none",
                        "&:hover": { bgcolor: selectionMode === "multiple" ? "background.paper" : alpha(t.palette.primary.main, 0.08) },
                    })}
                >
                    Pick Dates
                </Button>
            </Box>

            {/* Month nav */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <IconButton size="small" onClick={handlePrevMonth}><ChevronLeftRoundedIcon /></IconButton>
                <Button
                    onClick={(e) => { setPickerAnchor(e.currentTarget); setPickerYear(viewDate.getFullYear()); }}
                    sx={{ textTransform: "none", fontWeight: 900, fontSize: 15, color: "text.primary", px: 1.5, py: 0.5, borderRadius: 1.5, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}
                >
                    {monthName}
                </Button>
                <IconButton size="small" onClick={handleNextMonth}><ChevronRightRoundedIcon /></IconButton>
            </Stack>

            {/* Month/Year picker popover */}
            <Popover
                open={Boolean(pickerAnchor)}
                anchorEl={pickerAnchor}
                onClose={() => setPickerAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                slotProps={{ paper: { sx: (t) => ({ mt: 1, borderRadius: 2.5, boxShadow: `0 8px 32px ${alpha(t.palette.text.primary, 0.12)}`, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), overflow: "hidden" }) } }}
            >
                <Box sx={{ p: 2, minWidth: 260 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <IconButton size="small" onClick={() => setPickerYear((y) => y - 1)}><ChevronLeftRoundedIcon /></IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{pickerYear}</Typography>
                        <IconButton size="small" onClick={() => setPickerYear((y) => y + 1)}><ChevronRightRoundedIcon /></IconButton>
                    </Stack>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                        {MONTHS.map((m, idx) => {
                            const isCurrent = viewDate.getMonth() === idx && viewDate.getFullYear() === pickerYear;
                            const isThis = today.getMonth() === idx && today.getFullYear() === pickerYear;
                            return (
                                <Button
                                    key={m}
                                    onClick={() => { setViewDate(new Date(pickerYear, idx, 1)); setPickerAnchor(null); }}
                                    size="small"
                                    sx={(t) => ({
                                        textTransform: "none", fontWeight: isCurrent ? 900 : 600, fontSize: 13, py: 1, borderRadius: 1.5,
                                        color: isCurrent ? "background.paper" : isThis ? t.palette.primary.main : "text.primary",
                                        bgcolor: isCurrent ? t.palette.primary.main : "transparent",
                                        border: isThis && !isCurrent ? "1px solid" : "none", borderColor: alpha(t.palette.primary.main, 0.3),
                                        "&:hover": { bgcolor: isCurrent ? t.palette.primary.dark : alpha(t.palette.primary.main, 0.08) },
                                    })}
                                >
                                    {m}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>
            </Popover>

            {/* Calendar grid */}
            <Box sx={(t) => ({ border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), borderRadius: 2.5, overflow: "hidden", bgcolor: "background.paper" })}>
                <Box sx={(t) => ({ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", bgcolor: alpha(t.palette.primary.main, 0.04), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08) })}>
                    {DOW.map((d) => (
                        <Box key={d} sx={{ py: 0.75, textAlign: "center", fontSize: 11, fontWeight: 900, color: "text.secondary" }}>{d}</Box>
                    ))}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {monthDays.map((day, idx) => {
                        const dateKey = day ? formatDateKey(day) : null;
                        const eventCount = dateKey ? (eventCountsByDay.get(dateKey) || 0) : 0;
                        const isToday = day && isSameDay(day, today);
                        const isPast = day && day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const inSel = isInSelection(day);
                        const isStart = isStartOfSel(day);
                        const isEnd = isEndOfSel(day);
                        const isMultSel = selectionMode === "multiple" && inSel;

                        return (
                            <Box
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                onMouseEnter={() => day && selectionMode === "range" && rangeStart && !rangeEnd && setHoverDate(day)}
                                onMouseLeave={() => setHoverDate(null)}
                                sx={(t) => ({
                                    position: "relative", aspectRatio: "1", display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", cursor: day ? "pointer" : "default",
                                    borderRight: (idx + 1) % 7 !== 0 ? "1px solid" : "none",
                                    borderBottom: idx < monthDays.length - 7 ? "1px solid" : "none",
                                    borderColor: alpha(t.palette.divider, 0.5),
                                    bgcolor: isMultSel ? alpha(t.palette.primary.main, 0.15) : inSel && selectionMode === "range" ? alpha(t.palette.primary.main, isStart || isEnd ? 0.2 : 0.08) : "transparent",
                                    borderRadius: isMultSel ? 1 : isStart && isEnd ? 1 : isStart ? "8px 0 0 8px" : isEnd ? "0 8px 8px 0" : 0,
                                    transition: "background-color 100ms ease",
                                    "&:hover": day ? { bgcolor: inSel ? alpha(t.palette.primary.main, 0.25) : alpha(t.palette.primary.main, 0.06) } : {},
                                })}
                            >
                                {day ? (
                                    <>
                                        <Typography sx={(t) => ({ fontSize: 13, fontWeight: isToday ? 900 : inSel ? 800 : 600, color: isPast && !inSel ? "text.disabled" : isToday ? t.palette.primary.main : inSel ? t.palette.primary.main : "text.primary", lineHeight: 1 })}>
                                            {day.getDate()}
                                        </Typography>
                                        {eventCount > 0 && (
                                            <Box sx={(t) => ({ position: "absolute", bottom: 2, minWidth: 14, height: 14, px: 0.4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, bgcolor: alpha(inSel ? t.palette.primary.main : t.palette.secondary.main, 0.15) })}>
                                                <Typography sx={(t) => ({ fontSize: 9, fontWeight: 900, color: inSel ? t.palette.primary.main : t.palette.secondary.main, lineHeight: 1 })}>
                                                    {eventCount}
                                                </Typography>
                                            </Box>
                                        )}
                                        {isToday && (
                                            <Box sx={(t) => ({ position: "absolute", inset: 4, border: "2px solid", borderColor: alpha(t.palette.primary.main, 0.3), borderRadius: 1, pointerEvents: "none" })} />
                                        )}
                                    </>
                                ) : null}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Selected display */}
            {hasSelection ? (
                <Box sx={(t) => ({ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15) })}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "text.secondary" }}>
                            {selectionMode === "multiple" ? "Selected Dates" : "Date Range"}
                        </Typography>
                        <Button size="small" onClick={handleClearSelection} sx={{ textTransform: "none", fontWeight: 700, fontSize: 11, minWidth: "auto", px: 1, py: 0.25 }}>
                            Clear All
                        </Button>
                    </Stack>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {selectedDisplay.map((item) => (
                            <Box
                                key={item.key}
                                sx={(t) => ({
                                    display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5,
                                    borderRadius: 1.5, bgcolor: "background.paper", border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.2), fontSize: 12, fontWeight: 700, color: t.palette.primary.main,
                                })}
                            >
                                <EventRoundedIcon sx={{ fontSize: 14 }} />
                                {item.label}
                                {selectionMode === "multiple" && !item.isRange && (
                                    <Box
                                        component="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveDate(item.key); }}
                                        sx={(t) => ({
                                            display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, ml: 0.25,
                                            borderRadius: "50%", border: "none", bgcolor: alpha(t.palette.primary.main, 0.1), color: t.palette.primary.main,
                                            cursor: "pointer", fontSize: 12, fontWeight: 700, "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.2) },
                                        })}
                                    >
                                        ×
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ) : (
                <Box sx={(t) => ({ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.grey[500], 0.04), border: "1px dashed", borderColor: alpha(t.palette.grey[500], 0.2), textAlign: "center" })}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>
                        {selectionMode === "range" ? "Click a start date, then an end date to select a range." : "Click dates to add them to your selection."}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5 }}>
                        Numbers show how many events are on each day.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
