import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

  private handleAxiosError(error: any): never {
    if (error.response) {
      throw new HttpException(
        error.response.data,
        error.response.status,
      );
    } else if (error.request) {
      throw new InternalServerErrorException('No se recibió respuesta del servicio de autenticación');
    } else {
      throw new InternalServerErrorException(error.message);
    }
  }

  async login(loginRequest: LoginRequestDto): Promise<ApiResponse<TokenResponseDto>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<TokenResponseDto>>(
          `${this.ms4RestUrl}/auth/login`,
          loginRequest,
        ),
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<TokenResponseDto>>(
          `${this.ms4RestUrl}/auth/login`,
          loginRequest,
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrowUpstreamHttpError(
        error,
        'No fue posible comunicarse con el servicio de autenticacion.',
      );
    }
  }

  async register(
    registrarClienteDto: RegistrarClienteDto,
  ): Promise<ApiResponse<ResponseUsuarioDto>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<ResponseUsuarioDto>>(
          `${this.ms4RestUrl}/auth/register`,
          registrarClienteDto,
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrowUpstreamHttpError(
        error,
        'No fue posible comunicarse con el servicio de autenticacion.',
      );
    }
  }

  private rethrowUpstreamHttpError(
    error: any,
    fallbackMessage: string,
  ): never {
    const statusCode =
      error?.response?.status ||
      HttpStatus.BAD_GATEWAY;

    const responseBody =
      error?.response?.data || {
        message: fallbackMessage,
      };

    throw new HttpException(
      responseBody,
      statusCode,
    );
  }
}
