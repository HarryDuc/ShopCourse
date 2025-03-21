import mongoose from "mongoose";

const bannedWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["profanity", "spam", "hate_speech", "other"],
    default: "other",
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware để cập nhật thời gian
bannedWordSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const BannedWord = mongoose.model("BannedWord", bannedWordSchema);

export default BannedWord;
