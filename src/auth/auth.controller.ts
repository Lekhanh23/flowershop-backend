import { Controller, Post, UseGuards, Request, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Use Case: Login
  // Dùng LocalAuthGuard để xác thực email/password
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // req.user được trả về từ LocalStrategy.validate()
    return this.authService.login(req.user as User);
  }
  @Get('hash/:password')
  async getHash(@Param('password') password: string) {
    const hash = await this.authService.getHash(password);
    return {
      password_goc: password,
      hash_da_ma_hoa: hash,
    };
  }
}