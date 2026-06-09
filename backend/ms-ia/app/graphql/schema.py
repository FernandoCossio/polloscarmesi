import strawberry
from strawberry.fastapi import GraphQLRouter


@strawberry.type
class Query:
    @strawberry.field(name="estadoMsia")
    async def estado_msia(self) -> str:
        return "Microservicio de IA operativo"


schema = strawberry.Schema(query=Query)

graphql_router = GraphQLRouter(schema)