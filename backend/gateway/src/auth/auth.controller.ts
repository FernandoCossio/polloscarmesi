import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService, LoginRequest, RegistrarClienteDto } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: LoginRequest) {
    return this.authService.login(credentials);
  }

  @Post('register')
  async register(@Body() userData: RegistrarClienteDto) {
    return this.authService.register(userData);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }
}
