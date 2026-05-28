import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, tap } from 'rxjs';
import type { Role } from '@/app/core/constants/role.constant';
import type { ApiResponse } from '@/app/core/interface/api-response.interface';
import type { LoginRequest } from '../interfaces/login-request.interface';
import type { RegisterRequest } from '../interfaces/register-request.interface';
import type { ResponseUsuarioDto } from '../interfaces/response-usuario-dto.interface';
import type { TokenResponse } from '../interfaces/token-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly apiBaseUrl = 'http://localhost:8080/api';
    private readonly accessTokenKey = 'access_token';

    login(request: LoginRequest): Observable<TokenResponse> {
        return this.http.post<ApiResponse<TokenResponse>>(`${this.apiBaseUrl}/auth/login`, request).pipe(
            map((res) => res.data),
            tap((token) => this.setAccessToken(token.accessToken))
        );
    }

    register(request: RegisterRequest): Observable<ResponseUsuarioDto> {
        return this.http.post<ApiResponse<ResponseUsuarioDto>>(`${this.apiBaseUrl}/auth/register`, request).pipe(map((res) => res.data));
    }

    logout(): void {
        localStorage.removeItem(this.accessTokenKey);
    }

    isLoggedIn(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        const payload = this.decodeJwtPayload(token);
        if (!payload) return false;

        if (typeof payload.exp !== 'number') return true;
        return payload.exp * 1000 > Date.now();
    }

    hasAnyRole(roles: AppRole[]): boolean {
        const currentRoles = this.getRoles();
        return roles.some((role) => currentRoles.includes(role));
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    getRoles(): Role[] {
        const token = this.getAccessToken();
        if (!token) return [];

        const payload = this.decodeJwtPayload(token);
        const roles = payload?.roles;
        if (!Array.isArray(roles)) return [];

        return roles.filter((r): r is Role => typeof r === 'string') as Role[];
    }

    private setAccessToken(token: string): void {
        localStorage.setItem(this.accessTokenKey, token);
    }

    private decodeJwtPayload(token: string): JwtPayload | null {
        const parts = token.split('.');
        if (parts.length < 2) return null;

        try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            const json = atob(padded);
            return JSON.parse(json) as JwtPayload;
        } catch {
            return null;
        }
    }
}

export type AppRole = Role;

export type { LoginRequest } from '../interfaces/login-request.interface';
export type { RegisterRequest } from '../interfaces/register-request.interface';
export type { ResponseUsuarioDto } from '../interfaces/response-usuario-dto.interface';
export type { TokenResponse } from '../interfaces/token-response.interface';

interface JwtPayload {
    exp?: number;
    sub?: string;
    roles?: string[];
}
