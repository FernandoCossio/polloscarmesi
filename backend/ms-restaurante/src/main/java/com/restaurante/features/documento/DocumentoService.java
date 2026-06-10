package com.restaurante.features.documento;

import com.restaurante.domain.dtos.CierreCajaResponse;
import com.restaurante.domain.dtos.PagoReporteResponse;
import com.restaurante.domain.dtos.ProductoTopResponse;
import com.restaurante.domain.enums.EstadoPago;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pago.PagoRepository;
import com.restaurante.features.pago.PagoSpecifications;
import com.restaurante.features.pedido.DetallePedidoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class DocumentoService {

    public record ExcelReportResult(ByteArrayInputStream stream, String fileName) {
    }

    private final ExcelReportService excelReportService;
    private final PdfReportService pdfReportService;
    private final PagoRepository pagoRepository;
    private final DetallePedidoRepository detallePedidoRepository;

    public DocumentoService(
            ExcelReportService excelReportService,
            PdfReportService pdfReportService,
            PagoRepository pagoRepository,
            DetallePedidoRepository detallePedidoRepository
    ) {
        this.excelReportService = excelReportService;
        this.pdfReportService = pdfReportService;
        this.pagoRepository = pagoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
    }

    @Transactional(readOnly = true)
    public ExcelReportResult generateExcelReport(
            String fechaInicioStr,
            String fechaFinStr,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago,
            Integer limite,
            String tipoReporte
    ) throws IOException {
        LocalDateTime fechaInicio = parseDateTime(fechaInicioStr);
        LocalDateTime fechaFin = parseDateTime(fechaFinStr);

        if ("productos".equalsIgnoreCase(tipoReporte)) {
            return new ExcelReportResult(
                    excelReportService.generateProductosTop(fechaInicio, fechaFin, limite),
                    "reporte-productos.xlsx"
            );
        }

        return new ExcelReportResult(
                excelReportService.generateConsolidadoVentas(fechaInicio, fechaFin, tipoPedido, estadoPedido, metodoPago, limite),
                "reporte-ventas.xlsx"
        );
    }

    public String generatePdfReport(
            String fechaInicioStr,
            String fechaFinStr,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago,
            Integer limite,
            String tipoReporte
    ) throws Exception {
        LocalDateTime fechaInicio = parseDateTime(fechaInicioStr);
        LocalDateTime fechaFin = parseDateTime(fechaFinStr);

        if ("productos".equalsIgnoreCase(tipoReporte)) {
            return pdfReportService.generateProductosTopPdf(fechaInicio, fechaFin, limite);
        }

        return pdfReportService.generateConsolidadoVentasPdf(fechaInicio, fechaFin, tipoPedido, estadoPedido, metodoPago, limite);
    }

    public String generateReciboIndividual(Long pagoId) throws Exception {
        return pdfReportService.generateReciboPdf(pagoId);
    }

    @Transactional(readOnly = true)
    public List<PagoReporteResponse> getReportData(
            String fechaInicioStr,
            String fechaFinStr,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago,
            Integer limite
    ) {
        LocalDateTime fechaInicio = parseDateTime(fechaInicioStr);
        LocalDateTime fechaFin = parseDateTime(fechaFinStr);

        Specification<Pago> spec = PagoSpecifications.filterPagos(fechaInicio, fechaFin, tipoPedido, estadoPedido, metodoPago);
        List<Pago> pagos = pagoRepository.findAll(spec);
        if (limite != null && pagos.size() > limite) {
            pagos = pagos.subList(0, limite);
        }

        return pagos.stream().map(pago -> new PagoReporteResponse(
                pago.getId(),
                pago.getCreatedAt(),
                pago.getPedido().getTipo().name(),
                pago.getMetodo().name(),
                pago.getEstado().name(),
                pago.getMontoTotal(),
                pago.getPedido().getNumeroFicha()
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoTopResponse> getProductosTopData(
            String fechaInicioStr,
            String fechaFinStr,
            Integer limite
    ) {
        LocalDateTime fechaInicio = parseDateTime(fechaInicioStr);
        LocalDateTime fechaFin = parseDateTime(fechaFinStr);

        int actualLimit = limite != null ? limite : 10;
        List<Object[]> rawTop = detallePedidoRepository.findTopProducts(fechaInicio, fechaFin, PageRequest.of(0, actualLimit));

        List<ProductoTopResponse> list = new java.util.ArrayList<>();
        int ranking = 1;
        for (Object[] row : rawTop) {
            Producto p = (Producto) row[0];
            Long totalQty = (Long) row[1];
            java.math.BigDecimal totalRecaudado = (java.math.BigDecimal) row[2];

            list.add(new ProductoTopResponse(
                    ranking++,
                    p.getId(),
                    p.getNombre(),
                    p.getCategoria().getNombre(),
                    totalQty,
                    totalRecaudado
            ));
        }
        return list;
    }

    @Transactional(readOnly = true)
    public CierreCajaResponse getCierreCajaData(
            String fechaInicioStr,
            String fechaFinStr,
            BigDecimal saldoInicial,
            BigDecimal efectivoContado
    ) {
        LocalDateTime fechaInicio = parseDateTime(fechaInicioStr);
        LocalDateTime fechaFin = parseDateTime(fechaFinStr);

        if (fechaInicio == null && fechaFin == null) {
            fechaInicio = LocalDate.now().atStartOfDay();
            fechaFin = LocalDateTime.now();
        } else if (fechaInicio == null) {
            fechaInicio = fechaFin.toLocalDate().atStartOfDay();
        } else if (fechaFin == null) {
            fechaFin = LocalDateTime.now();
        }

        BigDecimal saldo = saldoInicial != null ? saldoInicial : BigDecimal.ZERO;

        Specification<Pago> spec = PagoSpecifications.filterPagosCaja(fechaInicio, fechaFin, null, null);
        List<Pago> pagos = pagoRepository.findAll(spec);

        long cantidadPagos = pagos.size();

        long cantAceptado = 0;
        long cantPendiente = 0;
        long cantRechazado = 0;
        long cantRevision = 0;

        BigDecimal totalVentas = BigDecimal.ZERO;
        BigDecimal totalAceptado = BigDecimal.ZERO;
        BigDecimal totalPendiente = BigDecimal.ZERO;
        BigDecimal totalRechazado = BigDecimal.ZERO;
        BigDecimal totalRevision = BigDecimal.ZERO;

        long cantEfectivoAceptado = 0;
        long cantQrAceptado = 0;
        BigDecimal totalEfectivoAceptado = BigDecimal.ZERO;
        BigDecimal totalQrAceptado = BigDecimal.ZERO;
        BigDecimal efectivoNetoIngresado = BigDecimal.ZERO;

        for (Pago pago : pagos) {
            BigDecimal montoTotal = pago.getMontoTotal() != null ? pago.getMontoTotal() : BigDecimal.ZERO;
            totalVentas = totalVentas.add(montoTotal);

            EstadoPago estado = pago.getEstado();
            if (estado == EstadoPago.ACEPTADO) {
                cantAceptado++;
                totalAceptado = totalAceptado.add(montoTotal);

                if (pago.getMetodo() == MetodoPago.EFECTIVO) {
                    cantEfectivoAceptado++;
                    totalEfectivoAceptado = totalEfectivoAceptado.add(montoTotal);

                    BigDecimal recibido = pago.getMontoRecibido() != null ? pago.getMontoRecibido() : BigDecimal.ZERO;
                    BigDecimal cambio = pago.getCambio() != null ? pago.getCambio() : BigDecimal.ZERO;
                    efectivoNetoIngresado = efectivoNetoIngresado.add(recibido.subtract(cambio));
                } else if (pago.getMetodo() == MetodoPago.QR) {
                    cantQrAceptado++;
                    totalQrAceptado = totalQrAceptado.add(montoTotal);
                }
            } else if (estado == EstadoPago.PENDIENTE) {
                cantPendiente++;
                totalPendiente = totalPendiente.add(montoTotal);
            } else if (estado == EstadoPago.RECHAZADO) {
                cantRechazado++;
                totalRechazado = totalRechazado.add(montoTotal);
            } else if (estado == EstadoPago.REVISION_MANUAL) {
                cantRevision++;
                totalRevision = totalRevision.add(montoTotal);
            }
        }

        BigDecimal efectivoEsperadoEnCaja = saldo.add(efectivoNetoIngresado);
        BigDecimal diferenciaEfectivo = efectivoContado != null ? efectivoContado.subtract(efectivoEsperadoEnCaja) : null;

        return new CierreCajaResponse(
                fechaInicio,
                fechaFin,
                LocalDateTime.now(),
                cantidadPagos,
                totalVentas,
                cantAceptado,
                totalAceptado,
                cantPendiente,
                totalPendiente,
                cantRechazado,
                totalRechazado,
                cantRevision,
                totalRevision,
                cantEfectivoAceptado,
                totalEfectivoAceptado,
                efectivoNetoIngresado,
                cantQrAceptado,
                totalQrAceptado,
                saldo,
                efectivoEsperadoEnCaja,
                efectivoContado,
                diferenciaEfectivo
        );
    }

    @Transactional(readOnly = true)
    public ExcelReportResult generateCierreCajaExcel(
            String fechaInicioStr,
            String fechaFinStr,
            BigDecimal saldoInicial,
            BigDecimal efectivoContado
    ) throws IOException {
        CierreCajaResponse cierre = getCierreCajaData(fechaInicioStr, fechaFinStr, saldoInicial, efectivoContado);
        return new ExcelReportResult(excelReportService.generateCierreCaja(cierre), "cierre-caja.xlsx");
    }

    @Transactional(readOnly = true)
    public String generateCierreCajaPdf(
            String fechaInicioStr,
            String fechaFinStr,
            BigDecimal saldoInicial,
            BigDecimal efectivoContado
    ) throws Exception {
        CierreCajaResponse cierre = getCierreCajaData(fechaInicioStr, fechaFinStr, saldoInicial, efectivoContado);
        return pdfReportService.generateCierreCajaPdf(cierre);
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr + "T00:00:00", DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                return null;
            }
        }
    }
}
