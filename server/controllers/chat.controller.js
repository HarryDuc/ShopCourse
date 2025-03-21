import Chat from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

// Create a new chat session or retrieve the pending one
export const createOrGetChat = async (req, res) => {
  try {
    const userId = req.id;
    const isNewChatRequest = req.method === "POST";
    
    if (isNewChatRequest) {
      // Create a new chat even if there's an existing pending chat
      const chat = await Chat.create({
        userId: userId,
        supportType: "chatbot", // Default to chatbot
        messages: [
          {
            role: "model",
            text: "Tôi có thể giúp gì cho bạn? Hãy chọn loại hỗ trợ bạn muốn nhận.",
            timestamp: new Date(),
          },
        ],
      });
      
      return res.status(201).json({
        success: true,
        chat,
      });
    } else {
      // GET method - Find an existing pending chat for this user
      let chat = await Chat.findOne({ 
        userId: userId, 
        status: "pending" 
      }).populate("instructorId", "name email profilePicture")
        .populate("courseId", "courseTitle");
      
      // If no pending chat exists, create a new one with chatbot as default
      if (!chat) {
        chat = await Chat.create({
          userId: userId,
          supportType: "chatbot",
          messages: [
            {
              role: "model",
              text: "Tôi có thể giúp gì cho bạn? Hãy chọn loại hỗ trợ bạn muốn nhận.",
              timestamp: new Date(),
            },
          ],
        });
      }
      
      return res.status(200).json({
        success: true,
        chat,
      });
    }
  } catch (error) {
    console.error("Error in createOrGetChat:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo hoặc lấy cuộc trò chuyện",
      error: error.message,
    });
  }
};

// Add a message to an existing chat
export const addMessage = async (req, res) => {
  try {
    const { chatId, message, role } = req.body;
    const userId = req.id;
    
    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: "Chat ID và nội dung tin nhắn là bắt buộc",
      });
    }
    
    // Find the chat and verify it belongs to this user
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }
    
    // Check if user is allowed to add message (either as the chat owner or as admin/instructor)
    const user = await User.findById(userId);
    const isAdmin = user.role === "admin";
    
    // Check if user is the instructor for this chat
    let isInstructor = false;
    if (user.role === "instructor") {
      if (chat.instructorId && chat.instructorId.equals(userId)) {
        // Direct instructor assignment
        isInstructor = true;
      } else if (chat.instructorId === null && chat.courseId) {
        // For default instructor cases, check if instructor is the course creator
        const course = await Course.findById(chat.courseId);
        if (course && course.creator && course.creator.equals(userId)) {
          isInstructor = true;
        }
      }
    }
    
    if (!chat.userId.equals(userId) && !isAdmin && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thêm tin nhắn vào cuộc trò chuyện này",
      });
    }
    
    // Add the message
    chat.messages.push({
      role: role || (isAdmin ? "admin" : (isInstructor ? "instructor" : "user")),
      text: message,
      timestamp: new Date(),
    });
    
    await chat.save();
    
    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error in addMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể thêm tin nhắn",
      error: error.message,
    });
  }
};

// Get all chats for admin
export const getAllChats = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);
    
    if (user.role !== "admin" && user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }
    
    let query = {};
    
    // For instructors, only show chats related to their courses
    if (user.role === "instructor") {
      // Get all courses taught by this instructor
      const instructorCourses = await Course.find({ creator: userId }).select('_id');
      const courseIds = instructorCourses.map(course => course._id);
      
      query = { 
        supportType: "instructor",
        $or: [
          { instructorId: userId },
          // Include chats where instructorId is null but courseId matches instructor's courses
          { instructorId: null, courseId: { $in: courseIds } }
        ]
      };
    }
    
    const chats = await Chat.find(query)
      .populate("userId", "name email profilePicture")
      .populate("instructorId", "name email profilePicture")
      .populate("courseId", "courseTitle")
      .sort({ updatedAt: -1 });
    
    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error in getAllChats:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách cuộc trò chuyện",
      error: error.message,
    });
  }
};

