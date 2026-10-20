import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";

// Polling requests: no loading bar and no error toasts.
const quiet = { silent: true, background: true };

export const fetchUnreadCount = createAsyncThunk("notifications/unreadCount", async () => {
    const response = await axiosClient.get("/api/notifications/unread-count", quiet);
    return response.result.unreadCount;
});

// target "preview" feeds the bell dropdown, "page" the /notifications list; they are kept
// apart so opening the bell never truncates a list the page has paged through.
// cursor = null loads the first page (replacing the list); otherwise appends the next page.
export const fetchNotifications = createAsyncThunk(
    "notifications/list",
    async ({ target = "page", cursor = null, limit = 15 } = {}, { rejectWithValue }) => {
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

const emptyList = { items: [], nextCursor: null, status: "idle", loadingMore: false, error: null, requestId: null };

function markItemRead(list, id) {
    const item = list.items.find((n) => n._id === id);
    if (item) item.read = true;
}

const notificationsSlice = createSlice({
    name: "notificationsSlice",
    initialState: {
        unreadCount: 0,
        preview: emptyList, // bell dropdown
        page: emptyList, // /notifications
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(fetchNotifications.pending, (state, action) => {
                const { target = "page", cursor } = action.meta.arg || {};
                const list = state[target];
                list.error = null;
                if (cursor) {
                    list.loadingMore = true;
                } else {
                    // A newer first-page request wins over any request still running.
                    list.requestId = action.meta.requestId;
                    if (!list.items.length) list.status = "loading";
                }
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                const { target = "page", cursor } = action.meta.arg || {};
                const list = state[target];
                const { items, nextCursor, unreadCount } = action.payload;
                state.unreadCount = unreadCount;
                if (cursor) {
                    list.loadingMore = false;
                    // Ignore a page that no longer follows the list (it was reloaded meanwhile).
                    if (cursor !== list.nextCursor) return;
                    const seen = new Set(list.items.map((n) => n._id));
                    list.items.push(...items.filter((n) => !seen.has(n._id)));
                } else {
                    if (action.meta.requestId !== list.requestId) return;
                    list.items = items;
                }
                list.nextCursor = nextCursor;
                list.status = "succeeded";
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                const { target = "page", cursor } = action.meta.arg || {};
                const list = state[target];
                if (cursor) list.loadingMore = false;
                else if (action.meta.requestId !== list.requestId) return;
                list.error = action.payload || "Could not load notifications";
                if (!list.items.length) list.status = "failed";
            })
            .addCase(markNotificationRead.pending, (state, action) => {
                const id = action.meta.arg;
                const wasUnread = [...state.preview.items, ...state.page.items].some((n) => n._id === id && !n.read);
                markItemRead(state.preview, id);
                markItemRead(state.page, id);
                if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
            })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(markAllNotificationsRead.pending, (state) => {
                [...state.preview.items, ...state.page.items].forEach((n) => { n.read = true; });
                state.unreadCount = 0;
            });
    },
});

export default notificationsSlice.reducer;
