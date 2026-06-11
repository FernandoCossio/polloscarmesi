import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/app/features/auth/services/auth.service';
import type { Role } from '@/app/core/constants/role.constant';
import { ROLES } from '@/app/core/constants/role.constant';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
    private readonly auth = inject(AuthService);

    model: MenuItem[] = [];

    ngOnInit() {
        this.model = this.buildMenuByRoles(this.auth.getRoles());
    }

    private buildMenuByRoles(roles: Role[]): MenuItem[] {
        if (roles.includes(ROLES.ADMINISTRADOR)) {
            return [
                {
                    label: 'Home',
                    items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
                },
                {
                    label: 'Menu',
                    items: [
                        { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/categorias'] },
                        { label: 'Productos', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/productos'] },
                    ]
                },
                {
                    label: 'Gestion',
                    items: [
                        { label: 'Gestion de usuarios', icon: 'pi pi-fw pi-user', routerLink: ['/usuarios'] },
                        { label: 'Configuración del Sistema', icon: 'pi pi-fw pi-cog', routerLink: ['/configuracion'] }
                    ]
                },
                {
                    label: 'Reportes',
                    items: [
                        { label: 'Reporte de Ventas', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/reporte-ventas'] },
                        { label: 'Rendimiento de Productos', icon: 'pi pi-fw pi-percentage', routerLink: ['/reporte-rendimiento'] },
                        { label: 'Cierre de Caja', icon: 'pi pi-fw pi-lock', routerLink: ['/reporte-cierre-caja'] }
                    ]
                }
            ];
        }

        if (roles.includes(ROLES.CAJERO)) {
            return [
                {
                    label: 'Pedidos',
                    items: [
                        { label: 'Registrar Pedido', icon: 'pi pi-fw pi-plus-circle', routerLink: ['/registrar-pedido'] },
                        { label: 'Historial de Pedidos', icon: 'pi pi-fw pi-history', routerLink: ['/historial-pedidos'] },
                        { label: 'Cierre de Caja', icon: 'pi pi-fw pi-lock', routerLink: ['/reporte-cierre-caja'] }
                    ]
                }
            ];
        }

        if (roles.includes(ROLES.COCINA)) {
            return [
                {
                    label: 'Cocina',
                    items: [
                        { label: 'Cola de Cocina', icon: 'pi pi-fw pi-list-check', routerLink: ['/cola-pedidos'] }
                    ]
                }
            ];
        }

        return [];
    }
}
