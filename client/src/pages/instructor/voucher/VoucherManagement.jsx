import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVoucherMutation, useGetAllVouchersQuery, useUpdateVoucherMutation, useDeleteVoucherMutation } from "@/features/api/voucherApi";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { toast } from "sonner";
import { Loader2, Trash2, Edit } from "lucide-react";

const VoucherManagement = () => {
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

  const { data: courses } = useGetCreatorCourseQuery();
  const { data: vouchers, isLoading } = useGetAllVouchersQuery();
  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] = useDeleteVoucherMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
      toast.error(error.data?.message || "Đã xảy ra sự cố");
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setInput({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxUses: voucher.maxUses,
      startDate: new Date(voucher.startDate).toISOString().split('T')[0],
      endDate: new Date(voucher.endDate).toISOString().split('T')[0],
      courses: voucher.courses.map(course => course._id),
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này không?")) {
      try {
        await deleteVoucher(id);
        toast.success("Xóa mã giảm giá thành công");
      } catch (error) {
        toast.error(error.data?.message || "Lỗi xóa mã giảm giá");
      }
    }
  };

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingVoucher ? "Sửa mã giảm giá" : "Thêm mã giảm giá mới"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Mã giảm giá</Label>
                <Input
                  id="code"
                  name="code"
                  value={input.code}
                  onChange={handleInputChange}
                  placeholder="Nhập mã giảm giá"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discountType">Kiểu giảm giá</Label>
                <Select
                  value={input.discountType}
                  onValueChange={(value) => setInput(prev => ({ ...prev, discountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kiểu giảm giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Cố định theo số tiền</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  value={input.discountValue}
                  onChange={handleInputChange}
                  placeholder={input.discountType === 'percentage' ? 'Nhập % giảm giá' : 'Nhập số tiền'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="maxUses">Số lần sử dụng</Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  value={input.maxUses}
                  onChange={handleInputChange}
                  placeholder="Nhập số lượng tốt đa sử dụng"
                  required
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

              <div className="col-span-2">
                <Label htmlFor="courses">Khóa học áp dụng</Label>
                <Select
                  value={input.courses.length > 0 ? input.courses[0] : ""}
                  onValueChange={(value) => setInput(prev => ({ ...prev, courses: [value] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {courses?.courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.courseTitle}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVoucher ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá mới"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle> Danh sách mã giảm giá </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers?.data.map((voucher) => (
              <Card key={voucher._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{voucher.code}</h3>
                    <p className="text-sm text-gray-500">
                      {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : `${voucher.discountValue} VND`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(voucher)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(voucher._id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <p>Uses: {voucher.currentUses}/{voucher.maxUses}</p>
                  <p>Valid: {new Date(voucher.startDate).toLocaleDateString()} - {new Date(voucher.endDate).toLocaleDateString()}</p>
                  <p className="text-gray-500">Courses: {voucher.courses.map(c => c.courseTitle).join(', ')}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherManagement;