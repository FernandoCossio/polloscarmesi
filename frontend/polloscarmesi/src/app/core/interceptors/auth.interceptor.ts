import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@/app/features/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const token = auth.getAccessToken();
    const shouldAttachToken = !!token && auth.isLoggedIn() && !req.headers.has('Authorization');

    // Si hay token pero no está logueado (token expirado), limpiar
    if (!!token && !auth.isLoggedIn()) {
        auth.logout();
        router.navigate(['/login']);
    }

    const authReq = shouldAttachToken
        ? req.clone({
              setHeaders: {
                  Authorization: `Bearer ${token}`,
              },
          })
        : req;

    return next(authReq).pipe(
        catchError((err) => {
            if (err instanceof HttpErrorResponse && err.status === 401) {
                // Si es 401, limpiar token y redirigir al login
                auth.logout();
                router.navigate(['/login']);
            }
            return throwError(() => err);
        })
    );
};
