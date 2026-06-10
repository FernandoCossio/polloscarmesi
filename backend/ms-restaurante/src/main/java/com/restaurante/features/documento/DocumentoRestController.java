package com.restaurante.features.documento;

import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoPedido;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.restaurante.domain.dtos.CierreCajaResponse;
import com.restaurante.domain.dtos.PagoReporteResponse;
import com.restaurante.domain.dtos.ProductoTopResponse;

import java.math.BigDecimal;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/documentos")
public class DocumentoRestController {

    private final DocumentoService documentoService;

    public DocumentoRestController(
            DocumentoService documentoService
    ) {
        this.documentoService = documentoService;
    }

    @GetMapping("/reportes/excel")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<InputStreamResource> downloadExcelReport(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "tipoPedido", required = false) TipoPedido tipoPedido,
            @RequestParam(value = "estadoPedido", required = false) EstadoPedido estadoPedido,
            @RequestParam(value = "metodoPago", required = false) MetodoPago metodoPago,
            @RequestParam(value = "limite", required = false) Integer limite,
            @RequestParam(value = "tipoReporte", defaultValue = "ventas") String tipoReporte
    ) throws IOException {
        DocumentoService.ExcelReportResult report = documentoService.generateExcelReport(
                fechaInicioStr,
                fechaFinStr,
                tipoPedido,
                estadoPedido,
                metodoPago,
                limite,
                tipoReporte
        );

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + report.fileName());

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(report.stream()));
    }

    @GetMapping("/reportes/pdf")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> generatePdfReport(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "tipoPedido", required = false) TipoPedido tipoPedido,
            @RequestParam(value = "estadoPedido", required = false) EstadoPedido estadoPedido,
            @RequestParam(value = "metodoPago", required = false) MetodoPago metodoPago,
            @RequestParam(value = "limite", required = false) Integer limite,
            @RequestParam(value = "tipoReporte", defaultValue = "ventas") String tipoReporte
    ) throws Exception {
        String presignedUrl = documentoService.generatePdfReport(
                fechaInicioStr,
                fechaFinStr,
                tipoPedido,
                estadoPedido,
                metodoPago,
                limite,
                tipoReporte
        );

        return ResponseEntity.ok(Map.of("url", presignedUrl));
    }

    @GetMapping("/recibos/{pagoId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_CLIENTE')")
    public ResponseEntity<Map<String, String>> generateReciboIndividual(@PathVariable Long pagoId) throws Exception {
        String presignedUrl = documentoService.generateReciboIndividual(pagoId);
        return ResponseEntity.ok(Map.of("url", presignedUrl));
    }

    @GetMapping("/reportes/datos")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<List<PagoReporteResponse>> getReportData(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "tipoPedido", required = false) TipoPedido tipoPedido,
            @RequestParam(value = "estadoPedido", required = false) EstadoPedido estadoPedido,
            @RequestParam(value = "metodoPago", required = false) MetodoPago metodoPago,
            @RequestParam(value = "limite", required = false) Integer limite
    ) {
        return ResponseEntity.ok(documentoService.getReportData(
                fechaInicioStr,
                fechaFinStr,
                tipoPedido,
                estadoPedido,
                metodoPago,
                limite
        ));
    }

    @GetMapping("/reportes/productos/datos")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<List<ProductoTopResponse>> getProductosTopData(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "limite", required = false) Integer limite
    ) {
        return ResponseEntity.ok(documentoService.getProductosTopData(fechaInicioStr, fechaFinStr, limite));
    }

    @GetMapping("/reportes/cierre-caja/datos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public ResponseEntity<CierreCajaResponse> getCierreCajaData(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "saldoInicial", required = false, defaultValue = "0") BigDecimal saldoInicial,
            @RequestParam(value = "efectivoContado", required = false) BigDecimal efectivoContado
    ) {
        return ResponseEntity.ok(documentoService.getCierreCajaData(
                fechaInicioStr,
                fechaFinStr,
                saldoInicial,
                efectivoContado
        ));
    }

    @GetMapping("/reportes/cierre-caja/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public ResponseEntity<InputStreamResource> downloadCierreCajaExcel(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "saldoInicial", required = false, defaultValue = "0") BigDecimal saldoInicial,
            @RequestParam(value = "efectivoContado", required = false) BigDecimal efectivoContado
    ) throws IOException {
        DocumentoService.ExcelReportResult report = documentoService.generateCierreCajaExcel(
                fechaInicioStr,
                fechaFinStr,
                saldoInicial,
                efectivoContado
        );

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + report.fileName());

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(report.stream()));
    }

    @GetMapping("/reportes/cierre-caja/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public ResponseEntity<Map<String, String>> generateCierreCajaPdf(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicioStr,
            @RequestParam(value = "fechaFin", required = false) String fechaFinStr,
            @RequestParam(value = "saldoInicial", required = false, defaultValue = "0") BigDecimal saldoInicial,
            @RequestParam(value = "efectivoContado", required = false) BigDecimal efectivoContado
    ) throws Exception {
        String presignedUrl = documentoService.generateCierreCajaPdf(
                fechaInicioStr,
                fechaFinStr,
                saldoInicial,
                efectivoContado
        );
        return ResponseEntity.ok(Map.of("url", presignedUrl));
    }
}
