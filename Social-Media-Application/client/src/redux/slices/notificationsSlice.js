import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";

// Polling requests: no loading bar and no error toasts.
const quiet = { silent: true, background: true };

export const fetchUnreadCount = createAsyncThunk("notifications/unreadCount", async () => {
    const response = await axiosClient.get("/api/notifications/unread-count", quiet);
    return response.result.unreadCount;
});

// cursor = null loads the first page (replacing the list); otherwise appends the next page.
export const fetchNotifications = createAsyncThunk(
    "notifications/list",
    async ({ cursor = null, limit = 15 } = {}, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/api/notifications", {
                ...quiet,
                params: { limit, ...(cursor ? { cursor } : {}) },
            });
            return response.result;
        } catch (error) {
            return rejectWithValue(typeof error === "string" ? error : "Could not load notifications");
        }
    }
);

export const markNotificationRead = createAsyncThunk("notifications/markRead", async (id) => {
    const response = await axiosClient.post(`/api/notifications/${id}/read`, null, quiet);
    return response.result.unreadCount;
});

export const markAllNotificationsRead = createAsyncThunk("notifications/markAllRead", async () => {
    await axiosClient.post("/api/notifications/read-all", null, { silent: true });
    return 0;
});

const notificationsSlice = createSlice({
    name: "notificationsSlice",
    initialState: {
        unreadCount: 0,
        items: [],
        nextCursor: null,
        status: "idle", // idle | loading | succeeded | failed
        loadingMore: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(fetchNotifications.pending, (state, action) => {
                if (action.meta.arg?.cursor) state.loadingMore = true;
                else if (!state.items.length) state.status = "loading";
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                const { items, nextCursor, unreadCount } = action.payload;
                if (action.meta.arg?.cursor) {
                    const seen = new Set(state.items.map((n) => n._id));
                    state.items.push(...items.filter((n) => !seen.has(n._id)));
                } else {
                    state.items = items;
                }
                state.nextCursor = nextCursor;
                state.unreadCount = unreadCount;
                state.status = "succeeded";
                state.loadingMore = false;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loadingMore = false;
                state.error = action.payload || "Could not load notifications";
                if (!state.items.length) state.status = "failed";
            })
            .addCase(markNotificationRead.pending, (state, action) => {
                const item = state.items.find((n) => n._id === action.meta.arg);
                if (item && !item.read) {
                    item.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(markAllNotificationsRead.pending, (state) => {
                state.items.forEach((n) => { n.read = true; });
                state.unreadCount = 0;
            });
    },
});

export default notificationsSlice.reducer;
