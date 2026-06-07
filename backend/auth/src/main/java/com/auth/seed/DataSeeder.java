package com.auth.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RolSeeder rolSeeder;
    private final UsuarioSeeder usuarioSeeder;

    @Override
    public void run(String... args) {
        log.info("[Seeder] Inicio");

        rolSeeder.seed();
        usuarioSeeder.seed();

        log.info("[Seeder] Fin");
    }
}
