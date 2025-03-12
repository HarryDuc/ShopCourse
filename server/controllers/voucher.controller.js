import { Voucher } from "../models/voucher.model.js";
import { Course } from "../models/course.model.js";

// Create a new voucher
export const createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      startDate,
      endDate,
      courses,
    } = req.body;
    const createdBy = req.id;

    const voucher = await Voucher.create({
      code,
      discountType,
      discountValue,
      maxUses,
      startDate,
      endDate,
      courses,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      data: voucher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all vouchers
export const getAllVouchers = async (req, res) => {
  try {
    const instructorId = req.id;

    // Chỉ lấy voucher của instructor đã đăng nhập
    const vouchers = await Voucher.find({ createdBy: instructorId })
      .populate("courses", "courseTitle")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a voucher
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const voucher = await Voucher.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Validate and apply voucher
export const validateVoucher = async (req, res) => {
  try {
    const { code, courseId } = req.body;

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      courses: courseId,
    });

    // Check if voucher exists and hasn't exceeded max uses
    if (voucher && voucher.currentUses >= voucher.maxUses) {
      return res.status(404).json({
        success: false,
        message: "Voucher has reached maximum usage limit",
      });
    }

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired voucher code",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let discountedPrice;
    if (voucher.discountType === "percentage") {
      discountedPrice = course.coursePrice * (1 - voucher.discountValue / 100);
    } else {
      discountedPrice = Math.max(0, course.coursePrice - voucher.discountValue);
    }

    res.status(200).json({
      success: true,
      data: {
        voucher,
        originalPrice: course.coursePrice,
        discountedPrice: Math.round(discountedPrice),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
