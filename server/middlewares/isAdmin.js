import { User } from "../models/user.model.js";

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Người dùng chưa xác thực",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập trang này, cần quyền admin",
      });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực quyền admin",
    });
  }
};

export default isAdmin;
