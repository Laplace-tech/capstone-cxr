import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// 요청 인터셉터
axiosClient.interceptors.request.use(
  (config) => {
    // 추후 인증 토큰 주입 위치
    // const token = useAuthStore.getState().token;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // 추후 로그인 페이지로 리다이렉트
      console.warn("[axiosClient] 인증 만료");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;