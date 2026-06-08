package com.restaurante.seed;

import com.restaurante.domain.enums.EstadoPago;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Pedido;
import com.restaurante.features.pago.PagoRepository;
import com.restaurante.features.pedido.PedidoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(3)
public class PagoSeeder implements CommandLineRunner {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;

    public PagoSeeder(PagoRepository pagoRepository, PedidoRepository pedidoRepository) {
        this.pagoRepository = pagoRepository;
        this.pedidoRepository = pedidoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (pagoRepository.count() == 0) {
            List<Pedido> pedidos = pedidoRepository.findAll();
            if (pedidos.isEmpty()) {
                System.out.println("Seeder: No hay pedidos en la base de datos para registrar pagos.");
                return;
            }

            // Registrar pago para el primer pedido
            Pedido pedido = pedidos.get(0);
            Pago pago = new Pago();
            pago.setPedido(pedido);
            pago.setMetodo(MetodoPago.EFECTIVO);
            pago.setMontoTotal(pedido.getTotal());
            pago.setMontoRecibido(pedido.getTotal().add(BigDecimal.valueOf(10.00))); // Dar vuelto de 10.00
            pago.setCambio(BigDecimal.valueOf(10.00));
            pago.setEstado(EstadoPago.REVISION_MANUAL);

            pagoRepository.save(pago);

            System.out.println("Seeder: Pago de prueba cargado exitosamente.");
        }
    }
}
