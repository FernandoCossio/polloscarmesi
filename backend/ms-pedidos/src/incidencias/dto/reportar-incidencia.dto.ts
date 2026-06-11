import { IsString, IsNotEmpty } from 'class-validator';

export class ReportarIncidenciaDto {
  @IsString()
  @IsNotEmpty()
  pedidoId: string;

  @IsString()
  @IsNotEmpty()
  tipo: string; // e.g. RECHAZO_PEDIDO, DIRECCION_INCORRECTA, CLIENTE_AUSENTE, ACCIDENTE

  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
