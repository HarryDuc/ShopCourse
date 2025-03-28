import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FaReply, FaEdit, FaTrash, FaClock, FaCheck, FaTimes } from "react-icons/fa";
import axiosInstance from "../config/axios";

const Comment = ({ courseId, purchased }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchComments();
  }, [courseId, showPending]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        `/api/v1/comments/course/${courseId}${showPending ? '?showPending=true' : ''}`
      );
      setComments(response.data.data || []);
    } catch (error) {
      toast.error("Không thể tải bình luận");
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/api/v1/comments", {
        content: newComment,
        courseId,
        parentId: replyTo,
        autoModerate: true, // Tự động duyệt nếu không có từ cấm
      });

      if (replyTo) {
        const updatedComments = comments.map((comment) => {
          if (comment._id === replyTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data.data],
            };
          }
          return comment;
        });
        setComments(updatedComments);
      } else {
        setComments([response.data.data, ...comments]);
      }

      setNewComment("");
      setReplyTo(null);
      toast.success("Đã thêm bình luận");
    } catch (error) {
      console.error("Error posting comment:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Không thể thêm bình luận");
    }
  };

  const handleEdit = async (commentId, content) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/comments/${commentId}`,
        {
          content,
        }
      );

      const updatedComments = comments.map((comment) => {
        if (comment._id === commentId) {
          return response.data.data;
        }
        return comment;
      });

      setComments(updatedComments);
      setEditingComment(null);
      toast.success("Đã cập nhật bình luận");
    } catch (error) {
      toast.error("Không thể cập nhật bình luận");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await axiosInstance.delete(`/api/v1/comments/${commentId}`);
      const updatedComments = comments.filter(
        (comment) => comment._id !== commentId
      );
      setComments(updatedComments);
      toast.success("Đã xóa bình luận");
    } catch (error) {
      toast.error("Không thể xóa bình luận");
    }
  };

  const handleModerate = async (commentId, status) => {
    try {
      const response = await axiosInstance.put(
        `/api/v1/comments/${commentId}/moderate`,
        { status }
      );

      const updatedComments = comments.map((comment) => {
        if (comment._id === commentId) {
          return response.data.data;
        }
        return comment;
      });

      setComments(updatedComments);
      toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} bình luận`);
    } catch (error) {
      toast.error("Không thể duyệt bình luận");
    }
  };

  const CommentItem = ({ comment, isReply }) => {
    const [editContent, setEditContent] = useState(comment.content);
    const isEditing = editingComment === comment._id;
    const canModifyComment = user && user._id === comment.userId?._id;
    const isAdmin = user?.role === 'admin';

    const getStatusBadge = () => {
      switch (comment.status) {
        case 'pending':
          return (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
              <FaClock className="mr-1" /> Chờ duyệt
            </span>
          );
        case 'approved':
          return (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              <FaCheck className="mr-1" /> Đã duyệt
            </span>
          );
        case 'rejected':
          return (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
              <FaTimes className="mr-1" /> Đã từ chối
            </span>
          );
        default:
          return null;
      }
    };

    return (
      <div
        className={`flex flex-col ${
          isReply ? "ml-12 mt-2" : "mt-4"
        } bg-white rounded-lg p-4 shadow`}
      >
        <div className="flex items-start space-x-4">
          <img
            src={comment.userId?.photoUrl || "https://github.com/shadcn.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">
                  {comment.userId?.name}
                  <span className="ml-2 text-sm text-gray-500">
                    {comment.userId?.role}
                  </span>
                </h4>
                {getStatusBadge()}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEdit(comment._id, editContent);
                }}
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                  rows="3"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingComment(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="mt-1 text-gray-700">{comment.content}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {!isReply && purchased && comment.status === 'approved' && (
                    <button
                      onClick={() => setReplyTo(comment._id)}
                      className="flex items-center text-sm text-gray-500 hover:text-blue-500"
                    >
                      <FaReply className="mr-1" /> Trả lời
                    </button>
                  )}
                  {canModifyComment && (
                    <>
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="flex items-center text-sm text-gray-500 hover:text-green-500"
                      >
                        <FaEdit className="mr-1" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="flex items-center text-sm text-gray-500 hover:text-red-500"
                      >
                        <FaTrash className="mr-1" /> Xóa
                      </button>
                    </>
                  )}
                  {isAdmin && comment.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleModerate(comment._id, 'approved')}
                        className="flex items-center text-sm text-white bg-green-500 px-2 py-1 rounded hover:bg-green-600"
                      >
                        <FaCheck className="mr-1" /> Duyệt
                      </button>
                      <button
                        onClick={() => handleModerate(comment._id, 'rejected')}
                        className="flex items-center text-sm text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600"
                      >
                        <FaTimes className="mr-1" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {comment.replies &&
          comment.replies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} isReply={true} />
          ))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Bình luận</h3>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowPending(!showPending)}
            className={`px-4 py-2 rounded ${
              showPending
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-500 hover:bg-gray-600'
            } text-white`}
          >
            {showPending ? 'Xem tất cả' : 'Xem bình luận chờ duyệt'}
          </button>
        )}
      </div>

      {user ? (
        purchased ? (
          <form onSubmit={handleSubmit} className="mb-6">
            {replyTo && (
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2">
                <span className="text-sm">Đang trả lời bình luận</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Hủy
                </button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Gửi bình luận
            </button>
          </form>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-700">
              Bạn cần mua khóa học này để có thể bình luận.
            </p>
          </div>
        )
      ) : (
        <p className="text-gray-600 mb-6">Vui lòng đăng nhập để bình luận</p>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <p>Đang tải bình luận...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} isReply={false} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </p>
      )}
    </div>
  );
};

export default Comment;
