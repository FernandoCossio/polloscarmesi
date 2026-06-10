import { Body, Controller, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Controller('usuarios')
export class UsuariosProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getMs4RestUrl(): string {
    const ms4RestUrl = this.configService.get<string>('ms4.restUrl');
    if (!ms4RestUrl) {
      throw new Error('MS4_REST_URL is not configured');
    }
    return ms4RestUrl;
  }

  private buildHeaders(authHeader?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    return headers;
  }

  @Get('personal')
  async listarPersonal(@Query() query: any, @Headers('authorization') authHeader?: string) {
    const ms4RestUrl = this.getMs4RestUrl();
    const headers = this.buildHeaders(authHeader);

    const response = await lastValueFrom(
      this.httpService.get(`${ms4RestUrl}/usuarios/personal`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }

  @Get(':uuid')
  async obtenerPorUuid(@Param('uuid') uuid: string, @Headers('authorization') authHeader?: string) {
    const ms4RestUrl = this.getMs4RestUrl();
    const headers = this.buildHeaders(authHeader);

    const response = await lastValueFrom(this.httpService.get(`${ms4RestUrl}/usuarios/${uuid}`, { headers }));
    return response.data;
  }

  @Post('personal')
  async crearPersonal(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const ms4RestUrl = this.getMs4RestUrl();
    const headers = this.buildHeaders(authHeader);

    const response = await lastValueFrom(
      this.httpService.post(`${ms4RestUrl}/usuarios/personal`, body, {
        headers,
      }),
    );
    return response.data;
  }

  @Put('personal/:uuid')
  async actualizarPersonal(
    @Param('uuid') uuid: string,
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms4RestUrl = this.getMs4RestUrl();
    const headers = this.buildHeaders(authHeader);

    const response = await lastValueFrom(
      this.httpService.put(`${ms4RestUrl}/usuarios/personal/${uuid}`, body, {
        headers,
      }),
    );
    return response.data;
  }

  @Patch('personal/:uuid/estado')
  async cambiarEstado(
    @Param('uuid') uuid: string,
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms4RestUrl = this.getMs4RestUrl();
    const headers = this.buildHeaders(authHeader);

    const response = await lastValueFrom(
      this.httpService.patch(`${ms4RestUrl}/usuarios/personal/${uuid}/estado`, body, {
        headers,
      }),
    );
    return response.data;
  }
}
