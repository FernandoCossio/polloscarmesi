package com.auth.seed;

import com.auth.domain.enums.RolNombre;
import com.auth.domain.models.Rol;
import com.auth.domain.models.Usuario;
import com.auth.features.rol.RolRepository;
import com.auth.features.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class UsuarioSeeder {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public void seed() {
        int creados = 0;

        creados += crearUsuarioSiNoExiste(
                "admin",
                "admin@restaurante.com",
                "Administrador",
                null,
                RolNombre.ADMINISTRADOR
        ) ? 1 : 0;

        creados += crearUsuarioSiNoExiste(
                "cajero",
                "cajero@restaurante.com",
                "Usuario Cajero",
                "59178945612",
                RolNombre.CAJERO
        ) ? 1 : 0;

        creados += crearUsuarioSiNoExiste(
                "cocina",
                "cocina@restaurante.com",
                "Usuario Cocina",
                null,
                RolNombre.COCINA
        ) ? 1 : 0;

        creados += crearUsuarioSiNoExiste(
                "repartidor",
                "repartidor@restaurante.com",
                "Usuario Repartidor",
                "59171355794",
                RolNombre.REPARTIDOR
        ) ? 1 : 0;

        creados += crearUsuarioSiNoExiste(
                "cliente",
                "cliente@restaurante.com",
                "Usuario Cliente",
                "59171234567",
                RolNombre.CLIENTE
        ) ? 1 : 0;

        if (creados == 0) {
            log.info("[Seeder][Usuario] Sin cambios");
        } else {
            log.info("[Seeder][Usuario] {} usuarios creados", creados);
        }
    }

    private boolean crearUsuarioSiNoExiste(String username,
                                           String email,
                                           String nombreCompleto,
                                           String telefono,
                                           RolNombre rolNombre) {
        if (usuarioRepository.findByUsernameIgnoreCase(username).isPresent()) {
            log.info("[Seeder][Usuario] '{}' ya existe, omitiendo", username);
            return false;
        }

        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new IllegalStateException("Rol " + rolNombre + " no encontrado"));

        Usuario usuario = construirUsuario(
                username,
                email,
                nombreCompleto,
                "123123",
                true,
                telefono,
                Set.of(rol)
        );

        usuarioRepository.save(usuario);
        log.info("[Seeder][Usuario] Creado: {} con rol {}", username, rolNombre);
        return true;
    }

    private Usuario construirUsuario(String username,
                                     String email,
                                     String nombreCompleto,
                                     String passwordPlano,
                                     boolean activo,
                                     String telefono,
                                     Set<Rol> roles) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombreCompleto(nombreCompleto);
        usuario.setPassword(passwordEncoder.encode(passwordPlano));
        usuario.setActivo(activo);
        usuario.setTelefono(telefono);
        usuario.setRoles(roles);
        return usuario;
    }
}
