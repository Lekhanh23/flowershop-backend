import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GetUser } from "./decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  //API Đăng nhập
  @Post('login')
  @ApiOperation({summary: 'Đăng nhập'})
  @ApiResponse({status: 201, description: 'Trả về Access Token và thông tin User'})
  @ApiResponse({status: 400, description: 'Sai email hoặc mật khẩu'})
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  //API lấy thông tin User hiện tại (Dựa trên token)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({summary: 'Lấy thông tin User'})
  getProfile(@GetUser() user: User) {
    return user;
  }

  //API Đăng xuất
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  //API Register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({summary: 'Đăng ký tài khoản mới'})
  @ApiResponse({status: 201, description: 'Đăng ký thành công'})
  @ApiResponse({status: 400, description: 'Email đã tồn tại'})
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}