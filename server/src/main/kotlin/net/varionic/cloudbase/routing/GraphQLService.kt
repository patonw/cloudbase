package net.varionic.cloudbase.routing

import graphql.ExecutionInput
import graphql.GraphQL
import graphql.schema.GraphQLSchema
import graphql.schema.idl.RuntimeWiring
import graphql.schema.idl.SchemaGenerator
import graphql.schema.idl.TypeDefinitionRegistry
import io.ktor.application.call
import io.ktor.http.content.defaultResource
import io.ktor.http.content.resources
import io.ktor.http.content.static
import io.ktor.request.receive
import io.ktor.response.respond
import io.ktor.routing.Routing
import io.ktor.routing.post
import io.ktor.routing.route
import org.koin.ktor.ext.inject

interface GraphQLService {
    val engine: GraphQL
    val schema: String
    fun execute(req: GraphQLRequest) = engine.execute(req)
}

fun Routing.graphiql() {
    static("graphiql") {
        resources("graphiql/")
        defaultResource("graphiql/index.html")
    }
}

fun Routing.graphql() {
    val gqlService: GraphQLService by inject()
    route("graphql") {
        post {
            val req = call.receive<GraphQLRequest>()
            val result = gqlService.execute(req)
            call.respond(result.toSpecification())
        }
    }
}

// Convenience extension to hide some indirection in the graphql-java API
fun TypeDefinitionRegistry.wiring(block: RuntimeWiring.Builder.() -> Unit): GraphQLSchema {
    val wiring = RuntimeWiring.newRuntimeWiring().apply(block).build()
    return SchemaGenerator().makeExecutableSchema(this, wiring)
}

/**
 * Data class for deserializing a GraphQL request
 *
 * @param operationName Optional. Convenient name to identify the query across client and server
 * @param query Static body of the query with uninterpolated placeholder variables
 * @param variables Concrete values for any placeholders in the query
 *
 * Any dynamic data in the request should be transmitted through variables. The client
 * should not interpolate user data into the query body itself.
 */
data class GraphQLRequest(val operationName: String?, val query: String, val variables: Map<String,Any>?)

/**
 * Extension method to execute a deserialized GraphQL request
 */
fun GraphQL.execute(req: GraphQLRequest) = with (ExecutionInput.newExecutionInput()) {
    query(req.query)
    req.operationName?.let { operationName(it) }
    req.variables?.let { variables(it) }
    execute(build())
}
