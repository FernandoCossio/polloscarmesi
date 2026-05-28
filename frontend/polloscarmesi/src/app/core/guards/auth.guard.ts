import { AuthService } from '@/app/features/auth/services/auth.service';
import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) return true;

    return router.createUrlTree(['/auth/login']);
};
