package com.restaurante.features.documento;

import com.restaurante.domain.dtos.ProductoTopResponse;
import com.restaurante.domain.dtos.CierreCajaResponse;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pago.PagoRepository;
import com.restaurante.features.pago.PagoSpecifications;
import com.restaurante.features.pedido.DetallePedidoRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelReportService {

    private final PagoRepository pagoRepository;
    private final DetallePedidoRepository detallePedidoRepository;

    public ExcelReportService(PagoRepository pagoRepository, DetallePedidoRepository detallePedidoRepository) {
        this.pagoRepository = pagoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
    }

    public ByteArrayInputStream generateConsolidadoVentas(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago,
            Integer limite
    ) throws IOException {
        Specification<Pago> spec = PagoSpecifications.filterPagos(fechaInicio, fechaFin, tipoPedido, estadoPedido, metodoPago);
        List<Pago> pagos = pagoRepository.findAll(spec);
        if (limite != null && pagos.size() > limite) {
            pagos = pagos.subList(0, limite);
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Consolidado de Ventas");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle moneyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            moneyStyle.setDataFormat(format.getFormat("$#,##0.00"));

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(format.getFormat("yyyy-mm-dd hh:mm:ss"));

            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID Pago", "Fecha", "Tipo Pedido", "Método Pago", "Estado", "Monto Total", "Ficha"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Pago pago : pagos) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(pago.getId());

                Cell dateCell = row.createCell(1);
                if (pago.getCreatedAt() != null) {
                    dateCell.setCellValue(pago.getCreatedAt());
                    dateCell.setCellStyle(dateStyle);
                }

                row.createCell(2).setCellValue(pago.getPedido().getTipo().name());
                row.createCell(3).setCellValue(pago.getMetodo().name());
                row.createCell(4).setCellValue(pago.getEstado().name());

                Cell totalCell = row.createCell(5);
                totalCell.setCellValue(pago.getMontoTotal().doubleValue());
                totalCell.setCellStyle(moneyStyle);

                row.createCell(6).setCellValue(pago.getPedido().getNumeroFicha() != null ? pago.getPedido().getNumeroFicha() : "");
            }

            Row totalRow = sheet.createRow(rowIdx);
            Cell totalLabelCell = totalRow.createCell(4);
            totalLabelCell.setCellValue("TOTAL:");
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            CellStyle boldStyle = workbook.createCellStyle();
            boldStyle.setFont(boldFont);
            totalLabelCell.setCellStyle(boldStyle);

            Cell sumCell = totalRow.createCell(5);
            sumCell.setCellFormula("SUM(F2:F" + rowIdx + ")");
            sumCell.setCellStyle(moneyStyle);
            CellStyle moneyBoldStyle = workbook.createCellStyle();
            moneyBoldStyle.cloneStyleFrom(moneyStyle);
            moneyBoldStyle.setFont(boldFont);
            sumCell.setCellStyle(moneyBoldStyle);

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateProductosTop(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            Integer limite
    ) throws IOException {
        int actualLimit = limite != null ? limite : 10;
        List<Object[]> rawTop = detallePedidoRepository.findTopProducts(fechaInicio, fechaFin, PageRequest.of(0, actualLimit));

        List<ProductoTopResponse> list = new ArrayList<>();
        int ranking = 1;
        for (Object[] row : rawTop) {
            Producto p = (Producto) row[0];
            Long totalQty = (Long) row[1];
            BigDecimal totalRecaudado = (BigDecimal) row[2];

            list.add(new ProductoTopResponse(
                    ranking++,
                    p.getId(),
                    p.getNombre(),
                    p.getCategoria().getNombre(),
                    totalQty,
                    totalRecaudado
            ));
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Top Productos");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle moneyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            moneyStyle.setDataFormat(format.getFormat("$#,##0.00"));

            Row headerRow = sheet.createRow(0);
            String[] columns = {"Ranking", "ID Producto", "Nombre", "Categoría", "Cantidad Vendida", "Total Recaudado"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (ProductoTopResponse item : list) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(item.getRanking());
                row.createCell(1).setCellValue(item.getIdProducto());
                row.createCell(2).setCellValue(item.getNombre());
                row.createCell(3).setCellValue(item.getCategoria());
                row.createCell(4).setCellValue(item.getCantidadVendida());

                Cell priceCell = row.createCell(5);
                priceCell.setCellValue(item.getTotalRecaudado().doubleValue());
                priceCell.setCellStyle(moneyStyle);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateCierreCaja(CierreCajaResponse cierre) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Cierre de Caja");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            DataFormat format = workbook.createDataFormat();

            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(format.getFormat("$#,##0.00"));

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(format.getFormat("yyyy-mm-dd hh:mm:ss"));

            int rowIdx = 0;

            Row titleRow = sheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("CIERRE DE CAJA");
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            rowIdx++;

            Row headerRow = sheet.createRow(rowIdx++);
            String[] columns = {"Campo", "Valor"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            rowIdx = addKeyValue(sheet, rowIdx, "Fecha inicio", cierre.getFechaInicio(), dateStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Fecha fin", cierre.getFechaFin(), dateStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Generado en", cierre.getGeneradoEn(), dateStyle);

            rowIdx++;

            rowIdx = addKeyValue(sheet, rowIdx, "Cantidad pagos (total)", cierre.getCantidadPagos(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Total ventas (total)", cierre.getTotalVentas(), moneyStyle);

            rowIdx++;

            rowIdx = addKeyValue(sheet, rowIdx, "Cantidad pagos ACEPTADO", cierre.getCantidadPagosAceptados(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Total ventas ACEPTADO", cierre.getTotalVentasAceptadas(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Cantidad pagos PENDIENTE", cierre.getCantidadPagosPendientes(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Total ventas PENDIENTE", cierre.getTotalVentasPendientes(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Cantidad pagos RECHAZADO", cierre.getCantidadPagosRechazados(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Total ventas RECHAZADO", cierre.getTotalVentasRechazadas(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Cantidad pagos REVISION_MANUAL", cierre.getCantidadPagosRevisionManual(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Total ventas REVISION_MANUAL", cierre.getTotalVentasRevisionManual(), moneyStyle);

            rowIdx++;

            rowIdx = addKeyValue(sheet, rowIdx, "Pagos EFECTIVO (ACEPTADO)", cierre.getCantidadPagosEfectivoAceptados(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Ventas EFECTIVO (ACEPTADO)", cierre.getTotalVentasEfectivoAceptadas(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Efectivo neto ingresado", cierre.getEfectivoNetoIngresado(), moneyStyle);

            rowIdx = addKeyValue(sheet, rowIdx, "Pagos QR (ACEPTADO)", cierre.getCantidadPagosQrAceptados(), null);
            rowIdx = addKeyValue(sheet, rowIdx, "Ventas QR (ACEPTADO)", cierre.getTotalVentasQrAceptadas(), moneyStyle);

            rowIdx++;

            rowIdx = addKeyValue(sheet, rowIdx, "Saldo inicial", cierre.getSaldoInicial(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Efectivo esperado en caja", cierre.getEfectivoEsperadoEnCaja(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Efectivo contado", cierre.getEfectivoContado(), moneyStyle);
            rowIdx = addKeyValue(sheet, rowIdx, "Diferencia efectivo", cierre.getDiferenciaEfectivo(), moneyStyle);

            for (int i = 0; i < 2; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private int addKeyValue(Sheet sheet, int rowIdx, String key, Object value, CellStyle valueStyle) {
        Row row = sheet.createRow(rowIdx++);
        row.createCell(0).setCellValue(key);

        Cell valueCell = row.createCell(1);
        if (value == null) {
            valueCell.setCellValue("");
            return rowIdx;
        }

        if (value instanceof LocalDateTime dt) {
            valueCell.setCellValue(dt);
        } else if (value instanceof BigDecimal bd) {
            valueCell.setCellValue(bd.doubleValue());
        } else if (value instanceof Number n) {
            valueCell.setCellValue(n.doubleValue());
        } else {
            valueCell.setCellValue(String.valueOf(value));
        }

        if (valueStyle != null) {
            valueCell.setCellStyle(valueStyle);
        }

        return rowIdx;
    }
}
