import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class PuntoClaveDto {
  @IsString()
  @IsNotEmpty()
  pedidoId: string;

  @IsString()
  @IsNotEmpty()
  evento: string; // e.g. ACEPTADO, EN_CAMINO, LLEGADA

  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  longitud: number;
}
