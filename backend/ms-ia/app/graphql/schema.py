from datetime import datetime
from enum import Enum
from typing import Optional

import strawberry
from strawberry.fastapi import GraphQLRouter

from app.services.segmentacion_clientes_service import (
    clasificar_cliente,
)
from app.services.tiempo_pedidos_service import (
    estimar_tiempo_pedido as predecir_tiempo_pedido,
)

from strawberry.types import Info

from app.core.security import (
    crear_contexto_graphql,
    requerir_usuario_graphql,
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


@strawberry.input
class SegmentacionClienteInput:
    cliente_id: int
    cantidad_pedidos: int
    ticket_promedio: float
    dias_desde_ultima_compra: int
    cantidad_pedidos_promocion: int


@strawberry.type
class SegmentacionClientePayload:
    cliente_id: int
    numero_segmento: int
    etiqueta_segmento: str
    origen_segmentacion: str
    cluster_kmeans: Optional[int]
    distancia_al_centroide: Optional[float]


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
        info: Info,
        input: TiempoPedidoInput,
    ) -> TiempoPedidoPayload:
        requerir_usuario_graphql(info)

        if input.cantidad_items <= 0:
            raise ValueError(
                "La cantidad de ítems debe ser mayor que cero."
            )

        if input.total_pedido < 0:
            raise ValueError(
                "El total del pedido no puede ser negativo."
            )

        if input.pedidos_pendientes < 0:
            raise ValueError(
                "Los pedidos pendientes no pueden ser negativos."
            )

        if input.distancia_km < 0:
            raise ValueError(
                "La distancia no puede ser negativa."
            )

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

    @strawberry.mutation(name="segmentarCliente")
    def segmentar_cliente(
        self,
        info: Info,
        input: SegmentacionClienteInput,
    ) -> SegmentacionClientePayload:
        requerir_usuario_graphql(info)

        if input.cliente_id <= 0:
            raise ValueError(
                "El ID del cliente debe ser mayor que cero."
            )

        resultado = clasificar_cliente(
            cantidad_pedidos=input.cantidad_pedidos,
            ticket_promedio=input.ticket_promedio,
            dias_desde_ultima_compra=(
                input.dias_desde_ultima_compra
            ),
            cantidad_pedidos_promocion=(
                input.cantidad_pedidos_promocion
            ),
        )

        return SegmentacionClientePayload(
            cliente_id=input.cliente_id,
            numero_segmento=resultado["numero_segmento"],
            etiqueta_segmento=resultado[
                "etiqueta_segmento"
            ],
            origen_segmentacion=resultado[
                "origen_segmentacion"
            ],
            cluster_kmeans=resultado[
                "cluster_kmeans"
            ],
            distancia_al_centroide=resultado[
                "distancia_al_centroide"
            ],
        )


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
)

graphql_router = GraphQLRouter(
    schema,
    context_getter=crear_contexto_graphql,
)