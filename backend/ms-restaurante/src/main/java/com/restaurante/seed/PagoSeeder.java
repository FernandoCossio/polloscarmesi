package com.restaurante.seed;

import com.restaurante.domain.enums.EstadoPago;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Pedido;
import com.restaurante.features.pago.PagoRepository;
import com.restaurante.features.pedido.PedidoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

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
        List<Pedido> pedidos = pedidoRepository.findAll();
        if (pedidos.isEmpty()) {
            System.out.println("Seeder: No hay pedidos en la base de datos para registrar pagos.");
            return;
        }

        Random random = new Random(pedidos.size());
        List<Pago> pagos = new ArrayList<>();

        int index = 0;
        for (Pedido pedido : pedidos) {
            if (pedido.getId() == null || pagoRepository.existsByPedidoId(pedido.getId())) {
                continue;
            }

            MetodoPago metodo = (index % 2 == 0) ? MetodoPago.EFECTIVO : MetodoPago.QR;
            BigDecimal montoTotal = pedido.getTotal() == null ? BigDecimal.ZERO : pedido.getTotal();
            BigDecimal cambio = BigDecimal.ZERO;
            BigDecimal montoRecibido = montoTotal;

            if (metodo == MetodoPago.EFECTIVO) {
                BigDecimal extra = pickExtraCash(montoTotal, random);
                montoRecibido = montoTotal.add(extra);
                cambio = extra;
            }

            EstadoPago estadoPago = (pedido.getTipo() == TipoPedido.PRESENCIAL) ? EstadoPago.REVISION_MANUAL : EstadoPago.ACEPTADO;
            LocalDateTime baseCreatedAt = pedido.getCreatedAt() != null ? pedido.getCreatedAt() : LocalDateTime.now();
            LocalDateTime createdAt = baseCreatedAt.plusMinutes(5);

            Pago pago = new Pago();
            pago.setPedido(pedido);
            pago.setMetodo(metodo);
            pago.setMontoTotal(montoTotal.setScale(2, RoundingMode.HALF_UP));
            pago.setMontoRecibido(montoRecibido.setScale(2, RoundingMode.HALF_UP));
            pago.setCambio(cambio.setScale(2, RoundingMode.HALF_UP));
            pago.setEstado(estadoPago);
            pago.setCreatedAt(createdAt);
            pago.setUpdatedAt(createdAt.plusMinutes(1));

            if (metodo == MetodoPago.QR) {
                pago.setTxHash(randomTxHash(pedido.getUuid().toString(), index));
                pago.setFechaSubida(createdAt);
            } else {
                pago.setTxHash(null);
                pago.setFechaSubida(null);
            }

            pagos.add(pago);
            index++;
        }

        if (!pagos.isEmpty()) {
            pagoRepository.saveAll(pagos);
        }
        System.out.println("Seeder: Pagos creados: " + pagos.size());
    }

    private BigDecimal pickExtraCash(BigDecimal montoTotal, Random random) {
        if (montoTotal.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal[] options = new BigDecimal[]{
                BigDecimal.ZERO,
                new BigDecimal("2.00"),
                new BigDecimal("5.00"),
                new BigDecimal("10.00")
        };
        return options[random.nextInt(options.length)];
    }

    private String randomTxHash(String seed, int index) {
        String base = seed.replace("-", "") + String.format("%02d", index);
        if (base.length() >= 64) {
            return base.substring(0, 64);
        }
        return "0".repeat(64 - base.length()) + base;
    }
}
