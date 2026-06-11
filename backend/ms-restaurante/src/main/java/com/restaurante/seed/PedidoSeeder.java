package com.restaurante.seed;

import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.DetallePedido;
import com.restaurante.domain.models.Pedido;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pedido.PedidoRepository;
import com.restaurante.features.productos.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@Order(2)
public class PedidoSeeder implements CommandLineRunner {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public PedidoSeeder(PedidoRepository pedidoRepository, ProductoRepository productoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (pedidoRepository.count() == 0) {
            List<Producto> productos = productoRepository.findAll();
            if (productos.isEmpty()) {
                System.out.println("Seeder: No hay productos en la base de datos para seedear pedidos.");
                return;
            }

            Random random = new Random(LocalDate.now().toEpochDay());
            LocalDate today = LocalDate.now();

            List<Pedido> pedidos = new ArrayList<>();

            List<LocalDateTime> sevenPmTimes = buildTimesAround7pm(today, 10);

            for (int i = 0; i < 30; i++) {
                LocalDateTime createdAt = randomTimeBetween(today, LocalTime.of(7, 0), LocalTime.of(19, 0), random);
                Pedido pedido = buildPedido(
                        TipoPedido.PRESENCIAL,
                        EstadoPedido.ENTREGADO,
                        "F-" + (200 + i),
                        1L + random.nextInt(20),
                        createdAt,
                        random
                );
                attachDetalles(pedido, productos, createdAt, random);
                pedidos.add(pedido);
            }

            for (int i = 0; i < 20; i++) {
                LocalDateTime createdAt = randomTimeBetween(today, LocalTime.of(7, 0), LocalTime.of(19, 0), random);
                Pedido pedido = buildPedido(
                        TipoPedido.DELIVERY,
                        EstadoPedido.ENTREGADO,
                        "D-" + (200 + i),
                        1L + random.nextInt(20),
                        createdAt,
                        random
                );
                attachDetalles(pedido, productos, createdAt, random);
                pedido.setDescuento(pickDiscount(pedido.getSubtotal(), random));
                pedido.setTotal(pedido.getSubtotal().subtract(pedido.getDescuento()).max(BigDecimal.ZERO));
                pedidos.add(pedido);
            }

            for (int i = 0; i < 10; i++) {
                LocalDateTime createdAt = sevenPmTimes.get(i);
                EstadoPedido estado = (i % 2 == 0) ? EstadoPedido.EN_PREPARACION : EstadoPedido.EN_CAMINO;
                Pedido pedido = buildPedido(
                        TipoPedido.DELIVERY,
                        estado,
                        "D-" + (220 + i),
                        1L + random.nextInt(20),
                        createdAt,
                        random
                );
                attachDetalles(pedido, productos, createdAt, random);
                pedido.setDescuento(pickDiscount(pedido.getSubtotal(), random));
                pedido.setTotal(pedido.getSubtotal().subtract(pedido.getDescuento()).max(BigDecimal.ZERO));
                pedidos.add(pedido);
            }

            pedidoRepository.saveAll(pedidos);
            System.out.println("Seeder: Pedidos de prueba cargados exitosamente: " + pedidos.size());
        }
    }

    private Pedido buildPedido(TipoPedido tipo,
                              EstadoPedido estado,
                              String numeroFicha,
                              Long clienteId,
                              LocalDateTime createdAt,
                              Random random) {
        Pedido pedido = new Pedido();
        pedido.setTipo(tipo);
        pedido.setEstado(estado);
        pedido.setNumeroFicha(numeroFicha);
        pedido.setClienteId(clienteId);
        pedido.setTiempoEstimadoPreparacion(15 + random.nextInt(21));
        pedido.setDescuento(BigDecimal.ZERO);
        pedido.setCreatedAt(createdAt);
        pedido.setUpdatedAt(createdAt.plusMinutes(1));
        return pedido;
    }

    private void attachDetalles(Pedido pedido, List<Producto> productos, LocalDateTime createdAt, Random random) {
        int cantidadItems = 1 + random.nextInt(4);
        List<DetallePedido> detalles = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (int i = 0; i < cantidadItems; i++) {
            Producto producto = productos.get(random.nextInt(productos.size()));
            int cantidad = 1 + random.nextInt(3);

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(producto.getPrecio());
            BigDecimal lineSubtotal = producto.getPrecio().multiply(BigDecimal.valueOf(cantidad)).setScale(2, RoundingMode.HALF_UP);
            detalle.setSubtotal(lineSubtotal);
            detalle.setCreatedAt(createdAt);
            detalle.setUpdatedAt(createdAt.plusMinutes(1));

            detalles.add(detalle);
            subtotal = subtotal.add(lineSubtotal);
        }

        pedido.setDetalles(detalles);
        pedido.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        pedido.setTotal(pedido.getSubtotal().subtract(pedido.getDescuento()).max(BigDecimal.ZERO));
    }

    private BigDecimal pickDiscount(BigDecimal subtotal, Random random) {
        BigDecimal[] options = new BigDecimal[]{
                BigDecimal.ZERO,
                new BigDecimal("2.00"),
                new BigDecimal("3.00"),
                new BigDecimal("5.00"),
                new BigDecimal("7.00")
        };
        BigDecimal selected = options[random.nextInt(options.length)];
        if (selected.compareTo(subtotal) > 0) {
            return BigDecimal.ZERO;
        }
        return selected;
    }

    private List<LocalDateTime> buildTimesAround7pm(LocalDate date, int count) {
        LocalDateTime start = date.atTime(LocalTime.of(19, 0));
        List<LocalDateTime> times = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            times.add(start.plusMinutes(i * 3L));
        }
        return times;
    }

    private LocalDateTime randomTimeBetween(LocalDate date, LocalTime startInclusive, LocalTime endExclusive, Random random) {
        int startMinutes = startInclusive.getHour() * 60 + startInclusive.getMinute();
        int endMinutes = endExclusive.getHour() * 60 + endExclusive.getMinute();
        int bound = Math.max(1, endMinutes - startMinutes);
        int minutesToAdd = random.nextInt(bound);
        return date.atStartOfDay().plusMinutes(startMinutes + minutesToAdd);
    }
}
