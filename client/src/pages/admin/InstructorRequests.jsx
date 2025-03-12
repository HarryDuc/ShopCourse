import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  getInstructorRequests,
  approveInstructorRequest,
  rejectInstructorRequest,
} from "../../features/api/authApi";
import { FaUserGraduate, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminLayout from "../../components/layouts/AdminLayout";

const InstructorRequests = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chỉ fetch data khi đã xác thực và là admin
    if (isAuthenticated && user?.role === "admin") {
      const fetchRequests = async () => {
        try {
          setLoading(true);
          const response = await getInstructorRequests();
          if (response.success) {
            setRequests(response.requests);
          } else {
            toast.error(response.message || "Không thể tải danh sách yêu cầu");
          }
        } catch (error) {
          console.error(error);
          toast.error("Đã xảy ra lỗi khi tải danh sách yêu cầu");
        } finally {
          setLoading(false);
        }
      };

      fetchRequests();
    }
  }, [isAuthenticated, user]);

  const handleApprove = async (userId) => {
    try {
      const response = await approveInstructorRequest(userId);
      if (response.success) {
        // Xóa khỏi danh sách yêu cầu
        setRequests(requests.filter((req) => req._id !== userId));
        toast.success("Đã phê duyệt yêu cầu");
      } else {
        toast.error(response.message || "Không thể phê duyệt yêu cầu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi phê duyệt yêu cầu");
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await rejectInstructorRequest(userId);
      if (response.success) {
        // Xóa khỏi danh sách yêu cầu
        setRequests(requests.filter((req) => req._id !== userId));
        toast.success("Đã từ chối yêu cầu");
      } else {
        toast.error(response.message || "Không thể từ chối yêu cầu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi từ chối yêu cầu");
    }
  };

  // Kiểm tra quyền admin
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">
          Yêu cầu trở thành giảng viên
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {requests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {request.photoUrl ? (
                          <img
                            src={request.photoUrl}
                            alt={request.name}
                            className="w-12 h-12 rounded-full mr-4 object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                            <FaUserGraduate className="text-blue-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {request.name}
                          </h3>
                          <p className="text-gray-600">{request.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500">
                        Ngày yêu cầu:{" "}
                        {new Date(request.updatedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                      >
                        <FaCheck className="mr-2" />
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                      >
                        <FaTimes className="mr-2" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <FaUserGraduate className="text-gray-400 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Không có yêu cầu nào
                </h3>
                <p className="text-gray-500">
                  Hiện tại không có yêu cầu nâng cấp từ học viên lên giảng viên
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InstructorRequests;
