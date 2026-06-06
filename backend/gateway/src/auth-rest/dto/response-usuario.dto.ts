export class ResponseUsuarioDto {
  uuid: string;
  username: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  roles: string[];
}
