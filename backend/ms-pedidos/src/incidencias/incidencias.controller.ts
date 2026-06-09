import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { ReportarIncidenciaDto } from './dto/reportar-incidencia.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/delivery/incidencias')
@UseGuards(JwtAuthGuard)
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
  async reportarIncidencia(
    @Body() dto: ReportarIncidenciaDto,
    @CurrentUser() user: any,
  ) {
    const repartidorId = user.userId;
    const incidencia = await this.incidenciasService.reportarIncidencia(
      dto.pedidoId,
      repartidorId,
      dto.tipo,
      dto.descripcion,
    );
    return { success: true, message: 'Incidencia registrada', incidencia };
  }
}
