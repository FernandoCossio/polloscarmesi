package com.restaurante.features.dashboard;

import com.restaurante.domain.dtos.*;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.models.Pedido;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pedido.DetallePedidoRepository;
import com.restaurante.features.pedido.PedidoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DashboardService {

    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String KPI_RESUMEN_KEY = "kpi:resumen";
    private static final String KPI_VENTAS_TIEMPO_KEY = "kpi:ventas_tiempo";
    private static final String KPI_PRODUCTOS_TOP_KEY = "kpi:productos_top";

    public DashboardService(PedidoRepository pedidoRepository,
                            DetallePedidoRepository detallePedidoRepository,
                            RedisTemplate<String, Object> redisTemplate) {
        this.pedidoRepository = pedidoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.redisTemplate = redisTemplate;
    }

    public DashboardResumenResponse getResumenKPIs() {
        try {
            DashboardResumenResponse cached = (DashboardResumenResponse) redisTemplate.opsForValue().get(KPI_RESUMEN_KEY);
            if (cached != null) {
                log.info("Dashboard resumen obtenido desde Redis Cache");
                return cached;
            }
        } catch (Exception e) {
            log.error("Error al leer caché de Redis para resumen KPIs: {}", e.getMessage());
        }

        log.info("Calculando KPIs resumen desde la base de datos");
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX);

        LocalDate yesterday = today.minusDays(1);
        LocalDateTime yesterdayStart = yesterday.atStartOfDay();
        LocalDateTime yesterdayEnd = yesterday.atTime(LocalTime.MAX);

        // 1. Ventas Totales
        BigDecimal ventasToday = pedidoRepository.sumTotalByCreatedAtBetweenAndEstado(todayStart, todayEnd, EstadoPedido.ENTREGADO);
        BigDecimal ventasYesterday = pedidoRepository.sumTotalByCreatedAtBetweenAndEstado(yesterdayStart, yesterdayEnd, EstadoPedido.ENTREGADO);
        BigDecimal diffVentas = calculatePercentageDifference(ventasToday, ventasYesterday);

        // 2. Ticket Promedio
        BigDecimal ticketToday = pedidoRepository.avgTotalByCreatedAtBetweenAndEstado(todayStart, todayEnd, EstadoPedido.ENTREGADO);
        BigDecimal ticketYesterday = pedidoRepository.avgTotalByCreatedAtBetweenAndEstado(yesterdayStart, yesterdayEnd, EstadoPedido.ENTREGADO);
        BigDecimal diffTicket = calculatePercentageDifference(ticketToday, ticketYesterday);

        // 3. Pedidos Entregados
        long pedidosToday = pedidoRepository.countByCreatedAtBetweenAndEstado(todayStart, todayEnd, EstadoPedido.ENTREGADO);
        long pedidosYesterday = pedidoRepository.countByCreatedAtBetweenAndEstado(yesterdayStart, yesterdayEnd, EstadoPedido.ENTREGADO);
        BigDecimal diffPedidos = calculatePercentageDifference(BigDecimal.valueOf(pedidosToday), BigDecimal.valueOf(pedidosYesterday));

        // 4. Tiempo Cocina Promedio
        List<Pedido> todayOrders = pedidoRepository.findAllByCreatedAtBetween(todayStart, todayEnd);
        double avgTimeToday = calculateAveragePrepTime(todayOrders);

        List<Pedido> yesterdayOrders = pedidoRepository.findAllByCreatedAtBetween(yesterdayStart, yesterdayEnd);
        double avgTimeYesterday = calculateAveragePrepTime(yesterdayOrders);
        BigDecimal diffTime = calculatePercentageDifference(BigDecimal.valueOf(avgTimeToday), BigDecimal.valueOf(avgTimeYesterday));

        DashboardResumenResponse response = new DashboardResumenResponse(
                new KpiCardResponse(ventasToday, "BOB", diffVentas),
                new KpiCardResponse(ticketToday, "BOB", diffTicket),
                new KpiCardResponse(BigDecimal.valueOf(pedidosToday), "unidades", diffPedidos),
                new KpiCardResponse(BigDecimal.valueOf(avgTimeToday).setScale(1, RoundingMode.HALF_UP), "minutos", diffTime)
        );

        try {
            redisTemplate.opsForValue().set(KPI_RESUMEN_KEY, response, 10, TimeUnit.MINUTES);
            log.info("Dashboard resumen guardado en Redis Cache");
        } catch (Exception e) {
            log.error("Error al guardar en Redis: {}", e.getMessage());
        }

        return response;
    }

    public List<GraficoLineaResponse> getVentasPorHora() {
        try {
            @SuppressWarnings("unchecked")
            List<GraficoLineaResponse> cached = (List<GraficoLineaResponse>) redisTemplate.opsForValue().get(KPI_VENTAS_TIEMPO_KEY);
            if (cached != null) {
                log.info("Ventas por hora obtenidas desde Redis Cache");
                return cached;
            }
        } catch (Exception e) {
            log.error("Error al leer caché de Redis para ventas por hora: {}", e.getMessage());
        }

        log.info("Calculando ventas por hora desde la base de datos");
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX);

        List<Pedido> todayOrders = pedidoRepository.findAllByCreatedAtBetween(todayStart, todayEnd);
        Map<String, BigDecimal> hourlyMap = new TreeMap<>();
        for (int h = 0; h < 24; h++) {
            hourlyMap.put(String.format("%02d:00", h), BigDecimal.ZERO);
        }

        for (Pedido p : todayOrders) {
            if (p.getEstado() == EstadoPedido.ENTREGADO || p.getEstado() == EstadoPedido.LISTO) {
                int hour = p.getCreatedAt().getHour();
                String label = String.format("%02d:00", hour);
                hourlyMap.put(label, hourlyMap.get(label).add(p.getTotal()));
            }
        }

        List<GraficoLineaResponse> response = hourlyMap.entrySet().stream()
                .map(entry -> new GraficoLineaResponse(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        try {
            redisTemplate.opsForValue().set(KPI_VENTAS_TIEMPO_KEY, response, 10, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Error al guardar ventas por hora en Redis: {}", e.getMessage());
        }

        return response;
    }

    public List<GraficoBarrasResponse> getTopProductos() {
        try {
            @SuppressWarnings("unchecked")
            List<GraficoBarrasResponse> cached = (List<GraficoBarrasResponse>) redisTemplate.opsForValue().get(KPI_PRODUCTOS_TOP_KEY);
            if (cached != null) {
                log.info("Top productos obtenidos desde Redis Cache");
                return cached;
            }
        } catch (Exception e) {
            log.error("Error al leer caché de Redis para top productos: {}", e.getMessage());
        }

        log.info("Calculando top productos desde la base de datos");
        // Calcular para los últimos 30 días
        LocalDateTime start = LocalDateTime.now().minusDays(30);
        LocalDateTime end = LocalDateTime.now();

        List<Object[]> results = detallePedidoRepository.findTopProducts(start, end, PageRequest.of(0, 5));
        List<GraficoBarrasResponse> response = results.stream().map(row -> {
            Producto p = (Producto) row[0];
            Long qty = (Long) row[1];
            return new GraficoBarrasResponse(p.getNombre(), qty);
        }).collect(Collectors.toList());

        try {
            redisTemplate.opsForValue().set(KPI_PRODUCTOS_TOP_KEY, response, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Error al guardar top productos en Redis: {}", e.getMessage());
        }

        return response;
    }

    // Métodos de invalidación de caché
    public void invalidateAllCache() {
        try {
            redisTemplate.delete(KPI_RESUMEN_KEY);
            redisTemplate.delete(KPI_VENTAS_TIEMPO_KEY);
            redisTemplate.delete(KPI_PRODUCTOS_TOP_KEY);
            log.info("Caché completa de Dashboard invalidada");
        } catch (Exception e) {
            log.error("Error al invalidar caché de Redis: {}", e.getMessage());
        }
    }

    public void invalidateResumenAndVentas() {
        try {
            redisTemplate.delete(KPI_RESUMEN_KEY);
            redisTemplate.delete(KPI_VENTAS_TIEMPO_KEY);
            log.info("Caché de Resumen y Ventas-Tiempo invalidada");
        } catch (Exception e) {
            log.error("Error al invalidar caché de resumen/ventas: {}", e.getMessage());
        }
    }

    private BigDecimal calculatePercentageDifference(BigDecimal todayVal, BigDecimal yesterdayVal) {
        if (todayVal == null) todayVal = BigDecimal.ZERO;
        if (yesterdayVal == null || yesterdayVal.compareTo(BigDecimal.ZERO) == 0) {
            return todayVal.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return todayVal.subtract(yesterdayVal)
                .divide(yesterdayVal, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateAveragePrepTime(List<Pedido> orders) {
        List<Pedido> completed = orders.stream()
                .filter(p -> p.getEstado() == EstadoPedido.LISTO || p.getEstado() == EstadoPedido.ENTREGADO)
                .filter(p -> p.getCreatedAt() != null && p.getUpdatedAt() != null)
                .collect(Collectors.toList());

        if (completed.isEmpty()) {
            return 0.0;
        }

        return completed.stream()
                .mapToLong(p -> java.time.Duration.between(p.getCreatedAt(), p.getUpdatedAt()).toMinutes())
                .average()
                .orElse(0.0);
    }
}
