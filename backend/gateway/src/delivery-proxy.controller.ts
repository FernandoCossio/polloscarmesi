import { Controller, Post, Req, Res, UseInterceptors, UploadedFile, Headers, Body, All, HttpException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';
import { Request, Response } from 'express';

@Controller('api/v1/delivery')
export class DeliveryProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('tracking/confirmar-entrega')
  @UseInterceptors(FileInterceptor('file'))
  async confirmarEntrega(
    @Body() body: any,
    @UploadedFile() file: any,
    @Headers('authorization') authHeader?: string,
  ) {
    try {
      console.log('>>> [GATEWAY] Recibió solicitud confirmarEntrega:', { pedidoId: body?.pedidoId, hasFile: !!file });
      const ms2RestUrl = this.configService.get<string>('microservices.ms2.restUrl') || 'http://localhost:3001';
      const formData = new FormData();
      formData.append('pedidoId', body?.pedidoId || '');
      if (file) {
        formData.append('file', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      const headers: Record<string, string> = { ...formData.getHeaders() };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await lastValueFrom(
        this.httpService.post(`${ms2RestUrl}/api/v1/delivery/tracking/confirmar-entrega`, formData.getBuffer(), { headers })
      );
      return response.data;
    } catch (err) {
      console.error('Error en gateway proxy confirmar-entrega:', err.message);
      if (err.response) {
        console.error('Error desde ms-pedidos:', err.response.data);
        throw new HttpException(err.response.data, err.response.status);
      }
      throw new InternalServerErrorException(err.message);
    }
  }

  @All('*path')
  async proxyDelivery(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms2RestUrl = this.configService.get<string>('microservices.ms2.restUrl') || 'http://localhost:3001';
    const url = `${ms2RestUrl}${req.originalUrl}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method as any,
          url,
          data: req.body,
          headers,
        })
      );
      return res.status(response.status).json(response.data);
    } catch (err) {
      console.error('Error en gateway proxyDelivery:', err.message);
      if (err.response) {
        console.error('Data del error proxyDelivery:', err.response.data);
        return res.status(err.response.status).json(err.response.data);
      }
      return res.status(500).json({ message: err.message });
    }
  }
}
