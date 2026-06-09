import { Controller, Post, Headers, Query, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AutomatizacionService } from './automatizacion.service';

@Controller('internal/caja')
export class AutomatizacionController {
  constructor(
    private readonly automatizacionService: AutomatizacionService,
    private readonly configService: ConfigService,
  ) {}

  @Post('cierre')
  async realizarCierreCaja(
    @Headers('x-n8n-secret') n8nSecret: string,
    @Query('fecha') fecha?: string,
  ) {
    const configuredSecret = this.configService.get<string>('n8n.secret', 'n8n_consolidated_secret_2026');

    if (!n8nSecret || n8nSecret !== configuredSecret) {
      throw new ForbiddenException('Acceso denegado: Token secreto de n8n inválido o ausente');
    }

    const result = await this.automatizacionService.realizarCierreCaja(fecha);
    return {
      success: true,
      reportUrl: result.url,
      consolidado: result.consolidado,
    };
  }
}
