import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { Edit, Plus } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const CourseTable = () => {
  const { data, isLoading } = useGetCreatorCourseQuery();
  const navigate = useNavigate();

  if (isLoading) return <h1>Đang tải...</h1>;

  return (
    <div>
      <Button onClick={() => navigate(`create`)}>Thêm khóa học mới</Button>
      <Table>
        <TableCaption>Danh sách các khóa học gần đây của bạn.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Giá</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead className="text-center">Bài giảng</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.courses.map((course) => (
            <TableRow key={course._id}>
              <TableCell className="font-medium">
                {course?.coursePrice || "NA"}
              </TableCell>
              <TableCell>
                <Badge>{course.isPublished ? "Published" : "Draft"}</Badge>
              </TableCell>
              <TableCell>{course.courseTitle}</TableCell>
              <TableCell className="text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`${course._id}/lecture`)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm bài giảng
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`${course._id}`)}
                >
                  <Edit />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseTable;
