import { useState, useRef, useEffect } from "react";

const ChatResponse = ({ chat, onSendResponse, onMarkComplete, userRole }) => {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom whenever chat messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || sending) return;
    
    try {
      setSending(true);
      const success = await onSendResponse(replyText);
      
      if (success) {
        setReplyText("");
      }
    } catch (error) {
      console.error("Error sending response:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get message class based on role
  const getMessageClass = (role) => {
    switch (role) {
      case "user":
        return "user-message";
      case "admin":
        return "admin-message";
      case "instructor":
        return "instructor-message";
      case "model":
        return "bot-message";
      default:
        return "system-message";
    }
  };

  // Get avatar based on role
  const getAvatar = (role) => {
    switch (role) {
      case "admin":
        return <span className="material-symbols-rounded">admin_panel_settings</span>;
      case "instructor":
        return <span className="material-symbols-rounded">school</span>;
      case "model":
        return <span className="material-symbols-rounded">smart_toy</span>;
      default:
        return <span className="material-symbols-rounded">person</span>;
    }
  };

  // Determine if current user can respond to this chat
  const canRespond = () => {
    // Always allow admin to respond
    if (userRole === "admin") return true;
    
    // For instructors, check if this is their course
    if (userRole === "instructor" && chat.supportType === "instructor") {
      return true;
    }
    
    return false;
  };

  if (!chat) return null;

  return (
    <div className="chat-response">
      <div className="chat-response-header">
        <div className="user-info">
          <div className="user-avatar">
            {chat.userId.profilePicture ? (
              <img src={chat.userId.profilePicture} alt={chat.userId.name} />
            ) : (
              <span className="material-symbols-rounded">person</span>
            )}
          </div>
          <div className="user-details">
            <h3>{chat.userId.name}</h3>
            <p className="user-email">{chat.userId.email}</p>
            {chat.supportType === "instructor" && chat.courseId && (
              <p className="course-info">
                <span className="material-symbols-rounded">school</span>
                Khóa học: {chat.courseId.courseTitle}
              </p>
            )}
          </div>
        </div>
        <div className="chat-actions">
          <button 
            className="refresh-btn" 
            onClick={() => window.location.reload()}
            title="Làm mới"
          >
            <span className="material-symbols-rounded">refresh</span>
          </button>
          {chat.status === "pending" && canRespond() && (
            <button 
              className="complete-btn" 
              onClick={onMarkComplete}
              title="Đánh dấu hoàn thành"
            >
              <span className="material-symbols-rounded">check_circle</span>
              <span>Hoàn thành</span>
            </button>
          )}
        </div>
      </div>

      <div className="chat-response-body" ref={chatBodyRef}>
        {chat.messages.map((message, index) => (
          <div 
            key={index} 
            className={`message-item ${getMessageClass(message.role)}`}
          >
            <div className="message-avatar">
              {getAvatar(message.role)}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.text}
              </div>
              <div className="message-info">
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {chat.status === "pending" && canRespond() ? (
        <div className="chat-response-footer">
          <form onSubmit={handleSubmit}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập phản hồi của bạn..."
              rows={3}
              disabled={sending || chat.status !== "pending"}
            />
            <div className="form-actions">
              <button 
                type="submit" 
                className="send-btn"
                disabled={sending || !replyText.trim() || chat.status !== "pending"}
              >
                <span className="material-symbols-rounded">send</span>
                <span>{sending ? "Đang gửi..." : "Gửi"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : chat.status !== "pending" ? (
        <div className="chat-completed-notice">
          <p>Cuộc hội thoại này đã được đánh dấu là hoàn thành.</p>
        </div>
      ) : (
        <div className="chat-response-restricted">
          <p>Bạn không có quyền phản hồi cuộc hội thoại này.</p>
        </div>
      )}
    </div>
  );
};

export default ChatResponse;
