package com.restaurante.features.configuracion;

import com.restaurante.domain.dtos.ConfiguracionRequest;
import com.restaurante.domain.dtos.ConfiguracionResponse;
import com.restaurante.domain.models.Configuracion;
import com.restaurante.features.configuracion.exceptions.ConfiguracionNoEncontradaException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;

    public ConfiguracionService(ConfiguracionRepository configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }

    public ConfiguracionResponse getConfiguracion() {
        String nombreRestaurante = getValue("nombreRestaurante");
        String ruc = getValue("ruc");
        String direccion = getValue("direccion");
        String telefono = getValue("telefono");
        String horarioAtencion = getValue("horarioAtencion");
        Integer tiempoMaximoPreparacion = Integer.valueOf(getValue("tiempoMaximoPreparacion"));
        Integer umbralAlertaCocina = Integer.valueOf(getValue("umbralAlertaCocina"));

        return new ConfiguracionResponse(
                nombreRestaurante,
                ruc,
                direccion,
                telefono,
                horarioAtencion,
                tiempoMaximoPreparacion,
                umbralAlertaCocina
        );
    }

    @Transactional
    public ConfiguracionResponse updateConfiguracion(ConfiguracionRequest request) {
        setValue("nombreRestaurante", request.getNombreRestaurante());
        setValue("ruc", request.getRuc());
        setValue("direccion", request.getDireccion());
        setValue("telefono", request.getTelefono());
        setValue("horarioAtencion", request.getHorarioAtencion());
        setValue("tiempoMaximoPreparacion", String.valueOf(request.getTiempoMaximoPreparacion()));
        setValue("umbralAlertaCocina", String.valueOf(request.getUmbralAlertaCocina()));

        return new ConfiguracionResponse(
                request.getNombreRestaurante(),
                request.getRuc(),
                request.getDireccion(),
                request.getTelefono(),
                request.getHorarioAtencion(),
                request.getTiempoMaximoPreparacion(),
                request.getUmbralAlertaCocina()
        );
    }

    private String getValue(String clave) {
        return configuracionRepository.findByClave(clave)
                .map(Configuracion::getValor)
                .orElseThrow(ConfiguracionNoEncontradaException::new);
    }

    private void setValue(String clave, String valor) {
        Configuracion configuracion = configuracionRepository.findByClave(clave)
                .orElseGet(() -> {
                    Configuracion c = new Configuracion();
                    c.setClave(clave);
                    return c;
                });
        configuracion.setValor(valor);
        configuracionRepository.save(configuracion);
    }
}
