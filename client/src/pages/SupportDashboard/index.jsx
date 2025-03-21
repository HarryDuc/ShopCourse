import { useState, useEffect, useRef } from "react";
import axios from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import ChatResponse from "./ChatResponse";
import "./style.css";

const SupportDashboard = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [filter, setFilter] = useState("pending"); // pending or success
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const chatBodyRef = useRef(null);

  // Fetch all chats
  useEffect(() => {
    fetchChats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchChats(false); // Silent refresh (no loading state)
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatBodyRef.current && activeChat) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [activeChat]);

  const fetchChats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get("/api/v1/chat/all");
      setChats(response.data.chats || []);
      
      // If we have an active chat, update it
      if (activeChat) {
        const updatedActiveChat = response.data.chats.find(chat => chat._id === activeChat._id);
        if (updatedActiveChat) {
          setActiveChat(updatedActiveChat);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!activeChat || !responseText.trim()) return;

    try {
      setSubmitting(true);
      const role = user.role === "admin" ? "admin" : "instructor";
      await axios.post("/api/v1/chat/message", {
        chatId: activeChat._id,
        message: responseText,
        role
      });
      
      // Clear response text
      setResponseText("");
      
      // Refresh the list to get updated chat
      await fetchChats();
      
      return true;
    } catch (error) {
      console.error("Error sending response:", error);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeChat) return;

    try {
      setSubmitting(true);
      await axios.post("/api/v1/chat/success", {
        chatId: activeChat._id
      });
      
      // Refresh the list to get updated chat
      await fetchChats();
      
      return true;
    } catch (error) {
      console.error("Error marking chat as complete:", error);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Accept a chat support request
  const handleAcceptChat = async (chatId) => {
    try {
      setSubmitting(true);
      
      // Set the selected chat as active
      const selectedChat = chats.find(chat => chat._id === chatId);
      if (selectedChat) {
        setActiveChat(selectedChat);
        
        // Acknowledge the chat (add a system message that admin is now available)
        await axios.post("/api/v1/chat/message", {
          chatId: selectedChat._id,
          message: `${user.role === "admin" ? "Admin" : "Giảng viên"} ${user.name} đã tham gia hỗ trợ cuộc trò chuyện.`,
          role: "system"
        });
        
        // Refresh data
        await fetchChats();
      }
    } catch (error) {
      console.error("Error accepting chat:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter chats based on selected filter and user role
  const filteredChats = chats.filter(chat => {
    // Filter by status
    const statusMatch = chat.status === filter;
    
    // Filter by role
    if (user.role === "admin") {
      // Admin sees all admin support chats
      if (chat.supportType === "admin") {
        return statusMatch;
      }
    } else if (user.role === "instructor") {
      // Instructor only sees chats assigned to them
      if (chat.supportType === "instructor" && 
          chat.instructorId && 
          chat.instructorId._id === user._id) {
        return statusMatch;
      }
    }
    
    return false;
  });

  return (
    <div className="support-dashboard">
      <div className="dashboard-header">
        <h1>{user?.role === "admin" ? "Admin" : "Instructor"} Hỗ trợ</h1>
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Đang xử lý ({chats.filter(chat => 
              chat.status === "pending" && 
              (user.role === "admin" ? chat.supportType === "admin" : 
               (chat.supportType === "instructor" && chat.instructorId && chat.instructorId._id === user._id))
            ).length})
          </button>
          <button 
            className={`filter-btn ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
          >
            Đã hoàn thành ({chats.filter(chat => 
              chat.status === "success" && 
              (user.role === "admin" ? chat.supportType === "admin" : 
               (chat.supportType === "instructor" && chat.instructorId && chat.instructorId._id === user._id))
            ).length})
          </button>
          <button 
            className="refresh-btn"
            onClick={() => fetchChats()}
            disabled={loading}
          >
            <span className="material-symbols-rounded">refresh</span>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="chat-list">
          <h2>Danh sách hỗ trợ</h2>
          
          {loading && filteredChats.length === 0 ? (
            <div className="loading-container">
              <p>Đang tải danh sách hỗ trợ...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="empty-list">
              <span className="material-symbols-rounded">inbox</span>
              <p>Không có yêu cầu hỗ trợ {filter === "pending" ? "đang chờ" : "đã hoàn thành"}</p>
            </div>
          ) : (
            <ul className="chats">
              {filteredChats.map((chat) => (
                <li 
                  key={chat._id} 
                  className={`chat-item ${activeChat && activeChat._id === chat._id ? 'active' : ''}`}
                  onClick={() => setActiveChat(chat)}
                >
                  <div className="chat-item-header">
                    <span className="material-symbols-rounded">
                      {chat.status === "pending" ? "pending" : "check_circle"}
                    </span>
                    <h3>User ID: {chat.userId}</h3>
                    {chat.status === "pending" && !activeChat && (
                      <button 
                        className="accept-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptChat(chat._id);
                        }}
                      >
                        Nhận hỗ trợ
                      </button>
                    )}
                  </div>
                  
                  <div className="chat-item-info">
                    <p className="last-message">
                      {chat.messages.length > 0 
                        ? chat.messages[chat.messages.length - 1].text
                        : "Không có tin nhắn"}
                    </p>
                    <span className="message-count">
                      {chat.messages.length} tin nhắn
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="chat-detail">
          {activeChat ? (
            <>
              <div className="chat-detail-header">
                <h2>Chi tiết hỗ trợ</h2>
                <div className="chat-actions">
                  {activeChat.status === "pending" && (
                    <button 
                      className="complete-btn"
                      onClick={handleMarkComplete}
                      disabled={submitting}
                    >
                      <span className="material-symbols-rounded">check_circle</span>
                      Đánh dấu hoàn thành
                    </button>
                  )}
                </div>
              </div>
              
              <div ref={chatBodyRef} className="chat-messages">
                {activeChat.messages.map((message, index) => (
                  <ChatResponse key={index} message={message} />
                ))}
              </div>
              
              {activeChat.status === "pending" && (
                <form className="response-form" onSubmit={handleSendResponse}>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Nhập phản hồi của bạn..."
                    rows={3}
                    disabled={submitting}
                  ></textarea>
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={submitting || !responseText.trim()}
                  >
                    <span className="material-symbols-rounded">send</span>
                    {submitting ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <span className="material-symbols-rounded">chat</span>
              <p>Chọn một cuộc trò chuyện để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
