package net.varionic.cloudbase

import com.google.gson.Gson
import graphql.GraphQL
import graphql.schema.idl.SchemaParser

interface WorkbookStore {
    val allWorkbooks: MutableList<Workbook>
    val allProcesses: MutableList<SheetContext>

    fun <T> transaction(block: WorkbookStore.() -> T): T
}

fun WorkbookStore.engine(): GraphQL {
    val registry = SchemaParser().parse(WorkbookGraphQLSchema)
    val gson = Gson()

    // Bind lambdas to schema operations
    val wiredSchema = registry.wiring {
        type("Query") {
            it.dataFetcher("allWorkbooks") {
                allWorkbooks
            }

            it.dataFetcher("allProcesses") {
                allProcesses
            }


            it.dataFetcher("worksheet") { env ->
                val sheetId = env.getArgument<String>("sheetId")
                allWorkbooks
                        .flatMap { it.sheets }
                        .find { it.uuid == sheetId}
            }
        }

        type("Mutation") { mut ->
            // Adds a new server into the mock database
            mut.dataFetcher("executeCell") { env ->
                val args = env.arguments
                val ctxId = args["processId"] as String
                val cellId = args["cellId"] as String

                // TODO error handling
                transaction {
                    val context = allProcesses.find { it.uuid == ctxId }
                    context?.executeCell(cellId)
                }
            }
            mut.dataFetcher("setCellScript") { env ->
                val args = env.arguments
                val cellId = args["cellId"] as String
                val script = args["script"] as String

                transaction {
                    val cell = allWorkbooks
                            .flatMap { it.sheets }
                            .flatMap { it.cells }
                            .find { it.uuid == cellId }
                    cell?.script = script
                    cell
                }
            }

            mut.dataFetcher("setGraphSpec") { env ->
                val args = env.arguments
                val cellId = args["cellId"] as String
                val spec = args["spec"] as String

                transaction {
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

            mut.dataFetcher("insertCell") { env ->
                val args = env.arguments
                val sheetId = args["sheetId"] as String
                val cellType = env.getArgument<String?>("cellType")

                transaction {
                    val sheet = allWorkbooks
                            .flatMap { it.sheets }
                            .find { it.uuid == sheetId }

                    val cell = when (cellType) {
                        "GRAPH" -> GraphCell(nextUUID(), "", "")
                        else -> CodeCell(nextUUID(), "")
                    }

                    sheet?.cells?.add(cell)
                    sheet?.let { InsertCellOutput(sheet, cell) }
                }
            }

            mut.dataFetcher("deleteCell") { env ->
                val args = env.arguments
                val sheetId = args["sheetId"] as String
                val cellId = args["cellId"] as String

                transaction {
                    val sheet = allWorkbooks
                            .flatMap { it.sheets }
                            .find { it.uuid == sheetId }

                    val cell = sheet?.cells?.find { it.uuid == cellId }

                    cell?.let {
                        sheet.cells.remove(cell)
                        DeleteCellOutput(sheet, cell)
                    }
                }
            }

            mut.dataFetcher("reorderWorksheet") { env ->
                val sheetId = env.getArgument<String>("sheetId")
                val order = env.getArgument<List<String>>("cells")

                transaction {
                    val sheet = allWorkbooks
                            .flatMap { it.sheets }
                            .find { it.uuid == sheetId }

                    sheet?.cells?.toSet()

                    val valid = order?.containsAll(sheet?.cells?.map {it.uuid}.orEmpty())

                    if (valid != null && valid) {
                        val cells = sheet!!.cells.associateBy { it.uuid }
                        val newCells = order.map { cells.getValue(it) }
                        sheet.cells.clear()
                        sheet.cells.addAll(newCells)
                    }

                    sheet
                }
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

    return GraphQL.newGraphQL(wiredSchema).build()
}