// Set support type for chat (admin, instructor, or chatbot)
export const setSupportType = async (req, res) => {
  try {
    const { chatId, supportType, instructorId, courseId } = req.body;
    const userId = req.id;
    
    console.log("Setting support type:", { 
      chatId, supportType, instructorId, courseId, userId 
    });
    
    if (!chatId || !supportType) {
      return res.status(400).json({
        success: false,
        message: "Chat ID và loại hỗ trợ là bắt buộc",
      });
    }
    
    // Find the chat and verify it belongs to this user
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }
    
    if (!chat.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thay đổi loại hỗ trợ cho cuộc trò chuyện này",
      });
    }
    
    // Validate if user has purchased the course if selecting instructor support
    if (supportType === "instructor") {
      if (!instructorId || !courseId) {
        return res.status(400).json({
          success: false,
          message: "ID giảng viên và ID khóa học là bắt buộc khi chọn hỗ trợ từ giảng viên",
        });
      }
      
      // Skip validation for default instructor ID
      if (instructorId !== "default") {
        // Check if user has purchased this course
        const purchase = await CoursePurchase.findOne({ 
          userId: userId, 
          courseId: courseId,
          status: "completed" 
        });
        
        if (!purchase) {
          return res.status(400).json({
            success: false,
            message: "Bạn chưa mua khóa học này hoặc thanh toán chưa hoàn tất",
          });
        }
        
        // Verify instructor teaches this course 
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy khóa học",
          });
        }
        
        if (!course.creator || !course.creator.equals(instructorId)) {
          return res.status(400).json({
            success: false,
            message: "Giảng viên này không dạy khóa học đã chọn",
          });
        }
      }
    }
    
    chat.supportType = supportType;
    
    // Gán instructorId và courseId nếu support type là instructor
    if (supportType === "instructor") {
      // Khi instructorId là "default", lưu nó dưới dạng string thay vì ObjectId
      if (instructorId === "default") {
        // Chỉ lưu courseId khi instructorId là default
        chat.courseId = courseId;
        // Đặt instructorId thành null để tránh lỗi MongoDB
        chat.instructorId = null;
        console.log("Using default instructor ID, setting to null in database");
      } else {
        chat.instructorId = instructorId;
        chat.courseId = courseId;
      }
    } else {
      // Xóa instructorId và courseId nếu support type không phải instructor
      chat.instructorId = undefined;
      chat.courseId = undefined;
    }
    
    // Add system message about support type change
    let systemMessage = "";
    if (supportType === "admin") {
      systemMessage = "Bạn đã chuyển sang hỗ trợ từ quản trị viên. Vui lòng đợi quản trị viên phản hồi.";
    } else if (supportType === "instructor") {
      if (instructorId === "default") {
        const course = await Course.findById(courseId);
        systemMessage = `Bạn đã chuyển sang hỗ trợ từ giảng viên khóa học "${course.courseTitle}". Vui lòng đợi giảng viên phản hồi.`;
      } else {
        const instructor = await User.findById(instructorId);
        const course = await Course.findById(courseId);
        systemMessage = `Bạn đã chuyển sang hỗ trợ từ giảng viên ${instructor.name} của khóa học "${course.courseTitle}". Vui lòng đợi giảng viên phản hồi.`;
      }
    } else {
      systemMessage = "Bạn đã chuyển sang hỗ trợ từ Chatbot. Tôi có thể giúp gì cho bạn?";
    }
    
    chat.messages.push({
      role: "model",
      text: systemMessage,
    });
    
    await chat.save();
    
    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error in setSupportType:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể thay đổi loại hỗ trợ",
      error: error.message,
    });
  }
};

// Set chat status to success (completed)
export const setChatSuccess = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.id;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID là bắt buộc",
      });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }
    
    // Check if user is allowed to change status
    const user = await User.findById(userId);
    const isAdmin = user.role === "admin";
    const isInstructor = user.role === "instructor" && chat.instructorId && chat.instructorId.equals(userId);
    
    // Only the chat owner, admin, or the assigned instructor can mark as success
    if (!chat.userId.equals(userId) && !isAdmin && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thay đổi trạng thái cuộc trò chuyện này",
      });
    }
    
    chat.status = "success";
    
    // Add system message about status change
    chat.messages.push({
      role: "model",
      text: "Yêu cầu hỗ trợ đã được đánh dấu là hoàn thành thành công.",
    });
    
    await chat.save();
    
    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error in setChatSuccess:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể thay đổi trạng thái cuộc trò chuyện",
      error: error.message,
    });
  }
};

