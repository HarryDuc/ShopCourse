import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body; // patel214
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};
export const logout = async (_, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "enrolledCourses",
        populate: [
          {
            path: "creator",
            select: "name photoUrl",
          },
          {
            path: "lectures",
          },
        ],
      });

    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    // Log để debug
    console.log("User found:", user._id);
    console.log("Enrolled courses:", user.enrolledCourses);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    // extract public id of the old image from the url is it exists;
    if (user.photoUrl) {
      const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
      deleteMediaFromCloudinary(publicId);
    }

    // upload new photo
    const cloudResponse = await uploadMedia(profilePhoto.path);
    const photoUrl = cloudResponse.secure_url;

    const updatedData = { name, photoUrl };
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Admin Controllers
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách người dùng",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, "-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin người dùng",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "instructor", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Vai trò không hợp lệ",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật vai trò người dùng",
    });
  }
};

export const getInstructorRequests = async (req, res) => {
  try {
    const requests = await User.find(
      { instructorRequest: "pending" },
      "-password"
    );

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách yêu cầu",
    });
  }
};

export const approveInstructorRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        instructorRequest: "approved",
        role: "instructor",
      },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã phê duyệt yêu cầu trở thành instructor",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể phê duyệt yêu cầu",
    });
  }
};

export const rejectInstructorRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { instructorRequest: "rejected" },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã từ chối yêu cầu trở thành instructor",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể từ chối yêu cầu",
    });
  }
};

// Student to Instructor Request
export const requestInstructorRole = async (req, res) => {
  try {
    const userId = req.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "Chỉ học viên mới có thể yêu cầu trở thành giảng viên",
      });
    }

    if (["pending", "approved"].includes(user.instructorRequest)) {
      return res.status(400).json({
        success: false,
        message:
          user.instructorRequest === "pending"
            ? "Yêu cầu của bạn đang chờ phê duyệt"
            : "Yêu cầu của bạn đã được phê duyệt trước đó",
      });
    }

    user.instructorRequest = "pending";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đã gửi yêu cầu trở thành giảng viên",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Không thể gửi yêu cầu",
    });
  }
};
