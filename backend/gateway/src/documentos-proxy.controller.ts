import { Controller, Get, Param, Query, Headers, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';

@Controller('documentos')
export class DocumentosProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get('reportes/datos')
  async getReportData(
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/datos`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }

  @Get('reportes/productos/datos')
  async getProductosTopData(
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/productos/datos`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }

  @Get('reportes/excel')
  async downloadExcel(
    @Query() query: any,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/excel`, {
        params: query,
        headers,
        responseType: 'arraybuffer',
      }),
    );

    const contentType = String(response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const contentDisposition = String(response.headers['content-disposition'] || 'attachment; filename="reporte-ventas.xlsx"');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.send(response.data);
  }

  @Get('reportes/pdf')
  async getPdfReport(
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/pdf`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }

  @Get('recibos/:pagoId')
  async getRecibo(
    @Param('pagoId') pagoId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/recibos/${pagoId}`, {
        headers,
      }),
    );
    return response.data;
  }

  @Get('reportes/cierre-caja/datos')
  async getCierreCajaData(
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/cierre-caja/datos`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }

  @Get('reportes/cierre-caja/excel')
  async downloadCierreCajaExcel(
    @Query() query: any,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/cierre-caja/excel`, {
        params: query,
        headers,
        responseType: 'arraybuffer',
      }),
    );

    const contentType = String(response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const contentDisposition = String(response.headers['content-disposition'] || 'attachment; filename="reporte-cierre-caja.xlsx"');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.send(response.data);
  }

  @Get('reportes/cierre-caja/pdf')
  async generateCierreCajaPdf(
    @Query() query: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await lastValueFrom(
      this.httpService.get(`${ms1RestUrl}/documentos/reportes/cierre-caja/pdf`, {
        params: query,
        headers,
      }),
    );
    return response.data;
  }
}
