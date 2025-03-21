import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getAllUsers, updateUserRole } from "../../features/api/authApi";
import {
  FaUser,
  FaEdit,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminLayout from "../../components/layouts/AdminLayout";

const UserManagement = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          const response = await getAllUsers();
          if (response.success) {
            setUsers(response.users);
          } else {
            toast.error(
              response.message || "Không thể tải danh sách người dùng"
            );
          }
        } catch (error) {
          console.error(error);
          toast.error("Đã xảy ra lỗi khi tải danh sách người dùng");
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await updateUserRole(userId, newRole);
      if (response.success) {
        // Cập nhật danh sách người dùng
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        toast.success("Cập nhật vai trò thành công");
        setEditingUser(null);
      } else {
        toast.error(
          response.message || "Không thể cập nhật vai trò người dùng"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi cập nhật vai trò người dùng");
    }
  };

  // Lọc người dùng theo tìm kiếm
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Biểu tượng và màu sắc theo vai trò
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FaUser className="text-red-500" />;
      case "instructor":
        return <FaChalkboardTeacher className="text-blue-500" />;
      case "student":
        return <FaUserGraduate className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
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
        <h1 className="text-3xl font-bold mb-8">Quản lý người dùng</h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
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
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Họ tên</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Vai trò</th>
                  <th className="py-3 px-4 text-left">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userItem) => (
                    <tr
                      key={userItem._id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {userItem.photoUrl ? (
                            <img
                              src={userItem.photoUrl || "https://github.com/shadcn.png"}
                              alt={userItem.name}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://github.com/shadcn.png";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <span className="text-gray-500 text-sm">
                                {userItem.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {userItem.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">{userItem.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getRoleIcon(userItem.role)}
                          <span className="ml-2 capitalize">
                            {userItem.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(userItem.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingUser === userItem._id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <select
                              className="p-2 border border-gray-300 rounded"
                              defaultValue={userItem.role}
                              onChange={(e) =>
                                handleRoleChange(userItem._id, e.target.value)
                              }
                            >
                              <option value="student">Học viên</option>
                              <option value="instructor">Giảng viên</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingUser(userItem._id)}
                            className="p-2 text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy người dùng phù hợp"
                        : "Chưa có người dùng nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
