import React, { useMemo, useRef } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Tab, Tabs, Typography } from "@mui/material";

import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

import ArtistDetailPanel from "./ArtistDetailPanel";
import ArtistDiscoverTab from "./ArtistDiscoverTab";
import MusicMapView from "./MusicMapView";
import MusicPostDetailPanel from "./MusicPostDetailPanel";
import MusicCalendarPanel from "./MusicCalendarPanel";
import { MusicPostCardItem } from "./MusicPostsList";
import EventDetailPanel from "../../events/components/EventDetailPanel";
import EventsMapTab from "../../events/components/EventsMapTab";
import BusinessesMapTab from "../../business/components/BusinessesMapTab";

export default function MusicRightPanel({
                                            rightWidth,
                                            artist,
                                            artists = [],
                                            post = null,
                                            posts = [],
                                            show = null,
                                            user,
                                            activeTab = "artists",
                                            onOpenUserCard,
                                            onSelectArtist,
                                            onSelectPost,
                                            onPostLocationClick,
                                            onViewPost,
                                            onSavePageState,
                                            onShowUpdate,
                                            onClearShow,
                                            onRequireAuth,
                                            rightTab = "discover",
                                            onRightTabChange,
                                            mapViewResetKey = 0,
                                            concertEvents = [],
                                            onSelectShow,
                                            selectedDates = [],
                                            onDatesChange,
                                            // Posts map props
                                            focusPostId,
                                            onFocusPostHandled,
                                            hoveredPostId,
                                        }) {
    const selectedArtistId = artist?.id ?? artist?.artist_id ?? null;
    const isPostsTab = activeTab === "posts";
    const isShowsTab = activeTab === "shows";

    const handleTabChange = (_, newVal) => {
        if (typeof onRightTabChange === "function") onRightTabChange(newVal);
    };

    // Stable ref for user to avoid popupContentById recreating on every parent render
    const userRef = useRef(user);
    userRef.current = user;

    // Build popup content map for post pins on the map (same pattern as BusinessHubPage)
    const popupContentById = useMemo(() => {
        if (!isPostsTab) return null;
        const currentUser = userRef.current;
        const map = new Map();
        (posts || []).forEach((p) => {
            if (p?.id == null) return;
            const idStr = String(p.id);
            const node = (
                <MusicPostCardItem
                    key={`popup-${idStr}`}
                    post={p}
                    user={currentUser}
                    selectable={false}
                    popupMode
                    onCardClick={(clickedPost) => {
                        if (typeof onSelectPost === "function") onSelectPost(clickedPost);
                        if (typeof onRightTabChange === "function") onRightTabChange("post-detail");
                    }}
                    onOpenUserCard={onOpenUserCard}
                    onLocationClick={onPostLocationClick}
                />
            );
            map.set(idStr, node);
            map.set(p.id, node);
            map.set(Number(idStr), node);
        });
        return map;
    }, [isPostsTab, posts, onSelectPost, onRightTabChange, onOpenUserCard, onPostLocationClick]);

    const effectiveRightTab = (() => {
        if (rightTab === "calendar" && !isShowsTab) return "discover";

        if (isPostsTab) {
            if (rightTab === "detail") return "post-detail";
            if (rightTab === "show-detail") return "post-detail";
            return rightTab;
        }
        if (isShowsTab) {
            if (rightTab === "detail") return "show-detail";
            if (rightTab === "post-detail") return "show-detail";
            return rightTab;
        }
        if (rightTab === "post-detail" || rightTab === "show-detail") return "detail";
        return rightTab;
    })();

    return (
        <Box
            sx={(t) => ({
                position: "relative",
                height: "100%",
                p: 0,
                overflow: "hidden",
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                borderRadius: 3,
                bgcolor: t.palette.background.paper,
                backdropFilter: "none",
                backgroundImage: "none",
                boxShadow: `0 14px 44px ${alpha(t.palette.common.black, 0.08)}`,
                width: rightWidth,
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
            })}
        >
            {/* Tab bar */}
            <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Tabs
                    value={effectiveRightTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={(t) => ({
                        minHeight: 42,
                        bgcolor: t.palette.background.paper,
                        "& .MuiTab-root": {
                            minHeight: 42,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: 13.5,
                            py: 0,
                            px: 0.5,
                            minWidth: 0,
                            color: t.palette.text.secondary,
                            "&.Mui-selected": { color: t.palette.primary.main, fontWeight: 950 },
                        },
                        "& .MuiTabs-indicator": {
                            height: 2.5,
                            borderRadius: 999,
                            backgroundColor: t.palette.primary.main,
                        },
                    })}
                >
                    <Tab
                        value="discover"
                        icon={<ExploreOutlinedIcon sx={{ fontSize: 17 }} />}
                        iconPosition="start"
                        label="Discover"
                    />
                    {isShowsTab && (
                        <Tab
                            value="calendar"
                            icon={<CalendarMonthRoundedIcon sx={{ fontSize: 17 }} />}
                            iconPosition="start"
                            label="Calendar"
                        />
                    )}
                    {isShowsTab ? (
                        <Tab
                            value="show-detail"
                            icon={<EventAvailableRoundedIcon sx={{ fontSize: 17 }} />}
                            iconPosition="start"
                            label="Details"
                        />
                    ) : isPostsTab ? (
                        <Tab
                            value="post-detail"
                            icon={<ArticleOutlinedIcon sx={{ fontSize: 17 }} />}
                            iconPosition="start"
                            label="Post Detail"
                        />
                    ) : (
                        <Tab
                            value="detail"
                            icon={<PersonOutlineRoundedIcon sx={{ fontSize: 17 }} />}
                            iconPosition="start"
                            label="Artist"
                        />
                    )}
                    <Tab
                        value="map"
                        icon={<MapOutlinedIcon sx={{ fontSize: 17 }} />}
                        iconPosition="start"
                        label="Map"
                    />
                </Tabs>
            </Box>

            {/* Tab content */}
            <Box sx={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", bgcolor: "background.paper" }}>
                {effectiveRightTab === "discover" && (
                    <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                        <ArtistDiscoverTab />
                    </Box>
                )}

                {effectiveRightTab === "calendar" && isShowsTab && (
                    <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                        <MusicCalendarPanel
                            events={concertEvents}
                            selectedDates={selectedDates}
                            onDatesChange={onDatesChange}
                        />
                    </Box>
                )}

                {effectiveRightTab === "detail" && !isPostsTab && !isShowsTab && (
                    <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                        <ArtistDetailPanel artist={artist} user={user} onOpenUserCard={onOpenUserCard} onSavePageState={onSavePageState} />
                    </Box>
                )}

                {effectiveRightTab === "post-detail" && isPostsTab && (
                    <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                        <MusicPostDetailPanel
                            post={post}
                            user={user}
                            onViewPost={onViewPost}
                        />
                    </Box>
                )}

                {effectiveRightTab === "show-detail" && isShowsTab && (
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                        {show ? (
                            <EventDetailPanel
                                event={show}
                                user={user}
                                onRequireAuth={onRequireAuth}
                                onClearSelection={onClearShow}
                                onClose={onClearShow}
                                onEventUpdate={onShowUpdate}
                            />
                        ) : (
                            <Box sx={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                p: 3,
                            }}>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Box
                                        sx={(t) => ({
                                            width: 56,
                                            height: 56,
                                            borderRadius: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            bgcolor: alpha(t.palette.primary.main, 0.06),
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.primary.main, 0.10),
                                            mb: 2,
                                        })}
                                    >
                                        <EventAvailableRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", mb: 0.5 }}>
                                        Select an event
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose an event from the list to see details.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                {effectiveRightTab === "map" && (
                    <Box sx={{ position: "absolute", inset: 0 }}>
                        {isShowsTab ? (
                            <EventsMapTab
                                events={concertEvents}
                                onSelectEvent={(evt) => {
                                    if (typeof onSelectShow === "function") onSelectShow(evt);
                                    if (typeof onRightTabChange === "function") onRightTabChange("show-detail");
                                }}
                            />
                        ) : isPostsTab ? (
                            <BusinessesMapTab
                                key={`posts-${mapViewResetKey}`}
                                items={posts}
                                onSelectItem={(p) => {
                                    if (typeof onSelectPost === "function") onSelectPost(p);
                                    if (typeof onRightTabChange === "function") onRightTabChange("post-detail");
                                }}
                                focusItemId={focusPostId}
                                onFocusItemHandled={onFocusPostHandled}
                                hoveredCardId={hoveredPostId}
                                popupContentById={popupContentById}
                                mode="posts"
                            />
                        ) : (
                            <MusicMapView
                                key={`artists-${mapViewResetKey}`}
                                mode="artists"
                                artists={artists}
                                onSelectArtist={(a) => {
                                    if (typeof onSelectArtist === "function") onSelectArtist(a);
                                    if (typeof onRightTabChange === "function") onRightTabChange("detail");
                                }}
                                selectedArtistId={selectedArtistId}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
