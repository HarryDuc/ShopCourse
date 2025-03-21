import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "student",
    },
    instructorRequest: {
      type: String,
      enum: ["pending", "approved", "rejected", "none"],
      default: "none",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    photoUrl: {
      type: String,
      default: "https://github.com/shadcn.png",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
