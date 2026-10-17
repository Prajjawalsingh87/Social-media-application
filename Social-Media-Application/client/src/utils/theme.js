import { getItem, setItem } from "./localStorageManager";

export const KEY_THEME_MODE = "theme_mode";

// Saved choice first, otherwise follow the operating system setting.
export function getInitialTheme() {
    const saved = getItem(KEY_THEME_MODE);
    if (saved === "light" || saved === "dark") {
        return saved;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

export function applyTheme(theme) {
    document.body.dataset.theme = theme;
}

export function saveTheme(theme) {
    applyTheme(theme);
    setItem(KEY_THEME_MODE, theme);
}
