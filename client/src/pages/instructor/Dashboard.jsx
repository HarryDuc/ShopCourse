import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import React, { useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { data, isSuccess, isError, isLoading, refetch } = useGetPurchasedCoursesQuery(undefined, {
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

  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1 className="text-red-500">Failed to get purchased course</h1>;

  const purchasedCourse = data?.purchasedCourse || [];

  // Tạo dữ liệu cho biểu đồ với định dạng tiền tệ VND
  const courseData = purchasedCourse.reduce((acc, purchase) => {
    const existingCourse = acc.find(item => item.name === purchase.courseId.courseTitle);
    if (existingCourse) {
      existingCourse.totalSales += 1;
      existingCourse.totalRevenue += purchase.amount;
    } else {
      acc.push({
        name: purchase.courseId.courseTitle,
        totalSales: 1,
        totalRevenue: purchase.amount,
        price: purchase.courseId.coursePrice
      });
    }
    return acc;
  }, []);

  // Tính tổng doanh thu từ amount
  const totalRevenue = purchasedCourse.reduce((acc, purchase) => {
    return acc + purchase.amount;
  }, 0);

  const totalSales = purchasedCourse.length;

  // Format số tiền sang định dạng VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Tổng bán</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
          <p className="text-sm text-gray-500 mt-1">Số lượng khóa học đã bán</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Tổng doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng doanh thu từ các khóa học</p>
        </CardContent>
      </Card>

      {/* Course Sales and Revenue Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Thống kê theo khóa học
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên khóa học
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá bán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng bán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseData.map((course, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(course.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.totalSales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(course.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Chưa có dữ liệu bán hàng</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
