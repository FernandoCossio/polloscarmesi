package com.restaurante.seed;

import com.restaurante.domain.models.Configuracion;
import com.restaurante.features.configuracion.ConfiguracionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(4)
public class ConfiguracionSeeder implements CommandLineRunner {

    private final ConfiguracionRepository configuracionRepository;

    public ConfiguracionSeeder(ConfiguracionRepository configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedConfiguracion("nombreRestaurante", "Pollos Carmesí");
        seedConfiguracion("ruc", "10456789123");
        seedConfiguracion("direccion", "Av. Principal 123, Cusco");
        seedConfiguracion("telefono", "084-234567");
        seedConfiguracion("horarioAtencion", "11:00 AM - 10:00 PM");
        seedConfiguracion("tiempoMaximoPreparacion", "45");
        seedConfiguracion("umbralAlertaCocina", "30");
        seedConfiguracion("coordenadas", "-17.78068307759428, -63.18512279411213");
        System.out.println("Seeder: Configuración inicial cargada exitosamente.");
    }

    private void seedConfiguracion(String clave, String valor) {
        if (!configuracionRepository.existsByClave(clave)) {
            Configuracion c = new Configuracion();
            c.setClave(clave);
            c.setValor(valor);
            configuracionRepository.save(c);
        }
    }
}
