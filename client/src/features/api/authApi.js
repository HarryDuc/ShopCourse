import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../authSlice";

const USER_API = "http://localhost:8080/api/v1/user/";

// Tạo API URL dựa trên biến môi trường hoặc sử dụng URL mặc định nếu không có
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:8080";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),
    }),
    loginUser: builder.mutation({
      query: (inputData) => ({
        url: "login",
        method: "POST",
        body: inputData,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: "logout",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          dispatch(userLoggedOut());
        } catch (error) {
          console.log(error);
        }
      },
    }),
    loadUser: builder.query({
      query: () => ({
        url: "profile",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "profile/update",
        method: "PUT",
        body: formData,
        credentials: "include",
      }),
    }),
  }),
});
export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
} = authApi;

// Admin APIs
export const getAllUsers = async () => {
  try {
    console.log("Gọi API lấy danh sách người dùng...");
    const res = await fetch(`${API_URL}/api/v1/user/admin/users`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    const data = await res.json();
    console.log("Get All Users response:", data);
    return data;
  } catch (error) {
    console.log("Get All Users error:", error);
    return { success: false, message: "Lỗi khi lấy danh sách người dùng" };
  }
};

export const getUserById = async (userId) => {
  try {
    const res = await fetch(`${API_URL}/api/v1/user/admin/users/${userId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Lỗi khi lấy thông tin người dùng" };
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/user/admin/users/${userId}/role`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Lỗi khi cập nhật vai trò người dùng" };
  }
};

export const getInstructorRequests = async () => {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/user/admin/instructor-requests`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    const data = await res.json();
    console.log("Get Instructor Requests response:", data); // Thêm debug log
    return data;
  } catch (error) {
    console.log("Get Instructor Requests error:", error);
    return {
      success: false,
      message: "Lỗi khi lấy danh sách yêu cầu nâng cấp",
    };
  }
};

export const approveInstructorRequest = async (userId) => {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/user/admin/instructor-requests/${userId}/approve`,
      {
        method: "PUT",
        credentials: "include",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Lỗi khi phê duyệt yêu cầu" };
  }
};

export const rejectInstructorRequest = async (userId) => {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/user/admin/instructor-requests/${userId}/reject`,
      {
        method: "PUT",
        credentials: "include",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Lỗi khi từ chối yêu cầu" };
  }
};

// User Request Instructor API
export const requestInstructorRole = async () => {
  try {
    const res = await fetch(`${API_URL}/api/v1/user/request-instructor`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Lỗi khi gửi yêu cầu trở thành giảng viên",
    };
  }
};
