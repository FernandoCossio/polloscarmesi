package com.restaurante.features.pago;

import com.restaurante.domain.dtos.PagoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/pagos")
public class PagoRestController {

    private final PagoService pagoService;

    public PagoRestController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping("/{id}/comprobante")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_CLIENTE')")
    public ResponseEntity<PagoResponse> subirComprobante(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        PagoResponse response = pagoService.uploadComprobante(id, file);
        return ResponseEntity.ok(response);
    }
}
