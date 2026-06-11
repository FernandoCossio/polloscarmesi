import { Controller, Get, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Controller('dashboard')
export class DashboardProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get('resumen')
  async getResumen(@Headers('authorization') authHeader?: string) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/dashboard/resumen`, { headers }),
    );
    return response.data;
  }

  @Get('ventas-tiempo')
  async getVentasTiempo(@Headers('authorization') authHeader?: string) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/dashboard/ventas-tiempo`, { headers }),
    );
    return response.data;
  }

  @Get('productos-top')
  async getProductosTop(@Headers('authorization') authHeader?: string) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/dashboard/productos-top`, { headers }),
    );
    return response.data;
  }
}
