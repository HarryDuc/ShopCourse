import BuyCourseButton from "@/components/BuyCourseButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidateVoucherMutation } from "@/features/api/voucherApi";
import { cn } from "@/lib/utils";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { useLoadUserQuery } from "@/features/api/authApi";
import { BadgeInfo, Loader2, Lock, PlayCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Comment from "@/components/Comment";
import axios from "axios";

const CourseDetail = () => {
  const params = useParams();
  const courseId = params.courseId;
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError, refetch } =
    useGetCourseDetailWithStatusQuery(courseId);
  const { refetch: refetchUser } = useLoadUserQuery();
  const [voucherCode, setVoucherCode] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validateVoucher] = useValidateVoucherMutation();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const isFromPayment = location.search.includes("success=true");
        if (!isFromPayment) return;

        const response = await axios.post(
          `http://localhost:8080/api/v1/purchase/course/${courseId}/payment-success`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          toast.success("Thanh toán thành công!");
          // Chỉ refetch khi cần thiết
          const promises = [refetch(), refetchUser()];
          await Promise.all(promises);

          // Remove success parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          toast.error(
            response.data.message || "Có lỗi xảy ra khi xử lý thanh toán"
          );
        }
      } catch (error) {
        console.error("Error handling payment success:", error);
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra khi xử lý thanh toán"
        );
      }
    };

    handlePaymentSuccess();
  }, [location.search]); // Chỉ phụ thuộc vào location.search

  const handleVoucherValidation = async () => {
    if (!voucherCode) return;
    setIsValidating(true);
    try {
      console.log("Validating voucher:", voucherCode, "for course:", courseId);
      const result = await validateVoucher({
        code: voucherCode,
        courseId,
      }).unwrap();

      console.log("Voucher validation result:", result);
      if (result.success) {
        setDiscountedPrice(result.data.discountedPrice);
        toast.success("Áp dụng mã giảm giá thành công");
      } else {
        toast.error(result.message || "Failed to validate voucher");
        setDiscountedPrice(null);
      }
    } catch (error) {
      console.error("Voucher validation error:", error);
      toast.error(error.data?.message || "Failed to validate voucher");
      setDiscountedPrice(null);
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h>Failed to load course details</h>;

  const { course, purchased } = data;
  console.log(purchased);

  const handleContinueCourse = () => {
    if (purchased) {
      navigate(`/course-progress/${courseId}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#2D2F31] text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-2">
          <h1 className="font-bold text-2xl md:text-3xl">
            {course?.courseTitle}
          </h1>
          <p className="text-base md:text-lg">{course?.subTitle}</p>
          <p>
            Tạo bởi{" "}
            <span className="text-[#C0C4FC] underline italic">
              {course?.creator.name}
            </span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <BadgeInfo size={16} />
            <p>Cập nhật lúc {course?.createdAt.split("T")[0]}</p>
          </div>
          <p>Số học viên: {course?.enrolledStudents.length}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto my-5 px-4 md:px-8 flex flex-col lg:flex-row justify-between gap-10">
        <div className="w-full lg:w-1/2 space-y-5">
          <h1 className="font-bold text-xl md:text-2xl">Mô tả</h1>
          <p
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Nội dụng khóa học</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.lectures.map((lecture, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span>
                    {true ? <PlayCircle size={14} /> : <Lock size={14} />}
                  </span>
                  <p>{lecture.lectureTitle}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="bg-white rounded-lg shadow">
            <Comment courseId={courseId} purchased={purchased} />
          </div>
        </div>
        <div className="w-full lg:w-1/3">
          <Card>
            <CardContent className="p-4 flex flex-col">
              <div className="w-full aspect-video mb-4">
                <ReactPlayer
                  width="100%"
                  height={"100%"}
                  url={course.lectures[0].videoUrl}
                  controls={true}
                />
              </div>
              <h1>{course.courseTitle}</h1>
              <Separator className="my-2" />
              <div className="space-y-2">
                {!purchased && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter voucher code"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={handleVoucherValidation}
                        disabled={isValidating || !voucherCode}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </Button>
                    </div>
                    {discountedPrice !== null && (
                      <div className="text-sm">
                        <p className="text-gray-500 line-through">
                          Giá gốc:{" "}
                          {course.coursePrice.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </p>
                        <p className="text-green-600 font-semibold">
                          Giá sau khi giảm:{" "}
                          {discountedPrice.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <h1 className="text-lg md:text-xl font-semibold">
                  <span>
                    {(discountedPrice || course.coursePrice).toLocaleString(
                      "vi-VN",
                      {
                        style: "currency",
                        currency: "VND",
                      }
                    )}
                  </span>
                </h1>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center p-4">
              {purchased ? (
                <Button onClick={handleContinueCourse} className="w-full">
                  Tiếp tục học
                </Button>
              ) : (
                <BuyCourseButton
                  courseId={courseId}
                  discountedPrice={discountedPrice}
                  voucherCode={discountedPrice ? voucherCode : null}
                />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
