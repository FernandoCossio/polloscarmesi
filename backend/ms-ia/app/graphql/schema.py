from datetime import datetime
from enum import Enum

import strawberry
from strawberry.fastapi import GraphQLRouter

from app.services.tiempo_pedidos_service import (
    estimar_tiempo_pedido as predecir_tiempo_pedido,
)


@strawberry.enum
class TipoPedido(Enum):
    PRESENCIAL = "PRESENCIAL"
    PARA_LLEVAR = "PARA_LLEVAR"
    DELIVERY = "DELIVERY"


@strawberry.enum
class RequiereCoccion(Enum):
    SI = "SI"
    NO = "NO"


@strawberry.input
class TiempoPedidoInput:
    fecha_hora_pedido: datetime
    cantidad_items: int
    total_pedido: float
    pedidos_pendientes: int
    tipo_pedido: TipoPedido
    distancia_km: float
    requiere_coccion: RequiereCoccion


@strawberry.type
class TiempoPedidoPayload:
    tiempo_estimado_min: float
    tipo_pedido: TipoPedido
    requiere_coccion: RequiereCoccion


@strawberry.type
class Query:
    @strawberry.field(name="estadoMsia")
    async def estado_msia(self) -> str:
        return "Microservicio de IA operativo"


@strawberry.type
class Mutation:
    @strawberry.mutation(name="estimarTiempoPedido")
    def estimar_tiempo_pedido(
        self,
        input: TiempoPedidoInput,
    ) -> TiempoPedidoPayload:
        if input.cantidad_items <= 0:
            raise ValueError("La cantidad de ítems debe ser mayor que cero.")

        if input.total_pedido < 0:
            raise ValueError("El total del pedido no puede ser negativo.")

        if input.pedidos_pendientes < 0:
            raise ValueError("Los pedidos pendientes no pueden ser negativos.")

        if input.distancia_km < 0:
            raise ValueError("La distancia no puede ser negativa.")

        tiempo_estimado = predecir_tiempo_pedido(
            fecha_hora_pedido=input.fecha_hora_pedido,
            cantidad_items=input.cantidad_items,
            total_pedido=input.total_pedido,
            pedidos_pendientes=input.pedidos_pendientes,
            tipo_pedido=input.tipo_pedido.value,
            distancia_km=input.distancia_km,
            requiere_coccion=input.requiere_coccion.value,
        )

        return TiempoPedidoPayload(
            tiempo_estimado_min=tiempo_estimado,
            tipo_pedido=input.tipo_pedido,
            requiere_coccion=input.requiere_coccion,
        )


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
)

graphql_router = GraphQLRouter(schema)