// Get user's purchased courses and instructors (for selecting instructor support)
export const getUserCoursesAndInstructors = async (req, res) => {
  try {
    const userId = req.id;
    console.log(`Getting courses and instructors for user ID: ${userId}`);
    
    // Get all completed purchases for this user
    const purchases = await CoursePurchase.find({
      userId: userId,
      status: "completed"  
    }).populate({
      path: "courseId",
      select: "courseTitle creator"
    });
    
    console.log(`Found ${purchases.length} purchases with status "completed" for user ${userId}`);
    
    if (purchases.length === 0) {
      return res.status(200).json({
        success: true,
        coursesWithInstructors: [],
      });
    }
    
    // Get all courses with payment status completed, even if they don't have valid instructor references
    let coursesWithInstructors = [];
    
    // First, get all instructor IDs we need
    const instructorIds = [];
    purchases.forEach(purchase => {
      if (purchase.courseId && purchase.courseId.creator) {
        instructorIds.push(purchase.courseId.creator.toString());
      }
    });
    
    // Get instructor details if we have any
    const instructorMap = {};
    if (instructorIds.length > 0) {
      const instructors = await User.find({
        _id: { $in: instructorIds }
      }).select("name email profilePicture");
      
      console.log(`Retrieved ${instructors.length} instructor details`);
      
      // Create a map of instructor IDs to instructor details for easy lookup
      instructors.forEach(instructor => {
        instructorMap[instructor._id.toString()] = instructor;
      });
    }
    
    // Map all completed purchases to courses, with instructor details if available
    coursesWithInstructors = purchases.map(purchase => {
      // Skip invalid courses
      if (!purchase.courseId) {
        return null;
      }
      
      // Basic course info
      const result = {
        courseId: purchase.courseId._id,
        courseTitle: purchase.courseId.courseTitle || "Khóa học"
      };
      
      // Add instructor info if available
      if (purchase.courseId.creator) {
        const instructorId = purchase.courseId.creator.toString();
        const instructor = instructorMap[instructorId];
        
        if (instructor) {
          result.instructorId = instructor._id;
          result.instructorName = instructor.name || "Giảng viên";
          result.instructorEmail = instructor.email || "";
          result.instructorProfilePicture = instructor.profilePicture || "";
        } else {
          // Use default values if instructor details aren't available
          result.instructorId = "default"; 
          result.instructorName = "Giảng viên";
          result.instructorEmail = "";
          result.instructorProfilePicture = "";
        }
      } else {
        // Use default instructor values if instructorId isn't available
        result.instructorId = "default"; 
        result.instructorName = "Giảng viên";
        result.instructorEmail = "";
        result.instructorProfilePicture = "";
      }
      
      return result;
    }).filter(Boolean); // Remove any null entries
    
    console.log(`Returning ${coursesWithInstructors.length} courses with instructors`);
    
    return res.status(200).json({
      success: true,
      coursesWithInstructors,
    });
  } catch (error) {
    console.error("Error in getUserCoursesAndInstructors:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin khóa học và giảng viên",
      error: error.message,
    });
  }
};

// Get a specific chat by ID
export const getChatById = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.id;
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID là bắt buộc",
      });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId)
      .populate("userId", "name email profilePicture")
      .populate("instructorId", "name email profilePicture")
      .populate("courseId", "courseTitle");
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }
    
    // Check if user is authorized to view this chat
    const user = await User.findById(userId);
    const isAdmin = user.role === "admin";
    
    // Check if user is the instructor for this chat
    let isInstructor = false;
    if (user.role === "instructor") {
      if (chat.instructorId && chat.instructorId._id.equals(userId)) {
        // Direct instructor assignment
        isInstructor = true;
      } else if (chat.instructorId === null && chat.courseId) {
        // For default instructor cases, check if instructor is the course creator
        const course = await Course.findById(chat.courseId);
        if (course && course.creator && course.creator.equals(userId)) {
          isInstructor = true;
        }
      }
    }
    
    const isOwner = chat.userId._id.equals(userId);
    
    if (!isOwner && !isAdmin && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem cuộc trò chuyện này",
      });
    }
    
    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error in getChatById:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin cuộc trò chuyện",
      error: error.message,
    });
  }
};
