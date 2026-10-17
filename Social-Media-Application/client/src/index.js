import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import store from "./redux/store";
import { applyTheme, getInitialTheme } from "./utils/theme";

// Set the theme before the first render so there is no flash of the wrong colors.
applyTheme(getInitialTheme());

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <HashRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </HashRouter>
);
