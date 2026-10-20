import React from "react";
import { Link } from "react-router-dom";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Words from a search query worth highlighting ("#tag" highlights as "tag" too).
export function getHighlightTerms(query = "") {
    return [...new Set(
        String(query)
            .toLowerCase()
            .split(/\s+/)
            .map((t) => t.replace(/^[-#"]+|"+$/g, ""))
            .filter((t) => t.length > 0)
    )].sort((a, b) => b.length - a.length);
}

// Wraps every term that starts a word in <mark>. Search is prefix based, so "trav" marks "trav|el".
export function highlight(text = "", terms = [], keyPrefix = "h") {
    if (!text || !terms.length) return text;
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${terms.map(escapeRegex).join("|")})`, "giu");
    const out = [];
    let last = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
        const start = match.index + match[1].length;
        if (start > last) out.push(text.slice(last, start));
        out.push(<mark key={`${keyPrefix}-${start}`}>{match[2]}</mark>);
        last = start + match[2].length;
        if (match[0].length === 0) re.lastIndex += 1;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

export const hashtagSearchPath = (tag) => `/search?q=${encodeURIComponent(`#${tag}`)}&tab=posts`;

const HASHTAG_RE = /(^|[^A-Za-z0-9_&])#([A-Za-z0-9_]{1,50})/g;

// Caption with #hashtags turned into links to the hashtag search, plus optional highlights.
export function renderCaption(caption = "", terms = []) {
    const out = [];
    let last = 0;
    let match;
    HASHTAG_RE.lastIndex = 0;
    while ((match = HASHTAG_RE.exec(caption)) !== null) {
        const start = match.index + match[1].length;
        if (start > last) out.push(...[].concat(highlight(caption.slice(last, start), terms, `t${last}`)));
        const tag = match[2];
        out.push(
            <Link key={`tag-${start}`} className="hashtag" to={hashtagSearchPath(tag)}>
                #{highlight(tag, terms, `g${start}`)}
            </Link>
        );
        last = start + tag.length + 1;
    }
    if (last < caption.length) out.push(...[].concat(highlight(caption.slice(last), terms, `t${last}`)));
    return out;
}
