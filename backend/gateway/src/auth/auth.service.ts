import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Match DTOs from auth service
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegistrarClienteDto {
  username: string;
  email: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface TokenResponse {
  accessToken: string;
}

export interface ResponseUsuarioDto {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async login(credentials: LoginRequest): Promise<ApiResponse<TokenResponse>> {
    const ms4Url = this.configService.get<string>('ms4.restUrl');
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<TokenResponse>>(`${ms4Url}/auth/login`, credentials),
    );
    return response.data;
  }

  async register(userData: RegistrarClienteDto): Promise<ApiResponse<ResponseUsuarioDto>> {
    const ms4Url = this.configService.get<string>('ms4.restUrl');
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<ResponseUsuarioDto>>(`${ms4Url}/auth/register`, userData),
    );
    return response.data;
  }

  async logout(userId: string) {
    return { success: true, message: 'Logout successful' };
  }
}
