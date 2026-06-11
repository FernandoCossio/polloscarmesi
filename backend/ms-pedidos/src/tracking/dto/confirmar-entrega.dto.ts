import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmarEntregaDto {
  @IsString()
  @IsNotEmpty()
  pedidoId: string;
}
