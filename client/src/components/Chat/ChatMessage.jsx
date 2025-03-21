import React from "react";

const ChatMessage = ({ message }) => {
  // Get appropriate avatar based on message role
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

  // Skip loading indicator messages
  if (message.text === "...") {
    return (
      <div className={`message ${getMessageClass(message.role)} typing`}>
        <div className="message-avatar">
          {getAvatar(message.role)}
        </div>
        <div className="message-bubble">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message ${getMessageClass(message.role)}`}>
      {message.role !== "user" && (
        <div className="message-avatar">
          {getAvatar(message.role)}
        </div>
      )}
      <div className="message-bubble">
        <div
          className="message-text"
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
        {message.timestamp && (
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
