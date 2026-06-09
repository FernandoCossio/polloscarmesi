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
import java.util.ArrayList;
import java.util.List;

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

            // Primer pedido: Presencial
            Pedido p1 = new Pedido();
            p1.setNumeroFicha("F-101");
            p1.setTipo(TipoPedido.PRESENCIAL);
            p1.setEstado(EstadoPedido.EN_PREPARACION);
            p1.setClienteId(10L);
            p1.setDescuento(BigDecimal.ZERO);
            p1.setTiempoEstimadoPreparacion(20);

            Producto prod1 = productos.get(0);
            DetallePedido d1 = new DetallePedido();
            d1.setPedido(p1);
            d1.setProducto(prod1);
            d1.setCantidad(2);
            d1.setPrecioUnitario(prod1.getPrecio());
            d1.setSubtotal(prod1.getPrecio().multiply(BigDecimal.valueOf(2)));

            List<DetallePedido> detalles1 = new ArrayList<>();
            detalles1.add(d1);

            BigDecimal subtotal1 = d1.getSubtotal();
            p1.setSubtotal(subtotal1);
            p1.setTotal(subtotal1);
            p1.setDetalles(detalles1);

            pedidoRepository.save(p1);

            // Segundo pedido: Delivery
            if (productos.size() > 1) {
                Pedido p2 = new Pedido();
                p2.setNumeroFicha(null);
                p2.setTipo(TipoPedido.DELIVERY);
                p2.setEstado(EstadoPedido.PENDIENTE);
                p2.setClienteId(20L);
                p2.setDescuento(BigDecimal.valueOf(5.00));
                p2.setTiempoEstimadoPreparacion(20);

                Producto prod2 = productos.get(1);
                DetallePedido d2 = new DetallePedido();
                d2.setPedido(p2);
                d2.setProducto(prod2);
                d2.setCantidad(1);
                d2.setPrecioUnitario(prod2.getPrecio());
                d2.setSubtotal(prod2.getPrecio());

                List<DetallePedido> detalles2 = new ArrayList<>();
                detalles2.add(d2);

                BigDecimal subtotal2 = d2.getSubtotal();
                p2.setSubtotal(subtotal2);
                BigDecimal total2 = subtotal2.subtract(p2.getDescuento());
                p2.setTotal(total2.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total2);
                p2.setDetalles(detalles2);

                pedidoRepository.save(p2);
            }

            System.out.println("Seeder: Pedidos de prueba cargados exitosamente.");
        }
    }
}
