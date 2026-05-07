// apps/frontend/src/api/axiosClient.js

import axios from "axios";

const DEFAULT_TIMEOUT_MS = 120000;

const axiosClient = axios.create({
  baseURL: "/api/v1",
  timeout: DEFAULT_TIMEOUT_MS,
});

axiosClient.interceptors.request.use(
  (config) => {
    // FormData 요청은 브라우저가 boundary를 포함한 Content-Type을 직접 잡게 둔다.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    console.warn("[axiosClient] request failed", {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject(error);
  },
);

export default axiosClient;
