import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FaCheck, FaTimes, FaClock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminLayout from "../../components/layouts/AdminLayout";
import axiosInstance from "../../config/axios";

const CommentManagement = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchComments();
      fetchAutoApproveStatus();
    }
  }, [isAuthenticated, user, filter]);

  const fetchAutoApproveStatus = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/comments/auto-approve");
      if (response.data.success) {
        setAutoApproveEnabled(response.data.data.enabled);
      }
    } catch (error) {
      console.error("Error fetching auto approve status:", error);
    }
  };

  const handleToggleAutoApprove = async () => {
    try {
      setIsToggling(true);
      const response = await axiosInstance.put(
        "/api/v1/comments/auto-approve",
        {
          enabled: !autoApproveEnabled,
        }
      );
      if (response.data.success) {
        setAutoApproveEnabled(!autoApproveEnabled);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error("Không thể thay đổi trạng thái tự động duyệt");
    } finally {
      setIsToggling(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/v1/comments/admin?status=${filter}`
      );
      if (response.data.success) {
        setComments(response.data.data);
      } else {
        toast.error(
          response.data.message || "Không thể tải danh sách bình luận"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi tải danh sách bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (commentId, status) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/comments/${commentId}/moderate`,
        { status }
      );
      if (response.data.success) {
        setComments(
          comments.map((c) => (c._id === commentId ? { ...c, status } : c))
        );
        toast.success(
          `Đã ${status === "approved" ? "duyệt" : "từ chối"} bình luận`
        );
      } else {
        toast.error(
          response.data.message || "Không thể cập nhật trạng thái bình luận"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái bình luận");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" /> Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
            <FaCheck className="mr-1" /> Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
            <FaTimes className="mr-1" /> Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quản lý bình luận</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2">Tự động duyệt:</span>
              <button
                onClick={handleToggleAutoApprove}
                disabled={isToggling}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  autoApproveEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                    autoApproveEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <select
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung, người dùng hoặc khóa học..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.length > 0 ? (
              filteredComments.map((comment) => (
                <div
                  key={comment._id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={
                            comment.userId?.photoUrl ||
                            "https://github.com/shadcn.png"
                          }
                          alt={comment.userId?.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">
                            {comment.userId?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                        {getStatusBadge(comment.status)}
                      </div>
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <p className="text-sm text-gray-500">
                        Khóa học: {comment.courseId?.title}
                      </p>
                    </div>
                    {comment.status === "pending" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() =>
                            handleModerate(comment._id, "approved")
                          }
                          className="flex items-center text-sm text-white bg-green-500 px-3 py-2 rounded hover:bg-green-600"
                        >
                          <FaCheck className="mr-1" /> Duyệt
                        </button>
                        <button
                          onClick={() =>
                            handleModerate(comment._id, "rejected")
                          }
                          className="flex items-center text-sm text-white bg-red-500 px-3 py-2 rounded hover:bg-red-600"
                        >
                          <FaTimes className="mr-1" /> Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "Không tìm thấy bình luận phù hợp"
                  : "Chưa có bình luận nào"}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CommentManagement;
