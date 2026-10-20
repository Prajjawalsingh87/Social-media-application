import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import { likeAndUnlikePost } from "./postsSlice";

export const FEED_PAGE_SIZE = 10;

// First page of the feed plus followings and suggestions.
export const getFeedData = createAsyncThunk(
    "user/getFeedData",
    async () => {
        try {
            const response = await axiosClient.get("/user/getFeedData", {
                params: { limit: FEED_PAGE_SIZE },
            });
            return response.result;
        } catch (error) {
            return Promise.reject(error);
        }
    }
);

// Next page for infinite scroll (cursor = createdAt + _id of the last post shown).
export const loadMoreFeed = createAsyncThunk(
    "user/loadMoreFeed",
    async (cursor, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/api/feed", {
                params: { cursor, limit: FEED_PAGE_SIZE },
                silent: true,
            });
            return response.result;
        } catch (error) {
            return rejectWithValue(typeof error === "string" ? error : "Could not load more posts");
        }
    },
    {
        // Ignore duplicate triggers from the scroll observer while a page is loading.
        condition: (cursor, { getState }) => {
            const { feedDataReducer } = getState();
            return Boolean(cursor) && !feedDataReducer.loadingMore;
        },
    }
);

export const followAndUnfollowUser = createAsyncThunk(
    "user/followAndUnfollow",
    async (body) => {
        try {
            const response = await axiosClient.post("/user/follow", body);
            return response.result.user;
        } catch (error) {
            return Promise.reject(error);
        }
    }
);

const feedSlice = createSlice({
    name: "feedSlice",
    initialState: {
        feedData: {},
        loaded: false,
        loadingMore: false,
        loadMoreError: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getFeedData.fulfilled, (state, action) => {
                state.feedData = action.payload;
                state.loaded = true;
                state.loadMoreError = null;
            })
            .addCase(getFeedData.rejected, (state) => {
                state.loaded = true;
            })
            .addCase(loadMoreFeed.pending, (state) => {
                state.loadingMore = true;
                state.loadMoreError = null;
            })
            .addCase(loadMoreFeed.fulfilled, (state, action) => {
                state.loadingMore = false;
                // A refresh (e.g. after posting) may have replaced the list meanwhile.
                if (state.feedData.nextCursor !== action.meta.arg) return;
                const seen = new Set((state.feedData.posts || []).map((post) => post._id));
                const fresh = action.payload.posts.filter((post) => !seen.has(post._id));
                state.feedData.posts = [...(state.feedData.posts || []), ...fresh];
                state.feedData.nextCursor = action.payload.nextCursor;
            })
            .addCase(loadMoreFeed.rejected, (state, action) => {
                state.loadingMore = false;
                state.loadMoreError = action.payload || "Could not load more posts";
            })
            .addCase(likeAndUnlikePost.fulfilled, (state, action) => {
                const post = action.payload;

                const index = state?.feedData?.posts?.findIndex(
                    (item) => item._id === post._id
                );
                if (index !== undefined && index !== -1) {
                    state.feedData.posts[index] = post;
                }
            })
            .addCase(followAndUnfollowUser.fulfilled, (state, action) => {
                const user = action.payload;
                // The feed may not be loaded yet (e.g. following someone from search results).
                if (!Array.isArray(state?.feedData?.followings)) return;
                const index = state.feedData.followings.findIndex(item => item._id === user._id);
                if (index !== -1) {
                    state?.feedData.followings.splice(index, 1);
                } else {
                    state?.feedData.followings.push(user);
                }
            })
    },
});

export default feedSlice.reducer;
