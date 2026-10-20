// End-to-end check for account deletion and notifications, run against a live API:
//
//   node scripts/check-account-deletion.mjs [baseUrl]      (default http://localhost:4001)
//
// It signs up three throwaway accounts (orbit_test_bot_<hex>a/b/c@example.com), builds
// likes, follows and notifications between them, deletes account A and asserts that only
// A's own data disappeared. It then deletes B and C the same way, so it leaves nothing
// behind (post images are removed from Cloudinary by the delete endpoint).
// Regression: the old delete removed the last like from every post A had NOT liked.
import crypto from "node:crypto";

const BASE = (process.argv[2] || process.env.API_URL || "http://localhost:4001").replace(/\/$/, "");
const RUN = crypto.randomBytes(4).toString("hex");
// 1x1 PNG, enough for Cloudinary.
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

let failures = 0;
const check = (label, ok, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};

async function call(method, path, { token, body, query } = {}) {
    const url = new URL(BASE + path);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, {
        method,
        headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { http: res.status, ...data };
}

async function ok(method, path, opts) {
    const r = await call(method, path, opts);
    if (r.status !== "ok") throw new Error(`${method} ${path} -> ${r.statusCode} ${r.message}`);
    return r.result;
}

async function makeUser(suffix) {
    const name = `orbit_test_bot_${RUN}${suffix}`;
    const email = `${name}@example.com`;
    const password = crypto.randomBytes(12).toString("base64url");
    await ok("POST", "/auth/signup", { body: { name, email, password } });
    const { accessToken } = await ok("POST", "/auth/login", { body: { email, password } });
    const { user } = await ok("GET", "/user/getMyInfo", { token: accessToken });
    return { name, email, password, token: accessToken, id: user._id };
}

const post = async (u, caption) => (await ok("POST", "/posts", { token: u.token, body: { caption, postImg: PIXEL } })).post._id;
const like = (u, postId) => ok("POST", "/posts/like", { token: u.token, body: { postId } });
const follow = (u, other) => ok("POST", "/user/follow", { token: u.token, body: { userIdToFollow: other.id } });
const profile = (viewer, u) => ok("POST", "/user/getUserProfile", { token: viewer.token, body: { userId: u.id } });
const notifications = (u) => ok("GET", "/api/notifications", { token: u.token, query: { limit: 30 } });

const users = [];
try {
    console.log(`API ${BASE}, run ${RUN}`);
    // Register each account as soon as it exists so a failed setup still cleans up.
    const A = await makeUser("a");
    users.push(A);
    const B = await makeUser("b");
    users.push(B);
    const C = await makeUser("c");
    users.push(C);

    const p1 = await post(C, `p1 ${RUN}`);
    const p3 = await post(C, `p3 ${RUN}`);
    const p2 = await post(A, `p2 ${RUN} zzdeleteme`);

    await like(A, p1);
    await like(B, p1); // B is the LAST like on p1
    await like(B, p3); // A never liked p3: the old bug removed B's like here
    await like(B, p2);
    await like(C, p2);
    await like(C, p3); // self-like: no notification
    await follow(B, A);
    await follow(A, C);
    await follow(C, A);

    // Notifications before deletion.
    let cn = await notifications(C);
    const cTypes = cn.items.map((n) => `${n.type}:${n.actor.name.slice(-1)}`).sort();
    check("C notified of A like, B likes, A follow (no self-like)",
        JSON.stringify(cTypes) === JSON.stringify(["follow:a", "like:a", "like:b", "like:b"]), cTypes.join(","));
    check("unread count matches", cn.unreadCount === 4, String(cn.unreadCount));
    await like(B, p1); // unlike
    await like(B, p1); // like again: must not create a second notification
    cn = await notifications(C);
    check("repeat like is de-duplicated", cn.items.length === 4, String(cn.items.length));
    const one = cn.items[0]._id;
    const afterOne = await ok("POST", `/api/notifications/${one}/read`, { token: C.token });
    check("mark one read", afterOne.unreadCount === 3, String(afterOne.unreadCount));
    const foreign = await call("POST", `/api/notifications/${one}/read`, { token: B.token });
    check("cannot mark someone else's notification", foreign.http === 404, String(foreign.http));
    const an = await notifications(A);
    check("A notified of B and C likes + B and C follows", an.items.length === 4, String(an.items.length));

    // Delete A.
    await ok("DELETE", "/user", { token: A.token });

    const cProfile = await profile(B, C);
    const byId = Object.fromEntries(cProfile.posts.map((p) => [p._id, p]));
    check("p1 keeps B's like, loses A's", byId[p1].likesCount === 1 && byId[p1].isLiked === true, `likes=${byId[p1].likesCount}`);
    check("p3 (never liked by A) keeps its likes", byId[p3].likesCount === 2 && byId[p3].isLiked === true, `likes=${byId[p3].likesCount}`);
    check("C no longer followed by / following A",
        cProfile.followers.length === 0 && cProfile.followings.length === 0,
        `followers=${cProfile.followers.length} followings=${cProfile.followings.length}`);
    const bInfo = (await ok("GET", "/user/getMyInfo", { token: B.token })).user;
    check("B no longer follows A", bInfo.followings.length === 0, String(bInfo.followings.length));
    const search = await ok("GET", "/api/search", { token: B.token, query: { q: "zzdeleteme", type: "posts" } });
    check("A's posts are gone", search.posts.total === 0, String(search.posts.total));
    cn = await notifications(C);
    const left = cn.items.map((n) => `${n.type}:${n.actor.name.slice(-1)}`).sort();
    check("only A's notifications removed from C", JSON.stringify(left) === JSON.stringify(["like:b", "like:b"]), left.join(","));
    const login = await call("POST", "/auth/login", { body: { email: A.email, password: A.password } });
    check("A can no longer log in", login.statusCode === 404, String(login.statusCode));
    users.shift();
} catch (e) {
    failures++;
    console.log("ERROR", e.message);
} finally {
    // Remove whatever accounts are left (B, C, or all three if setup failed).
    for (const u of users) {
        const r = await call("DELETE", "/user", { token: u.token }).catch((e) => ({ message: e.message }));
        const gone = await call("POST", "/auth/login", { body: { email: u.email, password: u.password } });
        console.log(`cleanup ${u.name}: ${r.status || r.message}, login now ${gone.statusCode}`);
        if (gone.statusCode !== 404) failures++;
    }
}

console.log(failures ? `${failures} check(s) failed` : "All checks passed");
process.exit(failures ? 1 : 0);
