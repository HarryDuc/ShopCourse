import { useState, useEffect } from "react";
import axios from "../../../config/axios";
import { useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { Loader2, MessageSquare, RefreshCw, Search } from "lucide-react";

const ManageSupport = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, completed

  // Kiểm tra quyền instructor
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "instructor") {
    return <Navigate to="/" />;
  }

  // Fetch all instructor support chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/chat/all");
      setChats(response.data.chats);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách hỗ trợ");
      console.error("Error fetching support chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Set up polling to refresh chat data every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLatestMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return null;
    return chat.messages[chat.messages.length - 1];
  };

  // Filter chats based on search term and status filter
  const filteredChats = chats.filter((chat) => {
    // Filter by status
    if (filter === "pending" && chat.status !== "pending") return false;
    if (filter === "completed" && chat.status !== "success") return false;
    
    // Filter by search term
    if (searchTerm) {
      const studentName = chat.userId?.name?.toLowerCase() || "";
      const courseTitle = chat.courseId?.courseTitle?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      return studentName.includes(search) || courseTitle.includes(search);
    }
    
    return true;
  });

  // Sort chats by updatedAt timestamp (most recent first)
  const sortedChats = [...filteredChats].sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý hỗ trợ từ học viên</h1>
        <button 
          onClick={fetchChats} 
          className="flex items-center gap-2 p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          <span>{loading ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học viên hoặc khóa học..."
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md ${
              filter === "all" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("all")}
          >
            Tất cả
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              filter === "pending" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("pending")}
          >
            Đang chờ xử lý
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              filter === "completed" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("completed")}
          >
            Đã hoàn thành
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading && chats.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Đang tải danh sách hỗ trợ...</span>
        </div>
      ) : sortedChats.length === 0 ? (
        <div className="bg-gray-100 rounded-md p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Không có yêu cầu hỗ trợ nào</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== "all" 
              ? "Không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại"
              : "Hiện chưa có học viên nào gửi yêu cầu hỗ trợ cho khóa học của bạn"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedChats.map((chat) => {
            const latestMessage = getLatestMessage(chat);
            
            return (
              <Link
                key={chat._id}
                to={`/instructor/support/chat/${chat._id}`}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        {chat.userId?.name || "Học viên"}
                      </h3>
                      <div className="text-xs px-2 py-1 rounded-full font-medium bg-opacity-10 flex items-center">
                        {chat.status === "pending" ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        )}
                        {chat.status === "pending" ? "Đang chờ" : "Đã xong"}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-3">
                      Khóa học: {chat.courseId?.courseTitle || "N/A"}
                    </p>
                    
                    <div className="text-sm mb-2 line-clamp-2">
                      {latestMessage ? (
                        <>
                          <span className="font-medium">
                            {latestMessage.role === "user" 
                              ? "Học viên: " 
                              : latestMessage.role === "instructor" 
                                ? "Bạn: " 
                                : "Admin: "}
                          </span>
                          {latestMessage.text}
                        </>
                      ) : (
                        <span className="text-gray-400">Chưa có tin nhắn</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="self-end text-xs text-gray-500">
                    Cập nhật: {formatDate(chat.updatedAt)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageSupport;
