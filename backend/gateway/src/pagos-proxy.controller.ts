import { Controller, Headers, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';

@Controller('pagos')
export class PagosProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':id/comprobante')
  @UseInterceptors(FileInterceptor('file'))
  async subirComprobante(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const ms1RestUrl = this.configService.get<string>('microservices.ms1.restUrl');
    if (!ms1RestUrl) {
      throw new Error('MS1_REST_URL is not configured');
    }

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const headers: Record<string, string> = { ...formData.getHeaders() };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await lastValueFrom(
      this.httpService.post(`${ms1RestUrl}/pagos/${id}/comprobante`, formData, { headers }),
    );

    return response.data;
  }
}
