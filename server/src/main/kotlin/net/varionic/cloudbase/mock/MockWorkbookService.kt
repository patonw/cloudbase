package net.varionic.cloudbase.mock

import com.google.gson.Gson
import graphql.GraphQL
import graphql.schema.idl.SchemaParser
import net.varionic.cloudbase.*

val vegaSpec = """
{
  "${'$'}schema": "https://vega.github.io/schema/vega-lite/v3.json",
  "description": "A simple bar chart with embedded data.",
  "mark": "bar",
  "encoding": {
    "x": {"field": "first", "type": "ordinal"},
    "y": {"field": "second", "type": "quantitative"}
  }
}
""".trimIndent()

val allWorkbooks = listOf(
        Workbook(nextUUID(), "Bookish", listOf(
                Worksheet(nextUUID(), "foobar", listOf(
                        CodeCell(nextUUID(), """import kotlin.random.Random"""),
                        CodeCell(nextUUID(), """data class Foo(val x: Int, val y: Int)"""),
                        CodeCell(nextUUID(), """Foo(5,10)"""),
                        CodeCell(nextUUID(), """import kotlin.random.Random"""),
                        GraphCell(nextUUID(), """(1..100).map { (it to (Random.nextInt() % 100 + 100) % 100) }""", vegaSpec)
                )),

                Worksheet(nextUUID(), "hello", listOf(
                        CodeCell(nextUUID(), """listOf(5, 4, 9, 13)"""),
                        CodeCell(nextUUID(), """data class World(val x: Int, val y: Int)"""),
                        CodeCell(nextUUID(), """World(5,10)""")
                ))
        ))
)

val allContexts = allWorkbooks.flatMap { it.sheets }.map {
    SheetContext(nextUUID(), it)
}

class MockWorkbookSevice: WorkbookService {
    override val engine by lazy {

        val registry = SchemaParser().parse(WorkbookGraphQLSchema)
        val gson = Gson()

        // Bind lambdas to schema operations
        val wiredSchema = registry.wiring {
            type("Query") {
                it.dataFetcher("allWorkbooks") {
                    allWorkbooks
                }

                it.dataFetcher("allProcesses") {
                    allContexts
                }


                it.dataFetcher("worksheet") { env ->
                    val sheetId = env.getArgument<String>("sheetId")
                    allWorkbooks
                            .flatMap { it.sheets }
                            .find { it.uuid == sheetId}
                }
            }

            type("Mutation") {
                // Adds a new server into the mock database
                it.dataFetcher("executeCell") { env ->
                    val args = env.arguments
                    val ctxId = args["processId"] as String
                    val cellId = args["cellId"] as String

                    // TODO error handling
                    val context = allContexts.find { it.uuid == ctxId }
                    context?.executeCell(cellId)
                }
                it.dataFetcher("setCellScript") { env ->
                    val args = env.arguments
                    val cellId = args["cellId"] as String
                    val script = args["script"] as String

                    val cell = allWorkbooks
                            .flatMap { it.sheets }
                            .flatMap { it.cells }
                            .find { it.uuid == cellId }
                    cell?.script = script
                    cell
                }

                it.dataFetcher("setGraphSpec") { env ->
                    val args = env.arguments
                    val cellId = args["cellId"] as String
                    val spec = args["spec"] as String

                    val cell = allWorkbooks
                            .flatMap { it.sheets }
                            .flatMap { it.cells }
                            .find { it.uuid == cellId }

                    if (cell is GraphCell) {
                        cell.spec = spec
                    }

                    cell
                }
            }

            type("Cell") {
                it.typeResolver { env ->
                    when(env.getObject<Cell>()) {
                        is GraphCell -> env.schema.getObjectType("GraphCell")
                        is CodeCell -> env.schema.getObjectType("CodeCell")
                    }
                }
            }

            type("CellResult") {
                it.dataFetcher("data") { env ->
                    val that = env.getSource() as CellResult
                    that.data.toString()
                }
                it.dataFetcher("json") { env ->
                    val that = env.getSource() as CellResult
                    gson.toJson(that.data)
                }
            }
        }

        GraphQL.newGraphQL(wiredSchema).build()
    }
}
