import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegistrarTokenDto {
  @IsString()
  @IsNotEmpty()
  expoPushToken: string;

  @IsString()
  @IsOptional()
  plataforma?: string;
}
