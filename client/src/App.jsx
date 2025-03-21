import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import HeroSection from "./pages/student/HeroSection";
import MainLayout from "./layout/MainLayout";
import Courses from "./pages/student/Courses";
import MyLearning from "./pages/student/MyLearning";
import Profile from "./pages/student/Profile";
import Sidebar from "./pages/instructor/Sidebar";
import Dashboard from "./pages/instructor/Dashboard";
import CourseTable from "./pages/instructor/course/CourseTable";
import AddCourse from "./pages/instructor/course/AddCourse";
import EditCourse from "./pages/instructor/course/EditCourse";
import CreateLecture from "./pages/instructor/lecture/CreateLecture";
import EditLecture from "./pages/instructor/lecture/EditLecture";
import CourseDetail from "./pages/student/CourseDetail";
import CourseProgress from "./pages/student/CourseProgress";
import SearchPage from "./pages/student/SearchPage";
import { Toaster } from "react-hot-toast";
import {
  InstructorRoute,
  AuthenticatedUser,
  ProtectedRoute,
} from "./components/ProtectedRoutes";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import LearningUI from "./pages/home";
import Footer from "./pages/footer";
import PromoSection from "./pages/student/slide";
import VoucherManagement from "./pages/instructor/voucher/VoucherManagement";
import Chat from "./components/Chat/Chat";
import SupportChatDetail from "./pages/instructor/support/SupportChatDetail";
// Admin imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import InstructorRequests from "./pages/admin/InstructorRequests";
import CommentManagement from "./pages/admin/CommentManagement";
import { useSelector } from "react-redux";
import BannedWordManagement from "./pages/admin/BannedWordManagement";
import ChatManagement from "./pages/admin/ChatManagement";
import ManageSupport from "./pages/instructor/support/ManageSupport";

// Admin Route Component
const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute>
      <AdminOnlyRoute>{children}</AdminOnlyRoute>
    </ProtectedRoute>
  );
};

// Admin Only Route Component
const AdminOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
};

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: (
          <>
            <PromoSection />
            {/* <HeroSection /> */}
            <Courses />
            <LearningUI />
            <Chat />
            <Footer />
          </>
        ),
      },
      {
        path: "login",
        element: (
          <AuthenticatedUser>
            <Login />
          </AuthenticatedUser>
        ),
      },
      {
        path: "my-learning",
        element: (
          <ProtectedRoute>
            <MyLearning />
            <Chat />
            <Footer />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
            <Chat />
            <Footer />
          </ProtectedRoute>
        ),
      },
      {
        path: "course/search",
        element: (
          <ProtectedRoute>
            <SearchPage />
            <Chat />
            <Footer />
          </ProtectedRoute>
        ),
      },
      {
        path: "course-detail/:courseId",
        element: (
          <ProtectedRoute>
            <CourseDetail />
            <Chat />
            <Footer />
          </ProtectedRoute>
        ),
      },
      {
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
            <Chat />
            <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
        ),
      },

      {
        path: "instructor",
        element: (
          <InstructorRoute>
            <Sidebar />
            <Chat />
          </InstructorRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "course",
            element: <CourseTable />,
          },
          {
            path: "course/create",
            element: <AddCourse />,
          },
          {
            path: "course/:courseId",
            element: <EditCourse />,
          },
          {
            path: "course/:courseId/lecture",
            element: <CreateLecture />,
          },
          {
            path: "course/:courseId/lecture/:lectureId",
            element: <EditLecture />,
          },
          {
            path: "vouchers",
            element: <VoucherManagement />,
          },
          {
            path: "support",
            element: <ManageSupport />,
          },
          {
            path: "support/chat/:chatId",
            element: <SupportChatDetail />,
          },
        ],
      },
      // Admin Routes
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Chat />
            <AdminDashboard />
          </AdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <Chat />
            <UserManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/instructor-requests",
        element: (
          <AdminRoute>
            <Chat />
            <InstructorRequests />
          </AdminRoute>
        ),
      },
      {
        path: "admin/comments",
        element: (
          <AdminRoute>
            <Chat />
            <CommentManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/chats",
        element: (
          <AdminRoute>
            <Chat />
            <ChatManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/banned-words",
        element: (
          <AdminRoute>
            <Chat />
            <BannedWordManagement />
          </AdminRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <main>
      <ThemeProvider>
        <RouterProvider router={appRouter} />
        <Toaster position="top-right" />
      </ThemeProvider>
    </main>
  );
}

export default App;
