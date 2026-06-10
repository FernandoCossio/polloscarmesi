package com.restaurante.features.documento;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.restaurante.common.utils.ByteArrayMultipartFile;
import com.restaurante.domain.dtos.CierreCajaResponse;
import com.restaurante.domain.dtos.ProductoTopResponse;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoDocumento;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.Documento;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pago.PagoRepository;
import com.restaurante.features.pago.PagoSpecifications;
import com.restaurante.features.pedido.DetallePedidoRepository;
import com.restaurante.services.ImageStorageService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PdfReportService {

    private final PagoRepository pagoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final DocumentoRepository documentoRepository;
    private final ImageStorageService imageStorageService;
    private final TemplateEngine templateEngine;

    public PdfReportService(
            PagoRepository pagoRepository,
            DetallePedidoRepository detallePedidoRepository,
            DocumentoRepository documentoRepository,
            ImageStorageService imageStorageService,
            TemplateEngine templateEngine
    ) {
        this.pagoRepository = pagoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.documentoRepository = documentoRepository;
        this.imageStorageService = imageStorageService;
        this.templateEngine = templateEngine;
    }

    public String generateReciboPdf(Long pagoId) throws Exception {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new IllegalArgumentException("Pago no encontrado"));

        Context context = new Context();
        context.setVariable("pago", pago);
        context.setVariable("pedido", pago.getPedido());
        context.setVariable("detalles", pago.getPedido().getDetalles());

        String htmlContent = templateEngine.process("reportes/recibo", context);
        byte[] pdfBytes = renderPdf(htmlContent);

        String year = String.valueOf(LocalDate.now().getYear());
        String month = String.format("%02d", LocalDate.now().getMonthValue());
        String fileName = "recibo-" + pagoId + ".pdf";
        String s3Key = "documentos/" + year + "/" + month + "/" + fileName;

        return uploadAndRegister(pdfBytes, s3Key, fileName, "Recibo de Pago Individual #" + pagoId, TipoDocumento.RECIBO_PAGO);
    }

    public String generateConsolidadoVentasPdf(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago,
            Integer limite
    ) throws Exception {
        Specification<Pago> spec = PagoSpecifications.filterPagos(fechaInicio, fechaFin, tipoPedido, estadoPedido, metodoPago);
        List<Pago> pagos = pagoRepository.findAll(spec);
        if (limite != null && pagos.size() > limite) {
            pagos = pagos.subList(0, limite);
        }

        double totalAcumulado = pagos.stream()
                .mapToDouble(p -> p.getMontoTotal().doubleValue())
                .sum();

        Context context = new Context();
        context.setVariable("pagos", pagos);
        context.setVariable("totalAcumulado", totalAcumulado);
        context.setVariable("fechaInicio", fechaInicio != null ? fechaInicio.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Inicio");
        context.setVariable("fechaFin", fechaFin != null ? fechaFin.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Fin");

        String htmlContent = templateEngine.process("reportes/reporte_consolidado", context);
        byte[] pdfBytes = renderPdf(htmlContent);

        String year = String.valueOf(LocalDate.now().getYear());
        String month = String.format("%02d", LocalDate.now().getMonthValue());
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fileName = "reporte-ventas-" + timestamp + ".pdf";
        String s3Key = "documentos/" + year + "/" + month + "/" + fileName;

        return uploadAndRegister(pdfBytes, s3Key, fileName, "Reporte Consolidado de Ventas", TipoDocumento.REPORTE_ADMINISTRATIVO);
    }

    public String generateProductosTopPdf(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            Integer limite
    ) throws Exception {
        int actualLimit = limite != null ? limite : 10;
        List<Object[]> rawTop = detallePedidoRepository.findTopProducts(fechaInicio, fechaFin, PageRequest.of(0, actualLimit));

        List<ProductoTopResponse> topList = new ArrayList<>();
        int ranking = 1;
        for (Object[] row : rawTop) {
            Producto p = (Producto) row[0];
            Long totalQty = (Long) row[1];
            java.math.BigDecimal totalRecaudado = (java.math.BigDecimal) row[2];

            topList.add(new ProductoTopResponse(
                    ranking++,
                    p.getId(),
                    p.getNombre(),
                    p.getCategoria().getNombre(),
                    totalQty,
                    totalRecaudado
            ));
        }

        Context context = new Context();
        context.setVariable("productos", topList);
        context.setVariable("fechaInicio", fechaInicio != null ? fechaInicio.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Inicio");
        context.setVariable("fechaFin", fechaFin != null ? fechaFin.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Fin");

        String htmlContent = templateEngine.process("reportes/reporte_productos", context);
        byte[] pdfBytes = renderPdf(htmlContent);

        String year = String.valueOf(LocalDate.now().getYear());
        String month = String.format("%02d", LocalDate.now().getMonthValue());
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fileName = "reporte-productos-" + timestamp + ".pdf";
        String s3Key = "documentos/" + year + "/" + month + "/" + fileName;

        return uploadAndRegister(pdfBytes, s3Key, fileName, "Reporte de Productos Top", TipoDocumento.REPORTE_ADMINISTRATIVO);
    }

    public String generateCierreCajaPdf(CierreCajaResponse cierre) throws Exception {
        Context context = new Context();
        context.setVariable("cierre", cierre);

        String htmlContent = templateEngine.process("reportes/cierre_caja", context);
        byte[] pdfBytes = renderPdf(htmlContent);

        String year = String.valueOf(LocalDate.now().getYear());
        String month = String.format("%02d", LocalDate.now().getMonthValue());
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fileName = "cierre-caja-" + timestamp + ".pdf";
        String s3Key = "documentos/" + year + "/" + month + "/" + fileName;

        return uploadAndRegister(pdfBytes, s3Key, fileName, "Cierre de Caja", TipoDocumento.CIERRE_CAJA);
    }

    private byte[] renderPdf(String htmlContent) throws Exception {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, "/");
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        }
    }

    private String uploadAndRegister(byte[] pdfBytes, String s3Key, String fileName, String reportName, TipoDocumento tipo) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(pdfBytes);
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        String hashHex = hexString.toString();

        ByteArrayMultipartFile file = new ByteArrayMultipartFile(pdfBytes, "file", fileName, "application/pdf");
        String fileUrl = imageStorageService.store(file, s3Key);

        Documento doc = new Documento();
        doc.setNombre(reportName);
        doc.setS3Key(s3Key);
        doc.setUrl(fileUrl);
        doc.setTipo(tipo);
        doc.setHash(hashHex);
        documentoRepository.save(doc);

        return imageStorageService.generatePresignedUrl(s3Key);
    }
}
