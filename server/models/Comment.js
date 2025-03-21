import mongoose from "mongoose";
import BannedWord from "./BannedWord.js";
import SystemSetting from "./SystemSetting.js";


const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  moderatedAt: {
    type: Date,
    default: null,
  },
  bannedWords: [
    {
      word: String,
      category: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Phương thức kiểm tra nội dung có chứa từ cấm không
commentSchema.methods.containsBannedWords = async function () {
  try {
    const content = this.content.toLowerCase();
    const bannedWords = await BannedWord.find();
    const foundBannedWords = bannedWords.filter((bw) =>
      content.includes(bw.word.toLowerCase())
    );

    // Lưu các từ cấm tìm thấy vào comment
    this.bannedWords = foundBannedWords.map((bw) => ({
      word: bw.word,
      category: bw.category,
    }));

    return foundBannedWords.length > 0;
  } catch (error) {
    console.error("Error checking banned words:", error);
    return false;
  }
};

// Phương thức tự động duyệt comment
commentSchema.methods.autoModerate = async function () {
  try {
    // Kiểm tra cài đặt hệ thống
    const setting = await SystemSetting.findOne({ key: "autoApproveEnabled" });
    if (!setting || !setting.value) {
      return false;
    }

    const hasBannedWords = await this.containsBannedWords();
    if (!hasBannedWords) {
      this.status = "approved";
      this.moderatedAt = new Date();
      this.moderatedBy = null; // Đánh dấu là tự động duyệt
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error auto moderating:", error);
    return false;
  }
};

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
