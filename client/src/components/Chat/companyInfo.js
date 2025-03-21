import axios from "../../config/axios";

export const getCompanyInfo = async () => {
  try {
    // Fetch published courses
    const coursesResponse = await axios.get("/api/v1/course/published-courses");
    const courses = coursesResponse.data.courses;

    // Fetch user's purchased courses and progress if logged in
    let purchasedCourses = [];
    let courseProgress = [];
    try {
      const purchaseResponse = await axios.get("/api/v1/purchase");
      purchasedCourses = purchaseResponse.data.purchases || [];

      // Get progress for purchased courses
      const progressPromises = purchasedCourses.map((purchase) =>
        axios.get(`/api/v1/progress/${purchase.courseId}`)
      );
      const progressResponses = await Promise.allSettled(progressPromises);
      courseProgress = progressResponses
        .filter((response) => response.status === "fulfilled")
        .map((response) => response.value.data);
    } catch (error) {
      console.log("User not logged in or no purchases");
    }

    let courseInfo = `Trả lời theo ngôn ngữ đang nhắn với bạn.
                              Chúng tôi có các khóa học sau:\n`;

    courses.forEach((course) => {
      // Check if user has purchased this course
      const purchased = purchasedCourses.find((p) => p.courseId === course._id);
      const progress = courseProgress.find((p) => p.courseId === course._id);
      courseInfo += `Chỉ trả lời đúng yêu cầu của câu hỏi
      Trả lời thông tin câu hỏi trên dữ liệu được gửi lên cho bạn
Ví dụ: Có bao nhiêu khóa học
Trả lời: Sô lượng khóa học trong hệ thống là 1000 khóa học`
      courseInfo += `     - <a href="/course-detail/${course._id}">${
        course.courseTitle
      }</a>
      <img src=${course.courseThumbnail} alt="${course.courseTitle}" />
      (${course.courseLevel || "Chưa cập nhật"})\n
      Giá: ${(course.coursePrice || 0).toLocaleString("vi-VN")}đ\n
      ${course.subTitle || ""}\n
      ${
        purchased
          ? `Bạn đã mua khóa học này${
              progress
                ? `, tiến độ hoàn thành: ${progress.completedLectures}/${progress.totalLectures} bài học`
                : ""
            }`
          : ""
      }\n\n`;
    });

    return courseInfo;
  } catch (error) {
    console.error("Error fetching course info:", error);
    return `
Trả lời theo ngôn ngữ đang nhắn với bạn.
Chỉ trả lời đúng yêu cầu của câu hỏi
Ví dụ: Có bao nhiêu khóa học
Trả lời: Sô lượng khóa học trong hệ thống là 1000 khóa học
Hiện tại hệ thống đang gặp sự cố, vui lòng thử lại sau.
`;
  }
};
