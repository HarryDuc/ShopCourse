import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "admin", "instructor", "model"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supportType: {
      type: String,
      enum: ["admin", "instructor", "chatbot"],
      default: "chatbot",
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Only required if supportType is instructor
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      // Only required if supportType is instructor
    },
    status: {
      type: String,
      enum: ["pending", "success"],
      default: "pending",
    },
    messages: [messageSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before save
chatSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Chat", chatSchema);
