import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { UsersService } from "src/users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService : UsersService,
    private jwtService : JwtService,
  ) {}

  //Hàm này được LocalStrategy gọi để kiểm trs user/pass
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if(user && await bcrypt.compare(pass, user.password)) {
      const {password, ...result} = user;
      return result;
    }
    return null;
  }

  async login(loginDto : LoginDto) {
    const {email, password} = loginDto;
    //Tìm user trong database
    const user = await this.usersService.findOneByEmail(email);
    if(!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng!");
    }

    //So sánh mật khẩu đăng nhập và mật khẩu mã hoá trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng!");
    }

    //Tạo JWT Token
    const payload = {sub: user.id, email: user.email, role: user.role};
    const accessToken = this.jwtService.sign(payload);

    //Trả về Token và thông tin User (password)
    const {password: pw, ...publicUser} = user;
    return {
      access_token: accessToken,
      user: publicUser
    }
  }

  async register(registerDto: RegisterDto) {
    //1. Check email
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if(existingUser) {
      throw new BadRequestException("Email đã tồn tại!");
    }
    //2. Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    //3. Create new user
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: 'customer'
    })
    //4. Output
    const {password, ...result} = newUser;
    return result;
  }
}