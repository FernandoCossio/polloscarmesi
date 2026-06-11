package com.restaurante.features.dashboard;

import com.restaurante.domain.dtos.DashboardResumenResponse;
import com.restaurante.domain.dtos.GraficoBarrasResponse;
import com.restaurante.domain.dtos.GraficoLineaResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardRestController {

    private final DashboardService dashboardService;

    public DashboardRestController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<DashboardResumenResponse> getResumenKPIs() {
        return ResponseEntity.ok(dashboardService.getResumenKPIs());
    }

    @GetMapping("/ventas-tiempo")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<List<GraficoLineaResponse>> getVentasPorHora() {
        return ResponseEntity.ok(dashboardService.getVentasPorHora());
    }

    @GetMapping("/productos-top")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<List<GraficoBarrasResponse>> getTopProductos() {
        return ResponseEntity.ok(dashboardService.getTopProductos());
    }
}
