package net.varionic.cloudbase

import com.google.gson.Gson
import graphql.*
import graphql.execution.DataFetcherExceptionHandler
import graphql.execution.DataFetcherExceptionHandlerParameters
import graphql.execution.DataFetcherExceptionHandlerResult
import graphql.schema.idl.SchemaParser
import java.lang.RuntimeException

interface WorkbookStore {
    val allWorkbooks: MutableList<Workbook>
    val allProcesses: MutableList<SheetContext>
    val allWorksheets: MutableList<Worksheet>
    val sheets: WorksheetRegistry
    val cells: CellRegistry

    fun <T> transaction(block: WorkbookStore.() -> T): T

    val Workbook.sheets
        get() = allWorksheets.filter { it.bookId == this.uuid }

    fun Worksheet.edit(block: WorksheetEditor.() -> Unit) = sheets.edit(this, block)
}

class CustomErrorHandler : DataFetcherExceptionHandler {
    override fun onException(params: DataFetcherExceptionHandlerParameters) =
            DataFetcherExceptionHandlerResult.Builder().run {
                val inner = params.exception
                val wrapped = ExceptionWhileDataFetching(params.path, inner, params.sourceLocation)
                this.error(wrapped)
                build()
            }
}

class InvalidUUID(val msg: String) : RuntimeException(msg)
class DetachedEntity(val msg: String): RuntimeException(msg)

fun WorkbookStore.engine(schema: String): GraphQL {
    val registry = SchemaParser().parse(schema)
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
                        .find { it.uuid == sheetId }
            }
        }

        type("Mutation") { mut ->
            mut.dataFetcher("createWorksheet") { env ->
                val bookId = env.getArgument<String>("workbookId")
                val name = env.getArgument<String>("name")
                transaction {
                    val book = allWorkbooks.find { it.uuid == bookId }
                            ?: throw InvalidUUID("Workbook $bookId does not exist")

                    // TODO retry until unique
                    val nameExists = book.sheets.any { it.name == name }
                    val uuid = nextUUID()
                    val prefix = uuid.take(5)

                    val autoName = if (nameExists) "$name ($prefix)" else name
                    val sheet = Worksheet(uuid, bookId, autoName, mutableListOf(CodeCell(nextUUID(), "")))
                    allWorksheets.add(sheet)

                    //allProcesses.add(SheetContext(nextUUID(), sheet))
                    sheet
                }
            }

            mut.dataFetcher("createProcess") { env ->
                val sheetId = env.getArgument<String>("sheetId")

                transaction {
                    val sheet = allWorkbooks.flatMap { it.sheets }
                            .find { it.uuid == sheetId }
                            ?: throw InvalidUUID("Worksheet $sheetId does not exist")

                    val proc = SheetContext(nextUUID(), sheet)
                    allProcesses.add(proc)
                    proc
                }
            }

            // Adds a new server into the mock database
            mut.dataFetcher("executeCell") { env ->
                val args = env.arguments
                val ctxId = args["processId"] as String
                val cellId = args["cellId"] as String

                // TODO error handling
                transaction {
                    val context = allProcesses.find { it.uuid == ctxId }
                    context ?: throw InvalidUUID("Process $ctxId does not exist")
                    context.executeCell(cellId)
                }
            }

            mut.dataFetcher("setCellScript") { env ->
                val args = env.arguments
                val cellId = args["cellId"] as String
                val script = args["script"] as String

                transaction {
                    val cell = cells.fetch(cellId) ?: throw InvalidUUID("Cell $cellId does not exist")
                    val owner = sheets.owner(cell) ?: throw DetachedEntity("Cell $cellId is not attached to a worksheet")

                    if (cell !is ExecutableCell)
                        throw InvalidUUID("Cell $cellId is not a code cell")

                    lateinit var result: Cell
                    owner.edit {
                        result = cell.edit {
                            this.script = script
                        }
                    }

                    result
                }
            }

            mut.dataFetcher("setGraphSpec") { env ->
                val args = env.arguments
                val cellId = args["cellId"] as String
                val spec = args["spec"] as String

                transaction {
                    val cell = cells.fetch(cellId) ?: throw InvalidUUID("Cell $cellId does not exist")
                    val owner = sheets.owner(cell) ?: throw DetachedEntity("Cell $cellId is not attached to a worksheet")

                    if (cell !is GraphCell)
                        throw InvalidUUID("Cell $cellId is not a graph cell")

                    lateinit var result: Cell
                    owner.edit {
                        result = cell.edit {
                            this.spec = spec
                        }
                    }

                    result
                }
            }

            mut.dataFetcher("insertCell") { env ->
                val args = env.arguments
                val sheetId = args["sheetId"] as String
                val cellType = env.getArgument<String?>("cellType")

                transaction {
                    val sheet = sheets.fetch(sheetId) ?: throw InvalidUUID("Worksheet $sheetId dose not exists")

                    val cell = when (cellType) {
                        "GRAPH" -> GraphCell(nextUUID(), "", "")
                        else -> CodeCell(nextUUID(), "")
                    }

                    sheet.cells.add(cell)
                    InsertCellOutput(sheet, cell)
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

                    val valid = order?.containsAll(sheet?.cells?.map { it.uuid }.orEmpty())

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

        type("Workbook") { wire ->
            wire.dataFetcher("sheets") { env ->
                val book = env.getSource<Workbook>()
                book.sheets
            }

        }

        type("Cell") {
            it.typeResolver { env ->
                when (env.getObject<Cell>()) {
                    is GraphCell -> env.schema.getObjectType("GraphCell")
                    is CodeCell -> env.schema.getObjectType("CodeCell")
                    else -> error("NO GOOD!")
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
