import axios from "axios";
import { toast } from "sonner";

const instance = axios.create({
  withCredentials: true,
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage nếu cần
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Xử lý các lỗi response
      switch (error.response.status) {
        case 401:
          // Xử lý lỗi unauthorized
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          window.location.href = "/login";
          break;
        case 403:
          toast.error("Bạn không có quyền thực hiện hành động này");
          break;
        case 404:
          toast.error("Không tìm thấy tài nguyên yêu cầu");
          break;
        case 400:
          toast.error(error.response.data.message || "Yêu cầu không hợp lệ");
          break;
        default:
          toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
