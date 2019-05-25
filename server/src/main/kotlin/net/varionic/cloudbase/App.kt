/*
 * This Kotlin source file was generated by the Gradle 'init' task.
 */
package net.varionic.cloudbase

import io.ktor.application.Application
import io.ktor.application.install
import io.ktor.features.ContentNegotiation
import io.ktor.gson.gson
import io.ktor.http.content.defaultResource
import io.ktor.http.content.resources
import io.ktor.http.content.static
import io.ktor.routing.routing
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import net.varionic.cloudbase.mock.MockWorkbookSevice
import org.koin.dsl.module
import org.koin.ktor.ext.Koin

fun Application.main() {
    val myModule = module {
        single { MockWorkbookSevice() as GraphQLService }
    }

    install(Koin) {
        modules(myModule)
    }

    install(ContentNegotiation) {
        gson {
            setPrettyPrinting()
            serializeNulls()
        }
    }
    routing {
        static("/") {
            resources("/")
            defaultResource("index.html")
        }
        graphiql()
        graphql()
    }
}

fun main(args: Array<String>) {
    embeddedServer(Netty, port = 8080, module = Application::main)
            .start(true)
}
