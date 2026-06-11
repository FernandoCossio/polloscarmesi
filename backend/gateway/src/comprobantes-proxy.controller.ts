import {
  BadRequestException,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  ConfigService,
} from '@nestjs/config';

import {
  HttpService,
} from '@nestjs/axios';

import {
  lastValueFrom,
} from 'rxjs';

import * as FormData from 'form-data';

@ApiTags('IA - Comprobantes')
@Controller('ia/comprobantes')
export class ComprobantesProxyController {
  constructor(
    private readonly httpService:
      HttpService,

    private readonly configService:
      ConfigService,
  ) {}

  @Post('analizar')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Analizar un comprobante con IA',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',

      required: [
        'archivo',
      ],

      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('archivo'),
  )
  async analizarComprobante(
    @UploadedFile()
    archivo: any,

    @Headers('authorization')
    authHeader?: string,
  ) {
    if (!archivo) {
      throw new BadRequestException(
        'Debe enviar una imagen en el campo archivo.',
      );
    }

    const msiaRestUrl =
      this.configService.get<string>(
        'microservices.msia.restUrl',
      );

    if (!msiaRestUrl) {
      throw new Error(
        'MSIA_REST_URL is not configured',
      );
    }

    const formData = new FormData();

    formData.append(
      'archivo',
      archivo.buffer,
      {
        filename:
          archivo.originalname,

        contentType:
          archivo.mimetype,
      },
    );

    const headers: Record<
      string,
      string
    > = {
      ...formData.getHeaders(),
    };

    if (authHeader) {
      headers['Authorization'] =
        authHeader;
    }

    try {
      const response =
        await lastValueFrom(
          this.httpService.post(
            `${msiaRestUrl}/comprobantes/analizar`,
            formData,
            {
              headers,
            },
          ),
        );

      return response.data;
    } catch (error) {
      const statusCode =
        error?.response?.status ||
        HttpStatus.BAD_GATEWAY;

      const responseBody =
        error?.response?.data || {
          detail:
            'No fue posible comunicarse con ms-ia.',
        };

      throw new HttpException(
        responseBody,
        statusCode,
      );
    }
  }
}