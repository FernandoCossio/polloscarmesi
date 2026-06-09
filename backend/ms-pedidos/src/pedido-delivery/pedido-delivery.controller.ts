import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PedidoDeliveryService } from './pedido-delivery.service';
import { CrearPedidoDeliveryDto } from './dto/crear-pedido.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
export class PedidoDeliveryController {
  constructor(private readonly pedidoService: PedidoDeliveryService) {}

  @Post('pedidos')
  async crearPedido(@Body() dto: CrearPedidoDeliveryDto) {
    const pedido = await this.pedidoService.crearPedido(dto);
    return { success: true, message: 'Pedido delivery registrado', pedido };
  }

  @Get('pedidos/cliente')
  async obtenerHistorialCliente(@CurrentUser() user: any) {
    const clienteId = user.userId;
    const pedidos = await this.pedidoService.obtenerPedidosPorCliente(clienteId);
    return { success: true, pedidos };
  }

  @Get('repartidor/pedidos')
  async obtenerPedidosRepartidor(@CurrentUser() user: any) {
    const repartidorId = user.userId;
    const pedidos = await this.pedidoService.obtenerPedidosPorRepartidor(repartidorId);
    return { success: true, pedidos };
  }

  @Get('pedidos/:id')
  async obtenerDetallePedido(@Param('id') id: string) {
    const pedido = await this.pedidoService.obtenerPedido(id);
    return { success: true, pedido };
  }

  @Delete('pedidos/:id')
  async cancelarPedido(@Param('id') id: string) {
    const pedido = await this.pedidoService.cancelarPedido(id);
    return { success: true, message: 'Pedido delivery cancelado', pedido };
  }

  @Get('pedidos')
  async obtenerPedidosDelDia() {
    const pedidos = await this.pedidoService.obtenerPedidosDelDia();
    return { success: true, pedidos };
  }
}
