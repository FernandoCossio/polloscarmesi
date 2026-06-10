package com.restaurante.features.pago;

import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.EstadoPago;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.Pago;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class PagoSpecifications {

    public static Specification<Pago> filterPagos(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            TipoPedido tipoPedido,
            EstadoPedido estadoPedido,
            MetodoPago metodoPago
    ) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                root.fetch("pedido", JoinType.LEFT);
                query.distinct(true);
            }

            if (fechaInicio != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), fechaInicio));
            }
            if (fechaFin != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), fechaFin));
            }
            if (tipoPedido != null || estadoPedido != null) {
                Join<Object, Object> pedidoJoin = root.join("pedido");
                if (tipoPedido != null) {
                    predicate = cb.and(predicate, cb.equal(pedidoJoin.get("tipo"), tipoPedido));
                }
                if (estadoPedido != null) {
                    predicate = cb.and(predicate, cb.equal(pedidoJoin.get("estado"), estadoPedido));
                }
            }
            if (metodoPago != null) {
                predicate = cb.and(predicate, cb.equal(root.get("metodo"), metodoPago));
            }

            return predicate;
        };
    }

    public static Specification<Pago> filterPagosCaja(
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            MetodoPago metodoPago,
            EstadoPago estadoPago
    ) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (fechaInicio != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), fechaInicio));
            }
            if (fechaFin != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), fechaFin));
            }
            if (metodoPago != null) {
                predicate = cb.and(predicate, cb.equal(root.get("metodo"), metodoPago));
            }
            if (estadoPago != null) {
                predicate = cb.and(predicate, cb.equal(root.get("estado"), estadoPago));
            }

            return predicate;
        };
    }
}
