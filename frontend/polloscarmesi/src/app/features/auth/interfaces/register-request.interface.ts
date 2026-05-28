export interface RegisterRequest {
    username: string;
    email: string;
    nombreCompleto: string;
    telefono?: string | null;
    password: string;
}
