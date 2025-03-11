import React from "react";
import Course from "./Course";
import { useLoadUserQuery } from "@/features/api/authApi";

const MyLearning = () => {

  const { data, isLoading, refetch } = useLoadUserQuery();

  if (isLoading) return <h1>Đang tải các khóa học của bạn...</h1>;

  const user = data && data.user;

  return (
    <div className="max-w-4xl mx-auto px-4 my-10">
      <div>
        <h1 className="font-medium text-lg">KHÓA HỌC CỦA TÔI</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-5">
          {user.enrolledCourses.length === 0 ? (
            <h1>Bạn vẫn chưa đăng ký</h1>
          ) : (
            user.enrolledCourses.map((course) => (
              <Course course={course} key={course._id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;
