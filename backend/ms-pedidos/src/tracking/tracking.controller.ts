import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrackingService } from './tracking.service';
import { PuntoClaveDto } from './dto/punto-clave.dto';
import { ConfirmarEntregaDto } from './dto/confirmar-entrega.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/delivery/tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('punto-clave')
  async registrarPuntoClave(
    @Body() dto: PuntoClaveDto,
    @CurrentUser() user: any,
  ) {
    const repartidorId = user.userId;
    await this.trackingService.registrarPuntoClave(
      dto.pedidoId,
      repartidorId,
      dto.evento,
      dto.latitud,
      dto.longitud,
    );
    return { success: true, message: `Punto clave ${dto.evento} registrado` };
  }

  @Post('confirmar-entrega')
  @UseInterceptors(FileInterceptor('file'))
  async confirmarEntrega(
    @Body() dto: ConfirmarEntregaDto,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo de evidencia fotográfica es requerido');
    }
    const repartidorId = user.userId;
    const pedido = await this.trackingService.confirmarEntrega(
      dto.pedidoId,
      repartidorId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { success: true, message: 'Entrega confirmada', pedido };
  }
}
