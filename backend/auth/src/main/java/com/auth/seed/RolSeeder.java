package com.auth.seed;

import com.auth.domain.enums.RolNombre;
import com.auth.domain.models.Rol;
import com.auth.features.rol.RolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class RolSeeder {

    private final RolRepository rolRepository;

    public void seed() {

        int creados = 0;
        creados += crearRolSiNoExiste(RolNombre.ADMINISTRADOR, "Administrador del sistema") ? 1 : 0;
        creados += crearRolSiNoExiste(RolNombre.CAJERO, "Cajero del sistema") ? 1 : 0;
        creados += crearRolSiNoExiste(RolNombre.COCINA, "Personal de cocina") ? 1 : 0;
        creados += crearRolSiNoExiste(RolNombre.REPARTIDOR, "Repartidor") ? 1 : 0;
        creados += crearRolSiNoExiste(RolNombre.CLIENTE, "Usuario cliente") ? 1 : 0;

        if (creados == 0) {
            log.info("[Seeder][Rol] Sin cambios");
        } else {
            log.info("[Seeder][Rol] {} roles creados", creados);
        }

    }

    private boolean crearRolSiNoExiste(RolNombre nombre, String descripcion) {
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            Rol rol = construirRol(nombre, descripcion);
            rolRepository.save(rol);
            log.info("[Seeder][Rol] Creado: {}", nombre);
            return true;
        }
        return false;
    }

    private Rol construirRol(RolNombre nombre, String descripcion) {
        Rol rol = new Rol();
        rol.setNombre(nombre);
        rol.setDescripcion(descripcion);
        return rol;
    }
}
