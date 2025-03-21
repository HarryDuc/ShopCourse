import Comment from "../models/Comment.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import BannedWord from "../models/BannedWord.js";
import SystemSetting from "../models/SystemSetting.js";

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { content, courseId, parentId } = req.body;
    const userId = req.id;

    // Kiểm tra xem người dùng đã thanh toán khóa học chưa
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần mua khóa học này để có thể bình luận",
      });
    }

    const comment = new Comment({
      content,
      courseId,
      userId,
      parentId,
    });

    // Kiểm tra cài đặt tự động duyệt từ SystemSetting
    await comment.autoModerate();
    await comment.save();

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận gốc",
        });
      }
      parentComment.replies.push(comment._id);
      await parentComment.save();
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("userId", "name photoUrl role")
      .populate({
        path: "replies",
        populate: {
          path: "userId",
          select: "name photoUrl role",
        },
      });

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all comments for a course
export const getCourseComments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { showPending } = req.query;
    const user = await User.findById(req.id);

    let query = {
      courseId,
      parentId: null,
    };

    // Nếu không phải admin và không yêu cầu xem pending, chỉ hiện approved
    if (user?.role !== "admin" && !showPending) {
      query.status = "approved";
    }

    const comments = await Comment.find(query)
      .populate("userId", "name photoUrl role")
      .populate({
        path: "replies",
        match: user?.role !== "admin" ? { status: "approved" } : {},
        populate: {
          path: "userId",
          select: "name photoUrl role",
        },
      })
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error getting course comments:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa bình luận này",
      });
    }

    comment.content = content;
    comment.updatedAt = Date.now();
    comment.status = "pending"; // Reset status khi edit
    await comment.save();

    const updatedComment = await Comment.findById(id)
      .populate("userId", "name photoUrl role")
      .populate({
        path: "replies",
        populate: {
          path: "userId",
          select: "name photoUrl role",
        },
      });

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const user = await User.findById(userId);

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }

    // Cho phép admin hoặc chủ comment xóa
    if (comment.userId.toString() !== userId && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bình luận này",
      });
    }

    // Remove comment from parent's replies if it's a reply
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, {
        $pull: { replies: comment._id },
      });
    }

    // Delete all replies
    if (comment.replies && comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Đã xóa bình luận thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Moderate a comment (Admin only)
export const moderateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }

    comment.status = status;
    comment.moderatedBy = userId;
    comment.moderatedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(id)
      .populate("userId", "name photoUrl role")
      .populate("moderatedBy", "name")
      .populate({
        path: "replies",
        populate: {
          path: "userId",
          select: "name photoUrl role",
        },
      });

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending comments (Admin only)
export const getPendingComments = async (req, res) => {
  try {
    const comments = await Comment.find({ status: "pending" })
      .populate("userId", "name photoUrl role")
      .populate("courseId", "title")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error getting pending comments:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all comments for admin
export const getAllCommentsForAdmin = async (req, res) => {
  try {
    const { status } = req.query;

    // Tạo query dựa trên filter
    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const comments = await Comment.find(query)
      .populate("userId", "name photoUrl role")
      .populate("courseId", "title")
      .populate("moderatedBy", "name")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Toggle auto approve feature
export const toggleAutoApprove = async (req, res) => {
  try {
    const { enabled } = req.body;

    await SystemSetting.findOneAndUpdate(
      { key: "autoApproveEnabled" },
      { key: "autoApproveEnabled", value: enabled },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Đã ${enabled ? "bật" : "tắt"} chức năng tự động duyệt comment`,
    });
  } catch (error) {
    console.error("Error toggling auto approve:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Không thể thay đổi trạng thái tự động duyệt",
    });
  }
};

// Get auto approve status
export const getAutoApproveStatus = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: "autoApproveEnabled" });
    const enabled = setting ? setting.value : false; // Mặc định là false nếu chưa có cài đặt

    res.status(200).json({
      success: true,
      data: { enabled },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
