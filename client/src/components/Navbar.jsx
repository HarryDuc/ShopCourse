import { Menu, School } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import DarkMode from "@/DarkMode";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import HeroSearch from "../pages/student/HeroSearch";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoutHandler = async () => {
    try {
      const response = await logoutUser().unwrap();
      toast.success(response?.message || "Đăng xuất thành công.");
      setTimeout(() => {
        navigate("/login", { replace: true });
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "auto";
      document.body.removeAttribute("data-scroll-locked");
    }
  }, [isMenuOpen]);
  return (
    <div className="h-16 dark:bg-[#020817] bg-white border-b dark:border-b-gray-800 border-b-gray-200 fixed top-0 left-0 right-0 duration-300 z-10">
      {/* Desktop */}
      <div className="max-w-7xl mx-auto hidden md:flex justify-between items-center gap-10 h-full">
        <div className="flex items-center gap-2">
          <School size={"30"} />
          <Link to="/">
            <h1 className="hidden md:block font-extrabold text-2xl">
              E-Learning
            </h1>
          </Link>
        </div>
        {/* User icons and dark mode icon  */}
        <>
          <HeroSearch />
        </>
        <div className="flex items-center gap-8">
          {user ? (
            <DropdownMenu onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage
                    src={user?.photoUrl || "https://github.com/shadcn.png"}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                onOpenAutoFocus={(e) => e.preventDefault()} // Ngăn chặn focus tự động vào input (nếu có)
              >
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Link to="my-learning">Khóa học đã mua</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {" "}
                    <Link to="profile">Chỉnh sửa hồ sơ</Link>{" "}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logoutHandler}>
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                {user?.role === "instructor" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/instructor/dashboard">Quản lý khóa học</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/admin">Quản trị hệ thống</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/login", { replace: true });
                  setTimeout(() => {
                    window.location.hash = "login";
                  }, 100);
                }}
              >
                Đăng nhập
              </Button>
              <Button
                onClick={() => {
                  navigate("/login", { replace: true });
                  setTimeout(() => {
                    window.location.hash = "signup";
                  }, 100);
                }}
              >
                Đăng ký
              </Button>
            </div>
          )}
          <DarkMode />
        </div>
      </div>
      {/* Mobile device  */}
      <div className="flex md:hidden items-center justify-between px-4 h-full">
        <Link to="/"><h1 className="font-extrabold text-2xl">E-learning</h1></Link>
        <MobileNavbar user={user} />
      </div>
    </div>
  );
};

export default Navbar;

const MobileNavbar = ({ user }) => {
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoutHandler = async () => {
    try {
      const response = await logoutUser().unwrap();
      toast.success(response?.message || "Đăng xuất thành công.");
      setTimeout(() => {
        navigate("/login", { replace: true });
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "auto";
      document.body.removeAttribute("data-scroll-locked");
    }
  }, [isMenuOpen]);
  return (
    <Sheet onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full hover:bg-gray-200"
          variant="outline"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex flex-row items-center justify-between mt-2">
          <SheetTitle>
            <Link to="/">E-Learning</Link>
          </SheetTitle>
          <DarkMode />
        </SheetHeader>
        <Separator className="mr-2" />

        {user ? (
          <>
            <nav className="flex flex-col space-y-4 mt-4">
              <Link to="/my-learning">Khóa học đã mua</Link>
              <Link to="/profile">Chỉnh sửa hồ sơ</Link>
              <button
                className="text-left text-red-500 hover:text-red-700"
                onClick={logoutHandler}
              >
                Đăng xuất
              </button>
            </nav>

            {user?.role === "instructor" && (
              <SheetFooter className="mt-6">
                <SheetClose asChild>
                  <Button
                    type="submit"
                    onClick={() => navigate("/instructor/dashboard")}
                  >
                    Quản lý khóa học
                  </Button>
                </SheetClose>
              </SheetFooter>
            )}
            {user?.role === "admin" && (
              <SheetFooter className="mt-6">
                <SheetClose asChild>
                  <Button
                    type="submit"
                    onClick={() => navigate("/admin")}
                  >
                    Quản trị hệ thống
                  </Button>
                </SheetClose>
              </SheetFooter>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-6">
            <SheetClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/login", { replace: true });
                  setTimeout(() => {
                    window.location.hash = "login";
                  }, 100);
                }}
              >
                Đăng nhập
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button
                onClick={() => {
                  navigate("/login", { replace: true });
                  setTimeout(() => {
                    window.location.hash = "signup";
                  }, 100);
                }}
              >
                Đăng ký
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
