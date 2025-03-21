import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import ChatHeader from "./ChatHeader";
import ChatSupportSelector from "./ChatSupportSelector";
import "./style.css";
import { getCompanyInfo } from "./companyInfo";

const Chat = () => {
  const [chatHistory, setChatHistory] = useState([
    {
      hideInChat: true,
      role: "model",
      text: "",
    },
  ]);
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      const info = await getCompanyInfo();
      setChatHistory([
        {
          hideInChat: true,
          role: "model",
          text: info,
        },
      ]);
    };
    fetchCompanyInfo();
  }, []);
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  const {
    currentChat,
    loading,
    showChatbot,
    sendMessage,
    markChatSuccess,
    startNewChat,
    toggleChatVisibility,
  } = useChat();

  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const chatBodyRef = useRef();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [currentChat?.messages]);

  // Show support options automatically for new chats
  useEffect(() => {
    if (currentChat) {
      // Show support options if there's only the welcome message
      if (currentChat.messages.length <= 1) {
        setShowSupportOptions(true);
      }
    }
  }, [currentChat]);

  // Toggle support options panel
  const toggleSupportOptions = () => {
    setShowSupportOptions((prev) => !prev);
  };

  // Handle new chat button click
  const handleNewChat = () => {
    startNewChat();
    // Automatically show support options when starting a new chat
    setTimeout(() => setShowSupportOptions(true), 300);
  };

  // Handle marking chat as complete
  const handleMarkComplete = () => {
    markChatSuccess();
  };

  // Handle send message
  const handleSendMessage = async (message) => {
    await sendMessage(message);
    // Close support options when user sends first message
    setShowSupportOptions(false);
  };
  const generateBotResponse = async (history) => {
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.text !== "..."),
        { role: "model", text, isError },
      ]);
    };

    // Lấy thông tin công ty từ chatHistory (tin nhắn đầu tiên với hideInChat: true)
    const companyInfoMessage = chatHistory.find(
      (msg) => msg.hideInChat === true && msg.role === "model"
    );

    // Tạo history mới bao gồm cả thông tin công ty và lịch sử chat hiện tại
    let completeHistory = [];

    // Thêm thông tin công ty vào đầu lịch sử
    if (companyInfoMessage) {
      completeHistory.push({
        role: "model",
        parts: [{ text: companyInfoMessage.text }],
      });
    }

    // Thêm lịch sử trò chuyện hiện tại
    completeHistory = [
      ...completeHistory,
      ...history.map(({ role, text }) => {
        // Ensure we're using only valid roles for Gemini API
        const validRole = role === "user" ? "user" : "model";
        return { role: validRole, parts: [{ text }] };
      }),
    ];

    try {
      let response;

      if (currentChat?.supportType === "chatbot") {
        const geminiOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: completeHistory }),
        };
        console.log("Sending to Gemini:", JSON.stringify(completeHistory, null, 2));

        response = await fetch(
          "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyDIpW6uX0c83sEeJlTrrQZcY6TSVfaflC0",
          geminiOptions
        );

        const text = await response.text();
        console.log("Gemini API Response:", text);
        const data = JSON.parse(text);

        if (!response.ok)
          throw new Error(data.error.message || "Có gì đó sai sai !!!");

        // Chuyển đổi Markdown thành HTML và xử lý URL
        let apiResponseText = data.candidates[0].content.parts[0].text
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .trim();

        // Chuyển đổi URL thông thường thành thẻ a có thể click
        apiResponseText = apiResponseText.replace(
          /(https?:\/\/[^\s]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        // Xử lý các đường dẫn tuyệt đối (bắt đầu bằng /)
        apiResponseText = apiResponseText.replace(
          /(?<!['"=])(\/[a-zA-Z0-9_\-\/]+)/g,
          '<a href="$1">$1</a>'
        );

        updateHistory(apiResponseText);
      } else {
        // Sử dụng backend API cho admin và instructor support
        const backendOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: history[history.length - 1].text,
            supportType: currentChat.supportType,
            courseId: currentChat.courseId?._id,
            instructorId: currentChat.instructorId,
          }),
        };
        console.log("Lich su chat cua Gemini", history[history.length - 1])

        response = await fetch("/api/v1/chat/new", backendOptions);
        const data = await response.json();

        if (!response.ok)
          throw new Error(data.message || "Có lỗi khi gửi tin nhắn");

        // Cập nhật lịch sử chat với phản hồi từ backend
        updateHistory(
          data.message || "Tin nhắn của bạn đã được gửi và đang chờ phản hồi."
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      updateHistory(error.message, true);
    }
  };

  return (
    <div className={`chat-container ${showChatbot ? "show-chatbot" : ""}`}>
      <button onClick={toggleChatVisibility} className="chat-toggler">
        <span className="material-symbols-rounded">mode_comment</span>
        <span className="material-symbols-rounded">close</span>
      </button>

      <div className="chat-popup">
        <ChatHeader
          currentChat={currentChat}
          toggleSupportOptions={toggleSupportOptions}
          toggleChatVisibility={toggleChatVisibility}
        />

        {showSupportOptions && (
          <ChatSupportSelector onClose={() => setShowSupportOptions(false)} />
        )}

        <div ref={chatBodyRef} className="chat-body">
          {loading ? (
            <div className="chat-loading">
              <p>Đang tải...</p>
            </div>
          ) : (
            <>
              {currentChat?.messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
            </>
          )}
        </div>

        <div className="chat-footer">
          {currentChat?.status === "pending" ? (
            <ChatForm sendMessage={handleSendMessage} />
          ) : (
            <div className="chat-completed-message">
              <p>Cuộc hội thoại đã kết thúc</p>
              <button onClick={handleNewChat} className="new-chat-btn">
                Bắt đầu cuộc hội thoại mới
              </button>
            </div>
          )}

          <div className="chat-actions">
            {currentChat?.status === "pending" && (
              <>
                <button onClick={handleNewChat} className="action-btn">
                  <span className="material-symbols-rounded">add</span>
                  <span className="size">Chat mới</span>
                </button>
                <button onClick={toggleSupportOptions} className="action-btn">
                  <span className="material-symbols-rounded">
                    support_agent
                  </span>
                  <span className="size">Đổi loại hỗ trợ</span>
                </button>
                <button onClick={handleMarkComplete} className="action-btn">
                  <span className="material-symbols-rounded">check</span>
                  <span className="size">Hoàn thành</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
