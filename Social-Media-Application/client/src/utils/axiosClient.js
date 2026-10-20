import axios from "axios";
import {
    getItem,
    KEY_ACCESS_TOKEN,
    removeItem,
    setItem,
} from "./localStorageManager";
import store from '../redux/store';
import { setLoading, showToast } from "../redux/slices/appConfigSlice";
import { TOAST_FAILURE } from "../App";

let baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4001';

console.log('API Base URL:', baseURL);

export const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
});

axiosClient.interceptors.request.use((request) => {
    const accessToken = getItem(KEY_ACCESS_TOKEN);
    request.headers["Authorization"] = `Bearer ${accessToken}`;
    // { background: true } requests (polling) don't flash the top loading bar.
    if (!request.background) {
        store.dispatch(setLoading(true));
    }

    return request;
});

// Requests made with { silent: true } show their own error state instead of a toast.
function toastFailure(config, message) {
    if (!config?.silent) {
        store.dispatch(showToast({
            type: TOAST_FAILURE,
            message
        }))
    }
}

// The access token expired: get a new one with the refresh cookie and replay the request once.
async function retryWithFreshToken(originalRequest, message) {
    originalRequest._retry = true;

    const response = await axios
        .create({
            withCredentials: true,
        })
        .get(`${baseURL}/auth/refresh`);

    if (response.data.status === "ok") {
        setItem(KEY_ACCESS_TOKEN, response.data.result.accessToken);
        return axiosClient(originalRequest);
    }

    removeItem(KEY_ACCESS_TOKEN);
    window.location.replace("/login", "_self");
    return Promise.reject(message);
}

axiosClient.interceptors.response.use(async (respone) => {
    if (!respone.config?.background) {
        store.dispatch(setLoading(false));
    }
    const data = respone.data;
    if (data.status === "ok") {
        return data;
    }

    const originalRequest = respone.config;
    const statusCode = data.statusCode;
    const error = data.message

    toastFailure(originalRequest, error);

    if (statusCode === 401 && !originalRequest._retry) {
        return retryWithFreshToken(originalRequest, error);
    }
    return Promise.reject(error);
}, async (error) => {
    if (!error.config?.background) {
        store.dispatch(setLoading(false));
    }
    if (axios.isCancel(error)) {
        return Promise.reject(error);
    }

    // Routes under /api answer with real HTTP status codes and the usual JSON body.
    const data = error.response?.data;
    const message = data?.message || error.message;
    const originalRequest = error.config;

    if (data?.statusCode === 401 && originalRequest && !originalRequest._retry) {
        return retryWithFreshToken(originalRequest, message);
    }

    toastFailure(originalRequest, message);
    return Promise.reject(message);
});
