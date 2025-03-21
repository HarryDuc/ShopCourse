import { useState, useEffect } from "react";
import { useChat } from "../../context/ChatContext";

const ChatSupportSelector = ({ onClose }) => {
  const { supportOptions, setSupportType, currentChat } = useChat();
  const [selectedType, setSelectedType] = useState("chatbot");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selected type based on current chat support type
  useEffect(() => {
    if (currentChat?.supportType) {
      setSelectedType(currentChat.supportType);

      // If instructor type and courseId exists, set selected course
      if (currentChat.supportType === "instructor" &&
          currentChat.courseId &&
          currentChat.instructorId) {
        const course = supportOptions.find(
          c => c.courseId === currentChat.courseId._id
        );
        if (course) {
          setSelectedCourse(course);
        }
      }
    }
  }, [currentChat, supportOptions]);

  // Handle support type change
  const handleSupportTypeChange = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (selectedType === "chatbot") {
        await setSupportType("chatbot");
      } else if (selectedType === "admin") {
        await setSupportType("admin");
      } else if (selectedType === "instructor" && selectedCourse) {
        await setSupportType(
          "instructor",
          selectedCourse.instructorId,
          selectedCourse.courseId
        );
      } else {
        throw new Error("Vui lòng chọn khóa học nếu bạn muốn hỗ trợ từ giảng viên");
      }

      onClose();
    } catch (error) {
      console.error("Error changing support type:", error);
      alert(error.message || "Có lỗi xảy ra khi thay đổi loại hỗ trợ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-selector">
      <div className="support-header">
        <p className="support-description">
          Hãy chọn loại hỗ trợ phù hợp với nhu cầu của bạn
        </p>
        <button onClick={onClose} className="close-btn">
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div className="support-options">
        <div className="support-option">
          <label className="radio-container">
            <input
              type="radio"
              name="supportType"
              value="chatbot"
              checked={selectedType === "chatbot"}
              onChange={() => setSelectedType("chatbot")}
            />
            <span className="checkmark"></span>
            <div className="option-details">
              <span className="material-symbols-rounded">smart_toy</span>
              <div>
                <h4>Chatbot</h4>
                <p>Trả lời tự động dựa trên thông tin của chúng tôi</p>
              </div>
            </div>
          </label>
        </div>

        <div className="support-option">
          <label className="radio-container">
            <input
              type="radio"
              name="supportType"
              value="admin"
              checked={selectedType === "admin"}
              onChange={() => setSelectedType("admin")}
            />
            <span className="checkmark"></span>
            <div className="option-details">
              <span className="material-symbols-rounded">admin_panel_settings</span>
              <div>
                <h4>Admin</h4>
                <p>Nhận hỗ trợ từ đội ngũ quản trị viên</p>
              </div>
            </div>
          </label>
        </div>

        <div className="support-option">
          <label className="radio-container">
            <input
              type="radio"
              name="supportType"
              value="instructor"
              checked={selectedType === "instructor"}
              onChange={() => setSelectedType("instructor")}
            />
            <span className="checkmark"></span>
            <div className="option-details">
              <span className="material-symbols-rounded">school</span>
              <div>
                <h4>Giảng viên</h4>
                <p>Nhận hỗ trợ từ giảng viên khóa học</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {selectedType === "instructor" && (
        <div className="course-selector">
          <h4>Chọn khóa học</h4>
          {supportOptions.length === 0 ? (
            <p className="no-courses">Bạn chưa mua khóa học nào</p>
          ) : (
            <div className="course-list">
              {supportOptions.map((course) => (
                <div
                  key={course.courseId}
                  className={`course-item ${selectedCourse?.courseId === course.courseId ? 'selected' : ''}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="course-info">
                    <h5>{course.courseTitle}</h5>
                    <p>Giảng viên: {course.instructorName}</p>
                  </div>
                  <span className="material-symbols-rounded select-icon">
                    {selectedCourse?.courseId === course.courseId ? 'check_circle' : 'circle'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedType === "admin" && (
        <div className="support-info-box">
          <span className="material-symbols-rounded">info</span>
          <p>
            Admin sẽ phản hồi bạn trong thời gian sớm nhất. Vui lòng mô tả chi tiết vấn đề của bạn.
          </p>
        </div>
      )}

      <div className="support-actions">
        <button
          className="cancel-btn"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          className="confirm-btn"
          onClick={handleSupportTypeChange}
          disabled={isSubmitting || (selectedType === "instructor" && !selectedCourse)}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
        </button>
      </div>
    </div>
  );
};

export default ChatSupportSelector;
