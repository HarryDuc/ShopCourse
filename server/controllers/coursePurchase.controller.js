import Stripe from "stripe";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId, discountedPrice, voucherCode } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    // Determine the final price (original or discounted)
    const finalPrice = discountedPrice || course.coursePrice;

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: course.courseTitle,
              images: [course.courseThumbnail],
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/course-detail/${courseId}?success=true`,
      cancel_url: `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/course-detail/${courseId}`,
      metadata: {
        courseId: courseId,
        userId: userId,
      },
    });

    if (!session.url) {
      return res.status(400).json({
        success: false,
        message: "Error while creating session",
      });
    }

    // Create a new course purchase record with paymentId
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: finalPrice,
      status: "pending",
      paymentId: session.id,
      voucherCode: voucherCode || null,
    });

    // Cập nhật metadata với purchaseId
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        courseId: courseId,
        userId: userId,
        purchaseId: newPurchase._id.toString(),
      },
    });

    // Save the purchase record
    await newPurchase.save();
    console.log("Created purchase record:", newPurchase);

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
    });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.WEBHOOK_ENDPOINT_SECRET;

  console.log("Received webhook request");
  console.log("Request body:", req.body);
  console.log("Stripe signature:", sig);
  console.log("Webhook secret:", webhookSecret);

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("Event constructed successfully:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await handleSuccessfulPayment(session);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Hàm xử lý thanh toán thành công
const handleSuccessfulPayment = async (session) => {
  console.log("Processing completed checkout session:", session.id);
  console.log("Session metadata:", session.metadata);

  const { courseId, userId, purchaseId } = session.metadata;

  // 1. Update purchase status
  const purchase = await CoursePurchase.findByIdAndUpdate(
    purchaseId,
    {
      status: "completed",
      paymentId: session.id,
    },
    { new: true }
  );

  if (!purchase) {
    throw new Error(`Purchase not found: ${purchaseId}`);
  }
  console.log("Updated purchase:", purchase);

  // 2. Update user's enrolledCourses
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { enrolledCourses: courseId } },
    { new: true }
  ).populate({
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

  if (!updatedUser) {
    throw new Error(`User not found: ${userId}`);
  }
  console.log("Updated user enrolled courses:", updatedUser.enrolledCourses);

  // 3. Update course's enrolledStudents
  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    { $addToSet: { enrolledStudents: userId } },
    { new: true }
  );

  if (!updatedCourse) {
    throw new Error(`Course not found: ${courseId}`);
  }
  console.log(
    "Updated course enrolled students:",
    updatedCourse.enrolledStudents
  );

  // 4. Create course progress if not exists
  const existingProgress = await CourseProgress.findOne({ userId, courseId });
  if (!existingProgress) {
    const courseProgress = await CourseProgress.create({
      userId,
      courseId,
      completed: false,
      lectureProgress: [],
    });
    console.log("Created course progress:", courseProgress);
  }

  return { purchase, updatedUser, updatedCourse };
};

// Endpoint để cập nhật trạng thái thanh toán thủ công khi redirect về
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Tìm purchase record gần nhất của user cho khóa học này
    const purchase = await CoursePurchase.findOne({
      courseId,
      userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!purchase) {
      // Kiểm tra xem đã thanh toán trước đó chưa
      const completedPurchase = await CoursePurchase.findOne({
        courseId,
        userId,
        status: "completed",
      });

      if (completedPurchase) {
        return res.status(200).json({
          success: true,
          message: "Khóa học đã được thanh toán trước đó",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi thanh toán",
      });
    }

    try {
      // Kiểm tra trạng thái thanh toán với Stripe
      const session = await stripe.checkout.sessions.retrieve(
        purchase.paymentId
      );

      if (session.payment_status === "paid" && session.status === "complete") {
        // Xử lý thanh toán thành công
        await handleSuccessfulPayment({
          ...session,
          metadata: {
            courseId,
            userId,
            purchaseId: purchase._id.toString(),
          },
        });

        return res.status(200).json({
          success: true,
          message: "Thanh toán thành công",
        });
      } else {
        console.log(
          "Thanh toán chưa hoàn tất. Trạng thái:",
          session.payment_status,
          session.status
        );
        return res.status(400).json({
          success: false,
          message: "Thanh toán chưa hoàn tất",
          paymentStatus: session.payment_status,
          sessionStatus: session.status,
        });
      }
    } catch (stripeError) {
      console.error("Lỗi khi kiểm tra phiên thanh toán Stripe:", stripeError);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra trạng thái thanh toán",
        error: stripeError.message,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý thanh toán thành công:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể xử lý thanh toán",
      error: error.message,
    });
  }
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    const purchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });
    console.log(purchased);

    if (!course) {
      return res.status(404).json({ message: "course not found!" });
    }

    return res.status(200).json({
      course,
      purchased: !!purchased,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const userId = req.id;

    // Tìm tất cả các purchase đã completed
    const purchasedCourses = await CoursePurchase.find({
      status: "completed",
    }).populate({
      path: "courseId",
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

    console.log("Found purchased courses:", purchasedCourses);

    if (!purchasedCourses || purchasedCourses.length === 0) {
      return res.status(200).json({
        success: true,
        purchasedCourse: [],
      });
    }

    // Trả về toàn bộ thông tin purchase bao gồm cả amount và courseId
    return res.status(200).json({
      success: true,
      purchasedCourse: purchasedCourses,
    });
  } catch (error) {
    console.error("Error getting purchased courses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get purchased courses",
    });
  }
};
