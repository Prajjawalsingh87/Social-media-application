import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import { likeAndUnlikePost } from "./postsSlice";
import { followAndUnfollowUser } from "./feedSlice";

const emptyPage = { items: [], total: 0, page: 1, hasMore: false };

// type: "all" | "users" | "posts". append=true loads the next page of one type.
export const runSearch = createAsyncThunk(
    "search/run",
    async ({ q, type = "all", page = 1, limit }, { signal, rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/api/search", {
                params: { q, type, page, limit },
                signal,
                silent: true,
            });
            return response.result;
        } catch (error) {
            if (signal.aborted) throw error;
            return rejectWithValue(typeof error === "string" ? error : "Search failed. Check your connection and try again.");
        }
    }
);

export const getTrending = createAsyncThunk(
    "search/trending",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/api/trending", { silent: true });
            return response.result;
        } catch (error) {
            return rejectWithValue(typeof error === "string" ? error : "Could not load trending");
        }
    }
);

function replacePost(list, post) {
    const index = list.findIndex((item) => item._id === post._id);
    if (index !== -1) {
        list[index] = { ...list[index], ...post };
    }
}

const searchSlice = createSlice({
    name: "searchSlice",
    initialState: {
        query: "",
        status: "idle", // idle | loading | succeeded | failed
        loadingMore: false,
        error: null,
        requestId: null,
        users: emptyPage,
        posts: emptyPage,
        trending: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(runSearch.pending, (state, action) => {
                const { q, page = 1 } = action.meta.arg;
                state.requestId = action.meta.requestId;
                state.error = null;
                if (page > 1) {
                    state.loadingMore = true;
                } else {
                    state.status = "loading";
                    state.query = q;
                }
            })
            .addCase(runSearch.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return;
                const { type = "all", page = 1 } = action.meta.arg;
                const { users, posts } = action.payload;
                if (page > 1) {
                    const key = type === "users" ? "users" : "posts";
                    const next = action.payload[key];
                    state[key] = { ...next, items: [...state[key].items, ...next.items] };
                } else {
                    state.users = users;
                    state.posts = posts;
                }
                state.status = "succeeded";
                state.loadingMore = false;
            })
            .addCase(runSearch.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId || action.meta.aborted) return;
                state.status = "failed";
                state.loadingMore = false;
                state.error = action.payload || "Search failed";
            })
            .addCase(getTrending.fulfilled, (state, action) => {
                state.trending = action.payload;
            })
            .addCase(getTrending.rejected, (state) => {
                state.trending = { posts: [], hashtags: [], failed: true };
            })
            .addCase(likeAndUnlikePost.fulfilled, (state, action) => {
                replacePost(state.posts.items, action.payload);
                if (state.trending) replacePost(state.trending.posts, action.payload);
            })
            .addCase(followAndUnfollowUser.fulfilled, (state, action) => {
                const user = state.users.items.find((item) => item._id === action.payload._id);
                if (user) {
                    user.isFollowing = !user.isFollowing;
                    user.followersCount = action.payload.followers?.length ?? user.followersCount;
                }
            });
    },
});

export default searchSlice.reducer;
