import React, { useState } from "react";
import { useSelector } from "react-redux";
import { requestInstructorRole } from "../../features/api/authApi";
import { toast } from "react-hot-toast";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";

const RequestInstructor = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  // Kiểm tra xem người dùng có phải là học viên hay không
  if (user?.role !== "student") {
    return null;
  }

  const handleRequest = async () => {
    try {
      setLoading(true);
      const response = await requestInstructorRole();

      if (response.success) {
        toast.success("Đã gửi yêu cầu trở thành giảng viên");
      } else {
        toast.error(response.message || "Không thể gửi yêu cầu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị trạng thái khác nhau dựa trên instructorRequest
  if (user?.instructorRequest === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-yellow-100 p-2 rounded-full mr-4">
            <FaUserGraduate className="text-yellow-500" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-700">Yêu cầu đang xử lý</h3>
            <p className="text-sm text-yellow-600">
              Yêu cầu trở thành giảng viên của bạn đang được xem xét. Chúng tôi
              sẽ thông báo cho bạn khi có kết quả.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.instructorRequest === "approved") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-4">
            <FaChalkboardTeacher className="text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-green-700">
              Yêu cầu đã được phê duyệt
            </h3>
            <p className="text-sm text-green-600">
              Yêu cầu trở thành giảng viên của bạn đã được phê duyệt. Vui lòng
              đăng nhập lại để cập nhật vai trò mới.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.instructorRequest === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-red-100 p-2 rounded-full mr-4">
            <FaUserGraduate className="text-red-500" />
          </div>
          <div>
            <h3 className="font-medium text-red-700">Yêu cầu bị từ chối</h3>
            <p className="text-sm text-red-600">
              Yêu cầu trở thành giảng viên của bạn đã bị từ chối. Bạn có thể thử
              lại sau.
            </p>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="mt-2 bg-red-100 text-red-700 py-1 px-3 rounded text-sm hover:bg-red-200"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-4">
          <FaChalkboardTeacher className="text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-700">Trở thành giảng viên</h3>
          <p className="text-sm text-blue-600 mb-2">
            Bạn có kinh nghiệm và kiến thức muốn chia sẻ? Hãy trở thành giảng
            viên và tạo khóa học của riêng mình.
          </p>
          <button
            onClick={handleRequest}
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Đang xử lý..." : "Yêu cầu trở thành giảng viên"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestInstructor;
