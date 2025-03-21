import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import AdminLayout from "../../components/layouts/AdminLayout";
import axiosInstance from "../../config/axios";

const BannedWordManagement = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [bannedWords, setBannedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWordId, setCurrentWordId] = useState(null);
  const [wordText, setWordText] = useState("");
  const [category, setCategory] = useState("other");
  const inputRef = useRef(null);

  // Fetching banned words on component mount
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchBannedWords();
    }
  }, [isAuthenticated, user]);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [showModal]);

  const fetchBannedWords = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/v1/banned-words");
      if (response.data.success) {
        setBannedWords(response.data.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách từ cấm");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setWordText("");
    setCategory("other");
    setIsEditing(false);
    setCurrentWordId(null);
    setShowModal(true);
  };

  const openEditModal = (word) => {
    setWordText(word.word);
    setCategory(word.category);
    setIsEditing(true);
    setCurrentWordId(word._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setWordText("");
    setCategory("other");
    setIsEditing(false);
    setCurrentWordId(null);
  };

  const handleWordChange = (e) => {
    setWordText(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!wordText.trim()) {
      toast.error("Vui lòng nhập từ cấm");
      return;
    }

    try {
      if (isEditing) {
        // Update existing word
        const response = await axiosInstance.put(
          `/api/v1/banned-words/${currentWordId}`,
          { word: wordText, category }
        );

        if (response.data.success) {
          // Update local state
          setBannedWords(
            bannedWords.map((word) =>
              word._id === currentWordId ? response.data.data : word
            )
          );
          toast.success("Đã cập nhật từ cấm");
          closeModal();
        }
      } else {
        // Add new word
        const response = await axiosInstance.post("/api/v1/banned-words", {
          word: wordText,
          category,
        });

        if (response.data.success) {
          // Update local state
          setBannedWords([response.data.data, ...bannedWords]);
          toast.success("Đã thêm từ cấm mới");
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa từ cấm này?")) return;

    try {
      const response = await axiosInstance.delete(`/api/v1/banned-words/${id}`);

      if (response.data.success) {
        // Update local state
        setBannedWords(bannedWords.filter((word) => word._id !== id));
        toast.success("Đã xóa từ cấm");
      }
    } catch (error) {
      toast.error("Không thể xóa từ cấm");
    }
  };

  // Helper function to get category label
  const getCategoryLabel = (category) => {
    switch (category) {
      case "profanity":
        return "Từ tục tĩu";
      case "spam":
        return "Spam";
      case "hate_speech":
        return "Phát ngôn thù địch";
      default:
        return "Khác";
    }
  };

  // Redirect if not authenticated or not admin
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
          <h1 className="text-3xl font-bold">Quản lý từ cấm</h1>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaPlus className="mr-2" /> Thêm từ cấm
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Từ cấm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bannedWords.length > 0 ? (
                  bannedWords.map((word) => (
                    <tr key={word._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{word.word}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryLabel(word.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(word.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openEditModal(word)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          aria-label="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(word._id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Chưa có từ cấm nào được thêm vào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Add/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">
                {isEditing ? "Chỉnh sửa từ cấm" : "Thêm từ cấm mới"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Từ cấm
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full p-2 border rounded"
                    value={wordText}
                    onChange={handleWordChange}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Danh mục
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={category}
                    onChange={handleCategoryChange}
                  >
                    <option value="profanity">Từ tục tĩu</option>
                    <option value="spam">Spam</option>
                    <option value="hate_speech">Phát ngôn thù địch</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {isEditing ? "Cập nhật" : "Thêm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BannedWordManagement;