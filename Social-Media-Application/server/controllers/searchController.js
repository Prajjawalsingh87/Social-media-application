import ta from "time-ago";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { success, error } from "../utils/responseWrapper.js";
import { ensureSearchIndexes } from "../utils/searchIndexes.js";

export const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 8;
const MAX_LIMIT = 20;
const MAX_PAGE = 50;
// Upper bound of candidates pulled per strategy before merging + ranking in memory.
const CANDIDATE_CAP = 200;
const SEARCH_TYPES = ["all", "users", "posts"];
const HASHTAG_RE = /^#([A-Za-z0-9_]{1,50})$/;
const HASHTAG_IN_TEXT_RE = /(?:^|[^A-Za-z0-9_&])#([A-Za-z0-9_]{1,50})/g;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toInt(value, fallback, min, max) {
    const n = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
}

// Validates and normalises ?q=&type=&page=&limit=. Returns { error } or the parsed params.
export function parseSearchParams(query = {}) {
    const rawQ = Array.isArray(query.q) ? query.q[0] : query.q;
    const q = String(rawQ ?? "").replace(/\s+/g, " ").trim();
    if (!q) {
        return { error: "Search query (q) is required" };
    }
    if (q.length > MAX_QUERY_LENGTH) {
        return { error: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer` };
    }

    const type = String((Array.isArray(query.type) ? query.type[0] : query.type) || "all").toLowerCase();
    if (!SEARCH_TYPES.includes(type)) {
        return { error: `type must be one of: ${SEARCH_TYPES.join(", ")}` };
    }

    const defaultLimit = type === "all" ? 5 : 10;
    const page = toInt(query.page, 1, 1, MAX_PAGE);
    const limit = toInt(query.limit, defaultLimit, 1, MAX_LIMIT);

    const hashtagMatch = q.match(HASHTAG_RE);
    const hashtag = hashtagMatch ? hashtagMatch[1].toLowerCase() : null;

    // $text treats "quoted phrases" and -negation specially; strip them so user input is plain terms.
    const terms = q
        .split(" ")
        .map((t) => t.replace(/"/g, "").replace(/^[-#]+/, ""))
        .filter(Boolean)
        .slice(0, MAX_TERMS);

    return { q, type, page, limit, hashtag, terms, textQuery: terms.join(" ") };
}

function paginate(items, page, limit) {
    const start = (page - 1) * limit;
    return {
        items: items.slice(start, start + limit),
        total: items.length,
        page,
        limit,
        hasMore: start + limit < items.length,
    };
}

const emptyPage = (page, limit) => ({ items: [], total: 0, page, limit, hasMore: false });

const idOf = (doc) => doc._id.toString();

function mapSearchPost(post, userId) {
    const likes = post.likes || [];
    return {
        _id: post._id,
        caption: post.caption,
        image: post.image,
        owner: {
            _id: post.owner?._id,
            name: post.owner?.name,
            avatar: post.owner?.avatar,
        },
        likesCount: likes.length,
        isLiked: likes.some((id) => id.toString() === userId),
        timeAgo: ta.ago(post.createdAt),
        createdAt: post.createdAt,
    };
}

async function searchUsers({ q, textQuery, page, limit }, curUser) {
    const lowerQ = q.toLowerCase();
    const fields = "name bio avatar followers";
    const prefixRe = new RegExp(`(^|\\s)${escapeRegex(q)}`, "i");

    const [textHits, prefixHits] = await Promise.all([
        textQuery
            ? User.find({ $text: { $search: textQuery } }, { score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" } })
                .limit(CANDIDATE_CAP)
                .select(fields)
                .lean()
            : [],
        User.find({ name: prefixRe }).limit(CANDIDATE_CAP).select(fields).lean(),
    ]);

    const merged = new Map();
    for (const u of textHits) merged.set(idOf(u), { user: u, score: u.score || 0 });
    for (const u of prefixHits) {
        if (!merged.has(idOf(u))) merged.set(idOf(u), { user: u, score: 0 });
    }

    // Name matches outrank bio matches: exact > starts-with > any word starts-with.
    for (const entry of merged.values()) {
        const name = (entry.user.name || "").toLowerCase();
        if (name === lowerQ) entry.score += 20;
        else if (name.startsWith(lowerQ)) entry.score += 12;
        else if (prefixRe.test(entry.user.name || "")) entry.score += 8;
    }

    const followings = new Set((curUser?.followings || []).map((id) => id.toString()));
    const ranked = [...merged.values()]
        .sort((a, b) =>
            b.score - a.score ||
            (b.user.followers?.length || 0) - (a.user.followers?.length || 0) ||
            (a.user.name || "").localeCompare(b.user.name || "")
        )
        .map(({ user, score }) => ({
            _id: user._id,
            name: user.name,
            bio: user.bio || "",
            avatar: user.avatar,
            followersCount: user.followers?.length || 0,
            isFollowing: followings.has(idOf(user)),
            isMe: idOf(user) === curUser?._id?.toString(),
            score: Math.round(score * 100) / 100,
        }));

    return paginate(ranked, page, limit);
}

async function searchPosts({ q, textQuery, hashtag, page, limit }, userId) {
    let candidates;

    if (hashtag) {
        const tagRe = new RegExp(`(^|[^A-Za-z0-9_&])#${hashtag}(?![A-Za-z0-9_])`, "i");
        const hits = await Post.find({ caption: tagRe })
            .sort({ createdAt: -1 })
            .limit(CANDIDATE_CAP)
            .populate("owner", "name avatar")
            .lean();
        candidates = hits.map((p) => ({ post: p, score: 10 }));
    } else {
        const phraseRe = new RegExp(`(^|[^A-Za-z0-9_])${escapeRegex(q)}`, "i");
        const [textHits, phraseHits] = await Promise.all([
            textQuery
                ? Post.find({ $text: { $search: textQuery } }, { score: { $meta: "textScore" } })
                    .sort({ score: { $meta: "textScore" } })
                    .limit(CANDIDATE_CAP)
                    .populate("owner", "name avatar")
                    .lean()
                : [],
            Post.find({ caption: phraseRe })
                .sort({ createdAt: -1 })
                .limit(CANDIDATE_CAP)
                .populate("owner", "name avatar")
                .lean(),
        ]);

        const merged = new Map();
        for (const p of textHits) merged.set(idOf(p), { post: p, score: p.score || 0 });
        for (const p of phraseHits) {
            const entry = merged.get(idOf(p));
            // Whole query appears as typed (also catches half-typed words the stemmer misses).
            if (entry) entry.score += 3;
            else merged.set(idOf(p), { post: p, score: 3 });
        }
        candidates = [...merged.values()];
    }

    const ranked = candidates
        .filter((c) => c.post.owner) // skip posts whose owner was deleted
        .map((c) => ({ ...c, score: c.score + Math.log1p(c.post.likes?.length || 0) * 0.5 }))
        .sort((a, b) => b.score - a.score || new Date(b.post.createdAt) - new Date(a.post.createdAt))
        .map(({ post, score }) => ({ ...mapSearchPost(post, userId), score: Math.round(score * 100) / 100 }));

    return paginate(ranked, page, limit);
}

// GET /api/search?q=&type=all|users|posts&page=&limit=
export const searchController = async (req, res) => {
    const params = parseSearchParams(req.query);
    if (params.error) {
        return res.send(error(400, params.error));
    }

    try {
        await ensureSearchIndexes();
        const curUser = await User.findById(req._id).select("followings").lean();
        const { type, page, limit, hashtag } = params;

        // A #hashtag query is about posts; people results would only be noise.
        const wantUsers = (type === "all" || type === "users") && !hashtag;
        const wantPosts = type === "all" || type === "posts";

        const [users, posts] = await Promise.all([
            wantUsers ? searchUsers(params, curUser) : emptyPage(page, limit),
            wantPosts ? searchPosts(params, req._id) : emptyPage(page, limit),
        ]);

        return res.send(success(200, { query: params.q, type, hashtag, users, posts }));
    } catch (e) {
        console.log("search error", e);
        return res.send(error(500, "Search is temporarily unavailable"));
    }
};

export function extractHashtags(caption = "") {
    const tags = new Set();
    for (const match of String(caption).matchAll(HASHTAG_IN_TEXT_RE)) {
        tags.add(match[1].toLowerCase());
    }
    return [...tags];
}

// GET /api/trending?days=7&limit=5 — most liked recent posts and the hashtags used most.
export const trendingController = async (req, res) => {
    try {
        const days = toInt(req.query.days, 7, 1, 30);
        const limit = toInt(req.query.limit, 5, 1, 20);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [top, recentCaptions] = await Promise.all([
            Post.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
                { $match: { likesCount: { $gt: 0 } } },
                { $sort: { likesCount: -1, createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: User.collection.name,
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                    },
                },
                { $unwind: "$owner" },
            ]),
            Post.find({ createdAt: { $gte: since }, caption: /#/ })
                .sort({ createdAt: -1 })
                .limit(1000)
                .select("caption")
                .lean(),
        ]);

        const counts = new Map();
        for (const { caption } of recentCaptions) {
            for (const tag of extractHashtags(caption)) {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            }
        }
        const hashtags = [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        return res.send(success(200, {
            days,
            since,
            posts: top.map((p) => mapSearchPost(p, req._id)),
            hashtags,
        }));
    } catch (e) {
        console.log("trending error", e);
        return res.send(error(500, "Trending is temporarily unavailable"));
    }
};

export default { searchController, trendingController };
