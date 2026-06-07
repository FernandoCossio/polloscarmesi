import { ApiProperty } from '@nestjs/swagger';

export class ResponseUsuarioDto {
  @ApiProperty({
    description: 'UUID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'cliente1',
  })
  username: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'cliente@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  nombreCompleto: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario (opcional)',
    example: '+549112345678',
    required: false,
  })
  telefono?: string;

  @ApiProperty({
    description: 'Roles asignados al usuario',
    example: ['CLIENTE'],
    isArray: true,
  })
  roles: string[];
}
