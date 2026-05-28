package com.restaurante.seed;

import com.restaurante.domain.enums.RolNombre;
import com.restaurante.domain.models.Rol;
import com.restaurante.domain.models.Usuario;
import com.restaurante.features.rol.RolRepository;
import com.restaurante.features.usuario.UsuarioRepository;
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

        String username = "admin";
        if (usuarioRepository.findByUsernameIgnoreCase(username).isPresent()) {
            log.info("[Seeder][Usuario] '{}' ya existe, omitiendo", username);
            log.info("[Seeder][Usuario] Fin");
            return;
        }

        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Rol ADMINISTRADOR no encontrado"));

        Usuario admin = construirUsuario(
                username,
                "admin@restaurante.com",
                "Administrador",
                "admin123",
                true,
                Set.of(rolAdmin)
        );

        usuarioRepository.save(admin);
        log.info("[Seeder][Usuario] Creado: {}", username);
    }

    private Usuario construirUsuario(String username,
                                     String email,
                                     String nombreCompleto,
                                     String passwordPlano,
                                     boolean activo,
                                     Set<Rol> roles) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setNombreCompleto(nombreCompleto);
        usuario.setPassword(passwordEncoder.encode(passwordPlano));
        usuario.setActivo(activo);
        usuario.setRoles(roles);
        return usuario;
    }
}
