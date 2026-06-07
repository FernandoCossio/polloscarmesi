import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiSwaggerResponse } from '@nestjs/swagger';
import { AuthRestService } from './auth-rest.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import { ApiResponse } from './dto/api-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthRestController {
  constructor(private readonly authRestService: AuthRestService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve un token JWT de acceso',
  })
  @ApiSwaggerResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
  })
  @ApiSwaggerResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<ApiResponse<TokenResponseDto>> {
    return this.authRestService.login(loginRequest);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo cliente',
    description: 'Crea una nueva cuenta de cliente en el sistema',
  })
  @ApiSwaggerResponse({
    status: 201,
    description: 'Cliente registrado exitosamente',
  })
  @ApiSwaggerResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiSwaggerResponse({
    status: 409,
    description: 'El nombre de usuario o correo ya están registrados',
  })
  async register(
    @Body() registrarClienteDto: RegistrarClienteDto,
  ): Promise<ApiResponse<ResponseUsuarioDto>> {
    return this.authRestService.register(registrarClienteDto);
  }
}
