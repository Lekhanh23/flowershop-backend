import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { UsersService } from "src/users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { NotificationsService } from "src/notifications/notifications.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService : UsersService,
    private jwtService : JwtService,
    private notifService : NotificationsService,
  ) {}

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
    const user = await this.usersService.findOneByEmail(email);
    if(!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng!");
    }

    await this.notifService.create({
      userId: user.id,
      targetUserId: user.id,
      type: 'login',
      message: 'You have logged in successfully.'
    })

    const payload = {sub: user.id, email: user.email, role: user.role};
    const accessToken = this.jwtService.sign(payload);

    const {password: pw, ...publicUser} = user;
    return {
      access_token: accessToken,
      user: publicUser
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);
    if(existingUser) {
      throw new BadRequestException("Email đã tồn tại!");
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: 'customer'
    })
    
    const {password, ...result} = newUser;
    return result;
  }

  async logout(userId: number){
    await this.notifService.create({
      userId: userId,
      targetUserId: userId,
      type: 'logout',
      message: 'You have logged out.'
    });
    return {message: 'Đăng xuất thành công'};
  }
}