import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Dùng cho LocalStrategy
  // src/auth/auth.service.ts

  async validateUser(email: string, pass: string): Promise<any> {
    
    // --- BẮT ĐẦU DEBUG ---
    console.log("=================================");
    console.log("BẮT ĐẦU KIỂM TRA ĐĂNG NHẬP");
    console.log("Email nhận được:", email);
    console.log("Password nhận được (từ frontend):", pass); // <-- Dòng này quan trọng nhất
    // --- KẾT THÚC DEBUG ---

    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      console.log("Hash trong CSDL:", user.password); // <-- Xem hash
      const isMatch = await bcrypt.compare(pass, user.password);
      console.log("Kết quả so sánh (isMatch):", isMatch); // <-- Xem kết quả
      
      if (isMatch) {
        console.log(">>> ĐĂNG NHẬP THÀNH CÔNG");
        const { password, ...result } = user;
        return result;
      }
    } else {
      console.log("--- LỖI: Không tìm thấy user này.");
    }

    console.log(">>> ĐĂNG NHẬP THẤT BẠI");
    console.log("=================================");
    return null;
  }

  // Dùng cho Login
  async login(user: User) {
    // Chỉ admin mới được login vào trang admin
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Access denied. Only admins can login.');
    }
    
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }
  async getHash(password: string): Promise<string> {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  }
}