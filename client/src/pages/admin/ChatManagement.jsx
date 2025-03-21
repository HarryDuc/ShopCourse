import React, { useState, useEffect } from "react";
import axios from "../../config/axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminLayout from "../../components/layouts/AdminLayout";
import { FaSync, FaCheck, FaTimes, FaCircle } from "react-icons/fa";

const ChatManagement = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/chat/all");
      setChats(response.data.chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Không thể tải dữ liệu hội thoại");
    } finally {
      setLoading(false);
    }
  };

  const openChat = (chat) => {
    setSelectedChat(chat);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setMessage("");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    try {
      setSendingMessage(true);
      await axios.post("/api/v1/chat/message", {
        chatId: selectedChat._id,
        message: message.trim(),
        role: "admin"
      });
      
      // Refresh chat data
      const response = await axios.get(`/api/v1/chat/all`);
      setChats(response.data.chats);
      
      // Update selected chat
      const updatedChat = response.data.chats.find(c => c._id === selectedChat._id);
      if (updatedChat) {
        setSelectedChat(updatedChat);
      }
      
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMarkComplete = async (chatId) => {
    try {
      await axios.post("/api/v1/chat/success", { chatId });
      toast.success("Đã đánh dấu hội thoại là hoàn thành");
      
      // Refresh chat data
      fetchChats();
      
      // Update selected chat if it's the one being marked
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(prev => ({ ...prev, status: "success" }));
      }
    } catch (error) {
      console.error("Error marking chat as complete:", error);
      toast.error("Không thể cập nhật trạng thái hội thoại");
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const filteredChats = chats.filter(chat => {
    if (filter === "all") return true;
    if (filter === "pending") return chat.status === "pending";
    if (filter === "completed") return chat.status === "success";
    return true;
  });

  // Sort chats - pending first, then by updatedAt date (newest first)
  const sortedChats = [...filteredChats].sort((a, b) => {
    // First sort by status (pending first)
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    
    // Then sort by date (newest first)
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <AdminLayout>
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý yêu cầu hỗ trợ</h2>
        
        <div className="flex mb-4 space-x-2">
          <div className="flex space-x-1">
            <button 
              className={`px-3 py-2 text-sm rounded-md ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button 
              className={`px-3 py-2 text-sm rounded-md ${filter === "pending" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setFilter("pending")}
            >
              Đang chờ
            </button>
            <button 
              className={`px-3 py-2 text-sm rounded-md ${filter === "completed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              onClick={() => setFilter("completed")}
            >
              Hoàn thành
            </button>
          </div>
          <button 
            className="flex items-center px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={fetchChats}
          >
            <FaSync className="mr-1" /> Làm mới
          </button>
        </div>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex h-[calc(100vh-12rem)] bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-3">Danh sách hội thoại ({sortedChats.length})</h3>
                {sortedChats.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Không có hội thoại nào</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedChats.map((chat) => (
                      <div 
                        key={chat._id} 
                        className={`p-3 rounded-md cursor-pointer transition-colors duration-200 border-l-4 
                          ${selectedChat?._id === chat._id ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-gray-50 border-transparent'}
                          ${chat.status === "pending" ? 'border-l-yellow-500' : 'border-l-green-500'}`}
                        onClick={() => openChat(chat)}
                      >
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">
                            {chat.userId?.name || "Người dùng không xác định"}
                            {chat.supportType === "instructor" && chat.courseId && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                {chat.courseId.courseTitle}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(chat.updatedAt)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {chat.messages.length > 0 ? (
                            <p className="truncate">{chat.messages[chat.messages.length - 1].text.substring(0, 40)}...</p>
                          ) : (
                            <p>Không có tin nhắn</p>
                          )}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${chat.status === "pending" ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {chat.status === "pending" ? "Đang chờ" : "Hoàn thành"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            {chat.supportType === "admin" ? "Admin" : 
                             chat.supportType === "instructor" ? "Giảng viên" : "Chatbot"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-2/3 flex flex-col bg-white">
              {selectedChat ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedChat.userId?.name || "Người dùng không xác định"}
                      </h3>
                      <div className="flex mt-1 space-x-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                          {selectedChat.supportType === "admin" ? "Admin" : 
                           selectedChat.supportType === "instructor" ? "Giảng viên" : "Chatbot"}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${selectedChat.status === "pending" ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {selectedChat.status === "pending" ? "Đang chờ" : "Hoàn thành"}
                        </span>
                        {selectedChat.supportType === "instructor" && selectedChat.courseId && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            {selectedChat.courseId.courseTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={closeChat}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedChat.messages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user" ? "bg-gray-100" : "bg-blue-50"}`}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">
                              {msg.role === "user" ? selectedChat.userId?.name || "Người dùng" : 
                               msg.role === "admin" ? "Admin" : 
                               msg.role === "instructor" ? "Giảng viên" : "Chatbot"}
                            </span>
                            <span className="text-gray-500 ml-4">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedChat.status === "pending" ? (
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="space-y-2">
                        <div className="flex">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tin nhắn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={sendingMessage}
                          />
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
                            disabled={!message.trim() || sendingMessage}
                          >
                            {sendingMessage ? 'Đang gửi...' : 'Gửi'}
                          </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleMarkComplete(selectedChat._id)}
                          className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex justify-center items-center space-x-1"
                        >
                          <FaCheck /> <span>Đánh dấu hoàn thành</span>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-gray-200 text-center text-gray-500">
                      <p>Hội thoại này đã được đánh dấu hoàn thành</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p className="text-lg">Chọn một hội thoại từ danh sách để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ChatManagement;
