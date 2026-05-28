export interface ResponseUsuarioDto {
    uuid: string;
    username: string;
    email: string;
    nombreCompleto: string;
    telefono: string | null;
    roles: string[];
}
