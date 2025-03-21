import { createContext, useContext, useState, useEffect } from "react";
import axios from "../config/axios";
import { useSelector } from "react-redux";

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [supportOptions, setSupportOptions] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);

  // Load chat visibility state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("showChatbot");
    if (savedState !== null) {
      setShowChatbot(JSON.parse(savedState));
    }
  }, []);

  // Save chat visibility state to localStorage
  useEffect(() => {
    localStorage.setItem("showChatbot", JSON.stringify(showChatbot));
  }, [showChatbot]);

  // Fetch current chat or create a new one if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentChat();
      getCoursesAndInstructors();
    }
  }, [isAuthenticated]);

  // Get current active chat or create a new one
  const getCurrentChat = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await axios.get("/api/v1/chat/current");
      setCurrentChat(response.data.chat);
    } catch (error) {
      console.error("Error fetching current chat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's purchased courses and instructors for support options
  const getCoursesAndInstructors = async () => {
    if (!isAuthenticated) return;

    try {
      console.log("Fetching courses and instructors for support options");
      const response = await axios.get("/api/v1/chat/courses-instructors");
      console.log("Courses and instructors response:", response.data);

      // Thêm log chi tiết để kiểm tra cấu trúc dữ liệu
      if (response.data.coursesWithInstructors && response.data.coursesWithInstructors.length > 0) {
      }

      setSupportOptions(response.data.coursesWithInstructors || []);
    } catch (error) {
      console.error("Error fetching support options:", error);
    }
  };

  // Send a new message
  const sendMessage = async (message) => {
    if (!currentChat) return;

    try {
      // Optimistically update UI
      const tempMessage = {
        role: "user",
        text: message,
        timestamp: new Date(),
      };

      setCurrentChat(prev => ({
        ...prev,
        messages: [...prev.messages, tempMessage],
      }));

      // If chat is in chatbot mode, add thinking indicator
      if (currentChat.supportType === "chatbot") {
        setCurrentChat(prev => ({
          ...prev,
          messages: [...prev.messages, { role: "model", text: "..." }],
        }));
      }

      // Send to server
      const response = await axios.post("/api/v1/chat/message", {
        chatId: currentChat._id,
        message,
        role: "user"
      });

      // Update with server response
      setCurrentChat(response.data.chat);

      // If chatbot, generate AI response
      if (currentChat.supportType === "chatbot") {
        await generateBotResponse();
      }

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  // Generate chatbot response
  const generateBotResponse = async () => {
    if (!currentChat || currentChat.supportType !== "chatbot") return;

    try {
      // Fetch company info to provide context for AI
      let companyInfo = "";
      try {
        const infoResponse = await axios.get("/api/v1/course/published-courses");
        const courses = infoResponse.data.courses;

        companyInfo = `Trả lời theo ngôn ngữ đang nhắn với bạn.
                        Chúng tôi có các khóa học sau:\n`;

        courses.forEach((course) => {
          companyInfo += `     - <a href="/course-detail/${course._id}">${course.courseTitle}</a>
          <img src=${course.courseThumbnail} alt="${course.courseTitle}" />
          (${course.courseLevel || "Chưa cập nhật"})\n
          Giá: ${(course.coursePrice || 0).toLocaleString("vi-VN")}đ\n     ${course.subTitle || ""}\n\n`;
        });
      } catch (error) {
        console.error("Error fetching company info:", error);
        companyInfo = "Trả lời theo ngôn ngữ đang nhắn với bạn.";
      }

      // Prepare history for AI
      let completeHistory = [];

      // Add company info as context
      if (companyInfo) {
        completeHistory.push({
          role: "model",
          parts: [{ text: companyInfo }]
        });
      }

      // Add user conversation history
      const messagesForAI = currentChat.messages
        .filter(msg => !msg.text.includes("..."))
        .map(({ role, text }) => ({
          role: role === "user" ? "user" : "model",
          parts: [{ text }]
        }));

      completeHistory = [
        ...completeHistory,
        ...messagesForAI
      ];

      // Call AI service
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: completeHistory }),
      };

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyDIpW6uX0c83sEeJlTrrQZcY6TSVfaflC0",
        requestOptions
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate response");
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }

      // Process AI response
      let apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();

      // Convert URLs to clickable links
      apiResponseText = apiResponseText.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Handle absolute paths
      apiResponseText = apiResponseText.replace(
        /(?<!['\"=])(\/[a-zA-Z0-9_\-\/]+)/g,
        '<a href="$1">$1</a>'
      );

      // Add response to chat
      if (!currentChat?._id) {
        throw new Error("Current chat session is invalid");
      }

      await axios.post("/api/v1/chat/message", {
        chatId: currentChat._id,
        message: apiResponseText,
        role: "model"
      });

      // Update chat with response
      await getCurrentChat();

    } catch (error) {
      console.error("Error generating bot response:", error);

      const errorMessage = "Xin lỗi, tôi đang gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";

      // Add error message to chat if possible
      if (currentChat?._id) {
        await axios.post("/api/v1/chat/message", {
          chatId: currentChat._id,
          message: errorMessage,
          role: "model"
        });

        await getCurrentChat();
      }
    }
  };

  // Set support type (admin, instructor, or chatbot)
  const setSupportType = async (supportType, instructorId = null, courseId = null) => {
    if (!currentChat) return;

    try {
      console.log("Sending support request with data:", {
        chatId: currentChat._id,
        supportType,
        instructorId: instructorId,
        courseId: courseId
      });

      const response = await axios.post("/api/v1/chat/support-type", {
        chatId: currentChat._id,
        supportType,
        instructorId,
        courseId
      });

      setCurrentChat(response.data.chat);
      return true;
    } catch (error) {
      console.error("Error setting support type:", error);
      console.error("Error details:", error.response?.data || "No response data");
      return false;
    }
  };

  // Mark a chat as completed (success)
  const markChatSuccess = async () => {
    if (!currentChat) return;

    try {
      const response = await axios.post("/api/v1/chat/success", {
        chatId: currentChat._id
      });

      setCurrentChat(response.data.chat);
      return true;
    } catch (error) {
      console.error("Error marking chat as success:", error);
      return false;
    }
  };

  // Start a new chat session
  const startNewChat = async () => {
    try {
      setLoading(true);

      // First mark the current chat as completed if it exists
      if (currentChat?.status === "pending") {
        await markChatSuccess();
      }

      // Then create a new chat
      const response = await axios.post("/api/v1/chat/new", {});
      setCurrentChat(response.data.chat);

      return true;
    } catch (error) {
      console.error("Error starting new chat:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle chat visibility
  const toggleChatVisibility = () => {
    setShowChatbot(prev => !prev);
  };

  const value = {
    currentChat,
    loading,
    supportOptions,
    showChatbot,
    sendMessage,
    setSupportType,
    markChatSuccess,
    startNewChat,
    toggleChatVisibility,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
