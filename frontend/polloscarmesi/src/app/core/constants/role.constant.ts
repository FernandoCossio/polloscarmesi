export const ROLE_ADMINISTRADOR = 'ROLE_ADMINISTRADOR' as const;
export const ROLE_CAJERO = 'ROLE_CAJERO' as const;
export const ROLE_COCINA = 'ROLE_COCINA' as const;

export const ROLES = {
    ADMINISTRADOR: ROLE_ADMINISTRADOR,
    CAJERO: ROLE_CAJERO,
    COCINA: ROLE_COCINA,
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
