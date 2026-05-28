import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/features/admin/pages/dashboard/dashboard';
import { authGuard } from './app/core/guards/auth.guard';
import { roleGuard } from './app/core/guards/role.guard';
import { ROLES } from './app/core/constants/role.constant';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [authGuard, roleGuard(ROLES.ADMINISTRADOR)] },
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
