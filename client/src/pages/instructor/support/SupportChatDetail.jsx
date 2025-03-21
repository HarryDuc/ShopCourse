import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../../../config/axios";
import { ArrowLeft, CheckCircle, Loader2, Send } from "lucide-react";

const SupportChatDetail = () => {
  const { chatId } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const chatEndRef = useRef(null);

  // Kiểm tra quyền instructor
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "instructor") {
    return <Navigate to="/" />;
  }

  // Fetch chat detail
  const fetchChat = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/chat/detail/${chatId}`);
      setChat(response.data.chat);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải thông tin cuộc trò chuyện");
      console.error("Error fetching chat detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();

    // Set up polling to refresh chat data every 10 seconds
    const interval = setInterval(fetchChat, 10000);

    return () => clearInterval(interval);
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending || !chat) return;

    try {
      setSending(true);
      await axios.post("/api/v1/chat/message", {
        chatId: chat._id,
        message: message.trim(),
        role: "instructor"
      });
      setMessage("");
      await fetchChat();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkComplete = async () => {
    if (markingComplete || !chat) return;

    try {
      setMarkingComplete(true);
      await axios.post("/api/v1/chat/success", {
        chatId: chat._id
      });
      await fetchChat();
    } catch (err) {
      console.error("Error marking chat as complete:", err);
      setError("Không thể đánh dấu hoàn thành. Vui lòng thử lại.");
    } finally {
      setMarkingComplete(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/instructor/support"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Link>
      </div>

      {loading && !chat ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Đang tải thông tin cuộc trò chuyện...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      ) : chat ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Hỗ trợ học viên: {chat.userId?.name || "Học viên"}
              </h2>
              <p className="text-sm text-gray-500">
                Khóa học: {chat.courseId?.courseTitle || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                chat.status === "pending" 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {chat.status === "pending" ? "Đang chờ xử lý" : "Đã hoàn thành"}
              </span>
              
              {chat.status === "pending" && (
                <button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {markingComplete ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Đánh dấu hoàn thành</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 h-[500px] overflow-y-auto flex flex-col gap-4">
            {chat.messages.map((msg, index) => {
              const isInstructor = msg.role === "instructor";
              const isUser = msg.role === "user";
              const isAdmin = msg.role === "admin" || msg.role === "model";

              return (
                <div
                  key={index}
                  className={`flex ${isInstructor ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isInstructor
                        ? "bg-blue-600 text-white self-end"
                        : isUser
                        ? "bg-gray-100 text-gray-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
                      <span>
                        {isInstructor
                          ? "Bạn"
                          : isUser
                          ? chat.userId?.name || "Học viên"
                          : "Admin"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(msg.timestamp)}</span>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {chat.status === "pending" ? (
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn phản hồi..."
                  className="flex-1 p-2 border rounded-md"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 ${
                    !message.trim() || sending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 border-t text-center text-gray-500">
              Cuộc trò chuyện này đã được đánh dấu là hoàn thành
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          Không tìm thấy thông tin cuộc trò chuyện
        </div>
      )}
    </div>
  );
};

export default SupportChatDetail;
