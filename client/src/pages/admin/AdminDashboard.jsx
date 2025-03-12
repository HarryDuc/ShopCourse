import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { FaUsers, FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import AdminLayout from "../../components/layouts/AdminLayout";

const AdminDashboard = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Kiểm tra quyền admin
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  // Các thẻ thống kê
  const statCards = [
    {
      title: "Quản lý người dùng",
      icon: <FaUsers className="text-blue-500 text-4xl" />,
      description: "Xem và quản lý tất cả người dùng hệ thống",
      link: "/admin/users",
      color: "bg-blue-100",
    },
    {
      title: "Yêu cầu nâng cấp",
      icon: <FaUserGraduate className="text-green-500 text-4xl" />,
      description: "Quản lý yêu cầu nâng cấp từ học viên lên giảng viên",
      link: "/admin/instructor-requests",
      color: "bg-green-100",
    },
    {
      title: "Quản lý khóa học",
      icon: <FaChalkboardTeacher className="text-purple-500 text-4xl" />,
      description: "Xem và quản lý tất cả khóa học",
      link: "/admin/courses",
      color: "bg-purple-100",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className={`${card.color} rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center`}
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
