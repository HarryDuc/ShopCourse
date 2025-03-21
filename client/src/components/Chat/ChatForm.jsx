import { useRef, useState } from "react";

const ChatForm = ({ sendMessage }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = inputRef.current.value.trim();
    if (!message || isSubmitting) return;

    setIsSubmitting(true);
    inputRef.current.value = "";

    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="chat-form">
      <input
        ref={inputRef}
        type="text"
        placeholder="Nhập tin nhắn của bạn..."
        className="message-input"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        className="send-button"
        disabled={isSubmitting}
      >
        <span className="material-symbols-rounded">
          {isSubmitting ? "hourglass_empty" : "send"}
        </span>
      </button>
    </form>
  );
};

export default ChatForm;
