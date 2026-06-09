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
                    label: 'Gestión',
                    items: [
                        { label: 'Categorías', icon: 'pi pi-fw pi-tags', routerLink: ['/categorias'] },
                        { label: 'Productos', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/productos'] }
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
                        { label: 'Historial de Pedidos', icon: 'pi pi-fw pi-history', routerLink: ['/historial-pedidos'] }
                    ]
                }
            ];
        }

        if (roles.includes(ROLES.COCINA)) {
            return [
                {
                    label: 'Cocina',
                    items: [
                        
                    ]
                }
            ];
        }

        return [];
    }
}
