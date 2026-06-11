import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { RegistrarTokenDto } from './dto/registrar-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/delivery/notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('token')
  async registrarToken(
    @Body() dto: RegistrarTokenDto,
    @CurrentUser() user: any,
  ) {
    const rol = user.role || user.rol || 'CLIENTE';
    const token = await this.notificacionesService.registrarToken(
      user.userId,
      rol,
      dto.expoPushToken,
      dto.plataforma,
    );
    return { success: true, message: 'Token registrado exitosamente', token };
  }
}
