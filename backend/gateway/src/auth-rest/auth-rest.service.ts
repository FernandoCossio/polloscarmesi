import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';
import { ApiResponse } from './dto/api-response.dto';

@Injectable()
export class AuthRestService {
  private readonly ms4RestUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const url = this.configService.get<string>('ms4.restUrl');
    if (!url) {
      throw new InternalServerErrorException('MS4_REST_URL is not configured');
    }
    this.ms4RestUrl = url;
  }

  async login(loginRequest: LoginRequestDto): Promise<ApiResponse<TokenResponseDto>> {
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<TokenResponseDto>>(
        `${this.ms4RestUrl}/auth/login`,
        loginRequest,
      ),
    );
    return response.data;
  }

  async register(
    registrarClienteDto: RegistrarClienteDto,
  ): Promise<ApiResponse<ResponseUsuarioDto>> {
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<ResponseUsuarioDto>>(
        `${this.ms4RestUrl}/auth/register`,
        registrarClienteDto,
      ),
    );
    return response.data;
  }
}
