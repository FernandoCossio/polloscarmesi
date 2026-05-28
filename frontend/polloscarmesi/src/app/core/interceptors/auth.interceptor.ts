import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@/app/features/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const token = auth.getAccessToken();
    const shouldAttachToken = !!token && auth.isLoggedIn() && !req.headers.has('Authorization');

    if (!!token && !auth.isLoggedIn()) {
        auth.logout();
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
                auth.logout();
            }
            return throwError(() => err);
        })
    );
};
