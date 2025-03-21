import { useChat } from "../../context/ChatContext";

const ChatHeader = ({ currentChat, toggleSupportOptions, toggleChatVisibility }) => {
  const { supportOptions } = useChat();

  // Get support type display name
  const getSupportTypeName = () => {
    if (!currentChat) return 'ChatBot';

    switch (currentChat.supportType) {
      case 'admin':
        return 'Admin';
      case 'instructor':
        if (currentChat.courseId && currentChat.instructorId) {
          const course = supportOptions.find(c => c.courseId === currentChat.courseId._id);
          if (course) {
            return `Giảng viên: ${course.instructorName}`;
          }
        }
        return 'Giảng viên';
      case 'chatbot':
      default:
        return 'ChatBot';
    }
  };

  // Get support type icon
  const getSupportTypeIcon = () => {
    if (!currentChat) return 'smart_toy';

    switch (currentChat.supportType) {
      case 'admin':
        return 'admin_panel_settings';
      case 'instructor':
        return 'school';
      case 'chatbot':
      default:
        return 'smart_toy';
    }
  };

  return (
    <div className="chat-header">
      <div className="header-info">
        <span className="material-symbols-rounded">{getSupportTypeIcon()}</span>
        <div>
          <h3>Hỗ trợ</h3>
          <p className="support-type">{getSupportTypeName()}</p>
        </div>
      </div>
      <div className="header-actions">
        <button onClick={toggleSupportOptions} className="support-btn" title="Đổi loại hỗ trợ">
          <span className="material-symbols-rounded">support_agent</span>
        </button>
        <button
          onClick={toggleChatVisibility}
          className="material-symbols-rounded close-btn"
        >
          keyboard_arrow_down
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
