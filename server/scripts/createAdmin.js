import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    try {
        // Kết nối database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Đã kết nối với database');

        // Tạo mật khẩu mã hóa
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Tạo tài khoản admin
        const admin = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin',
            photoUrl: '',
        });

        // Kiểm tra xem email đã tồn tại chưa
        const existingAdmin = await User.findOne({ email: admin.email });
        if (existingAdmin) {
            console.log('Email admin đã tồn tại trong hệ thống');
            process.exit(1);
        }

        // Lưu vào database
        await admin.save();
        console.log('Đã tạo tài khoản admin thành công');
        console.log('Email:', admin.email);
        console.log('Mật khẩu: admin123');

    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        // Đóng kết nối
        await mongoose.disconnect();
        console.log('Đã đóng kết nối database');
    }
};

// Chạy script
createAdmin();