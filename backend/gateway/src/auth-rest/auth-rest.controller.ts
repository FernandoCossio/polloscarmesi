import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthRestService } from './auth-rest.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import { ApiResponse } from './dto/api-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';

@Controller('auth')
export class AuthRestController {
  constructor(private readonly authRestService: AuthRestService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<ApiResponse<TokenResponseDto>> {
    return this.authRestService.login(loginRequest);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registrarClienteDto: RegistrarClienteDto,
  ): Promise<ApiResponse<ResponseUsuarioDto>> {
    return this.authRestService.register(registrarClienteDto);
  }
}
