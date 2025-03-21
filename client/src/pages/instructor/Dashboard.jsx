import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import React, { useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Kiểm tra quyền instructor
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "instructor") {
    return <Navigate to="/" />;
  }

  const { data, isSuccess, isError, isLoading, refetch } =
    useGetPurchasedCoursesQuery(undefined, {
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });

  useEffect(() => {
    // Refetch khi component mount
    refetch();

    // Thiết lập interval để refetch
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    // Cleanup interval
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (isError)
    return (
      <div className="text-red-500 p-6">
        Không thể tải dữ liệu khóa học đã mua
      </div>
    );

  const purchasedCourse = data?.purchasedCourse || [];

  // Chỉ lấy khóa học của instructor đang đăng nhập
  const instructorPurchases = purchasedCourse.filter(
    (purchase) =>
      purchase.courseId.creator && purchase.courseId.creator._id === user._id
  );

  // Tạo dữ liệu cho biểu đồ với định dạng tiền tệ VND
  const courseData = instructorPurchases.reduce((acc, purchase) => {
    const existingCourse = acc.find(
      (item) => item.name === purchase.courseId.courseTitle
    );
    if (existingCourse) {
      existingCourse.totalSales += 1;
      existingCourse.totalRevenue += purchase.amount;
    } else {
      acc.push({
        name: purchase.courseId.courseTitle,
        totalSales: 1,
        totalRevenue: purchase.amount,
        price: purchase.courseId.coursePrice,
      });
    }
    return acc;
  }, []);

  // Tính tổng doanh thu từ amount
  const totalRevenue = instructorPurchases.reduce(
    (acc, purchase) => acc + purchase.amount,
    0
  );

  // Tính tổng số lượng bán
  const totalSales = instructorPurchases.length;

  // Định dạng tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bảng điều khiển</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng khóa học bán ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số lượng khóa học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseData.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Doanh thu theo khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          {courseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          {courseData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tên khóa học</th>
                    <th className="text-right py-2">Giá bán</th>
                    <th className="text-right py-2">Số lượng bán</th>
                    <th className="text-right py-2">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {courseData.map((course, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{course.name}</td>
                      <td className="text-right py-2">
                        {formatCurrency(course.price)}
                      </td>
                      <td className="text-right py-2">{course.totalSales}</td>
                      <td className="text-right py-2">
                        {formatCurrency(course.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Chưa có dữ liệu bán hàng
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
