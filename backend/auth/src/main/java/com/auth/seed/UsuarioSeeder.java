package com.auth.seed;

import com.auth.domain.enums.RolNombre;
import com.auth.domain.models.Rol;
import com.auth.domain.models.Usuario;
import com.auth.features.rol.RolRepository;
import com.auth.features.usuario.UsuarioRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class UsuarioSeeder {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Transactional
    public void seed() {
        log.info("[Seeder][Usuario] Limpiando usuarios anteriores...");
        try {
            entityManager.createNativeQuery("TRUNCATE TABLE usuario RESTART IDENTITY CASCADE").executeUpdate();
            log.info("[Seeder][Usuario] Tabla usuario truncada y secuencia reiniciada");
        } catch (Exception e) {
            log.warn("[Seeder][Usuario] No se pudo truncar con RESTART IDENTITY: {}. Intentando deleteAll...", e.getMessage());
            usuarioRepository.deleteAll();
        }

        // 1. 20 Clientes (deben ser los primeros para tener IDs del 1 al 20)
        for (int i = 1; i <= 20; i++) {
            crearUsuarioDirecto(
                    "cliente" + i,
                    "fcossio333+" + i + "@gmail.com",
                    "Cliente " + i,
                    "75551574",
                    RolNombre.CLIENTE
            );
        }

        // 2. 1 Admin con gmail fcossio100@gmail.com
        crearUsuarioDirecto(
                "admin",
                "fcossio100@gmail.com",
                "Administrador",
                "75551574",
                RolNombre.ADMINISTRADOR
        );

        // 3. 2 Cajeros con gmail random
        for (int i = 1; i <= 2; i++) {
            String randomStr = UUID.randomUUID().toString().substring(0, 8);
            crearUsuarioDirecto(
                    "cajero" + i,
                    "cajero_" + randomStr + "@gmail.com",
                    "Cajero " + i,
                    "75551574",
                    RolNombre.CAJERO
            );
        }

        // 4. 1 Cocina con gmail random
        String randomCocina = UUID.randomUUID().toString().substring(0, 8);
        crearUsuarioDirecto(
                "cocina",
                "cocina_" + randomCocina + "@gmail.com",
                "Personal Cocina",
                "75551574",
                RolNombre.COCINA
        );

        // 5. 5 Repartidores con gmail fcossio600+n@gmail.com
        for (int i = 1; i <= 5; i++) {
            crearUsuarioDirecto(
                    "repartidor" + i,
                    "fcossio600+" + i + "@gmail.com",
                    "Repartidor " + i,
                    "75551574",
                    RolNombre.REPARTIDOR
            );
        }

        log.info("[Seeder][Usuario] Carga de usuarios completada con éxito");
    }

    private void crearUsuarioDirecto(String username,
                                     String email,
                                     String nombreCompleto,
                                     String telefono,
                                     RolNombre rolNombre) {
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new IllegalStateException("Rol " + rolNombre + " no encontrado"));

        Usuario usuario = construirUsuario(
                username,
                email,
                nombreCompleto,
                "123123123",
                true,
                telefono,
                Set.of(rol)
        );

        usuarioRepository.save(usuario);
        log.info("[Seeder][Usuario] Creado: {} (ID: {}) con rol {}", username, usuario.getId(), rolNombre);
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
