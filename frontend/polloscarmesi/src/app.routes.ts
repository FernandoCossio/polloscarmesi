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
            { path: '', component: Dashboard, canActivate: [authGuard] },
            { 
                path: 'categorias', 
                loadComponent: () => import('./app/features/categoria/pages/list/list').then(m => m.List),
                canActivate: [authGuard, roleGuard(ROLES.ADMINISTRADOR)]
            },
            {
                path: 'productos',
                loadComponent: () => import('./app/features/producto/pages/list/list').then(m => m.List),
                canActivate: [authGuard, roleGuard(ROLES.ADMINISTRADOR)]
            },
            {
                path: 'registrar-pedido',
                loadComponent: () => import('./app/features/pedido/pages/registra-pedidio/registra-pedidio').then(m => m.RegistraPedidio),
                canActivate: [authGuard, roleGuard(ROLES.CAJERO)]
            },
            {
                path: 'registrar-pago',
                loadComponent: () => import('./app/features/pedido/pages/registrar-pago/registrar-pago').then(m => m.RegistrarPago),
                canActivate: [authGuard, roleGuard(ROLES.CAJERO)]
            },
            {
                path: 'historial-pedidos',
                loadComponent: () => import('./app/features/pedido/pages/historial-pedidos/historial-pedidos').then(m => m.HistorialPedidos),
                canActivate: [authGuard, roleGuard(ROLES.CAJERO)]
            }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/features/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
