import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaTachometerAlt,
  FaComments,
  FaHome,
  FaBook,
  FaBan,
  FaMoneyBill,
  FaHeadset,
} from "react-icons/fa";

const menuItems = [
  {
    title: "Tổng quan",
    path: "/admin",
    icon: <FaHome />,
  },
  // {
  //   title: "Quản lý khóa học",
  //   path: "/admin/courses",
  //   icon: <FaBook />,
  // },
  {
    title: "Quản lý người dùng",
    path: "/admin/users",
    icon: <FaUsers />,
  },
  {
    title: "Quản lý bình luận",
    path: "/admin/comments",
    icon: <FaComments />,
  },
  {
    title: "Quản lý từ cấm",
    path: "/admin/banned-words",
    icon: <FaBan />,
  },
  {
    title: "Yêu cầu làm giảng viên",
    path: "/admin/instructor-requests",
    icon: <FaMoneyBill />,
  },
  {
    title: "Quản lý hỗ trợ",
    path: "/admin/chats",
    icon: <FaHeadset />,
  },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="mt-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-600"
                  : ""
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
