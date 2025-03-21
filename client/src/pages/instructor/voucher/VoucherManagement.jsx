import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVoucherMutation,
  useGetAllVouchersQuery,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
} from "@/features/api/voucherApi";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { toast } from "sonner";
import { Loader2, Trash2, Edit } from "lucide-react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const VoucherManagement = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [input, setInput] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "",
    startDate: "",
    endDate: "",
    courses: [],
  });

  const [editingVoucher, setEditingVoucher] = useState(null);

  // Lấy danh sách khóa học của instructor
  const { data: coursesData, isLoading: isCoursesLoading } =
    useGetCreatorCourseQuery();
  const {
    data: vouchers,
    isLoading: isVouchersLoading,
    refetch,
  } = useGetAllVouchersQuery();
  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] = useDeleteVoucherMutation();
  const courses = useMemo(() => coursesData?.courses || [], [coursesData]);
  const vouchersList = useMemo(() => vouchers?.data || [], [vouchers]);

  useEffect(() => {
    if (!vouchers?.data?.length) {
      refetch?.();
    }
  }, [vouchers]); // Chạy lại khi vouchers thay đổi

  // Kiểm tra quyền instructor
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "instructor") {
    return <Navigate to="/" />;
  }

  // const courses = coursesData?.courses || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoursesChange = (value) => {
    setInput((prev) => {
      if (JSON.stringify(prev.courses) !== JSON.stringify(value)) {
        return { ...prev, courses: value };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Kiểm tra xem có khóa học nào được chọn không
      if (input.courses.length === 0) {
        return toast.error("Vui lòng chọn ít nhất một khóa học");
      }

      if (editingVoucher) {
        await updateVoucher({ id: editingVoucher._id, ...input });
        toast.success("Cập nhật mã giảm giá thành công");
        setEditingVoucher(null);
      } else {
        await createVoucher(input);
        toast.success("Thêm mã giảm giá thành công");
      }
      setInput({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxUses: "",
        startDate: "",
        endDate: "",
        courses: [],
      });
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xử lý mã giảm giá");
    }
  };

  const handleEdit = (voucher) => {
    if (editingVoucher?._id !== voucher._id) {
      setEditingVoucher(voucher);

      setInput((prev) => {
        if (
          prev.code !== voucher.code ||
          prev.discountType !== voucher.discountType
        ) {
          return {
            code: voucher.code,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue.toString(),
            maxUses: voucher.maxUses.toString(),
            startDate: new Date(voucher.startDate).toISOString().split("T")[0],
            endDate: new Date(voucher.endDate).toISOString().split("T")[0],
            courses: voucher.courses.map((course) => course._id),
          };
        }
        return prev;
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
      try {
        await deleteVoucher(id);
        toast.success("Xóa mã giảm giá thành công");
      } catch (error) {
        toast.error("Đã xảy ra lỗi khi xóa mã giảm giá");
      }
    }
  };

  // Hiển thị loading khi đang tải dữ liệu
  const isLoading = isCoursesLoading || isVouchersLoading;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý mã giảm giá</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVoucher ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá mới"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Mã giảm giá</Label>
                <Input
                  id="code"
                  name="code"
                  value={input.code}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: SUMMER2023"
                />
              </div>

              <div>
                <Label htmlFor="discountType">Loại giảm giá</Label>
                <Select
                  name="discountType"
                  value={input.discountType}
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "discountType", value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại giảm giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">
                        Số tiền cố định (VND)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">Giá trị giảm giá</Label>
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  value={input.discountValue}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    input.discountType === "percentage"
                      ? "Ví dụ: 10 (10%)"
                      : "Ví dụ: 50000 (50.000 VND)"
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxUses">Số lần sử dụng tối đa</Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  value={input.maxUses}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: 100"
                />
              </div>

              <div>
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={input.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={input.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="courses">Áp dụng cho khóa học</Label>
                <Select
                  name="courses"
                  value={input.courses}
                  onValueChange={handleCoursesChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseTitle}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="w-full"
              >
                {isCreating || isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingVoucher ? (
                  "Cập nhật"
                ) : (
                  "Thêm mới"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách mã giảm giá</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vouchers?.data?.map((voucher) => (
                <div
                  key={voucher._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{voucher.code}</h3>
                    <p className="text-sm text-gray-500">
                      {voucher.discountType === "percentage"
                        ? `${voucher.discountValue}%`
                        : `${voucher.discountValue.toLocaleString()} VND`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Đã sử dụng: {voucher.currentUses}/{voucher.maxUses}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(voucher)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(voucher._id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoucherManagement;
