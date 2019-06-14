package net.varionic.cloudbase

import com.google.gson.Gson
import graphql.*
import graphql.schema.idl.SchemaParser
import graphql.schema.idl.TypeRuntimeWiring
import net.varionic.cloudbase.routing.wiring
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

class InvalidUUID(val msg: String) : RuntimeException(msg)
class DetachedEntity(val msg: String): RuntimeException(msg)

fun WorkbookStore.engine(schema: String): GraphQL {
    val registry = SchemaParser().parse(schema)
    val gson = Gson()

    // Bind lambdas to schema operations
    val wiredSchema = registry.wiring {
        type("Query") {
            handleQuery(it)
        }

        type("Mutation") { wiring ->
            handleMutation(wiring)
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

internal fun WorkbookStore.handleMutation(wiring: TypeRuntimeWiring.Builder): TypeRuntimeWiring.Builder? {
    wiring.dataFetcher("createWorksheet") { env ->
        val bookId = env.getArgument<String>("workbookId")
        val name = env.getArgument<String>("name")

        createWorksheet(bookId, name)
    }

    wiring.dataFetcher("createProcess") { env ->
        val sheetId = env.getArgument<String>("sheetId")

        createProcess(sheetId)
    }

    wiring.dataFetcher("executeCell") { env ->
        val args = env.arguments
        val ctxId = args["processId"] as String
        val cellId = args["cellId"] as String

        executeCell(ctxId, cellId)
    }

    wiring.dataFetcher("setCellScript") { env ->
        val args = env.arguments
        val cellId = args["cellId"] as String
        val script = args["script"] as String

        setCellScript(cellId, script)
    }

    wiring.dataFetcher("setGraphSpec") { env ->
        val args = env.arguments
        val cellId = args["cellId"] as String
        val spec = args["spec"] as String

        setGraphSpec(cellId, spec)
    }

    wiring.dataFetcher("insertCell") { env ->
        val args = env.arguments
        val sheetId = args["sheetId"] as String
        val cellType = env.getArgument<String?>("cellType")

        insertCell(sheetId, cellType)
    }

    wiring.dataFetcher("deleteCell") { env ->
        val args = env.arguments
        val sheetId = args["sheetId"] as String
        val cellId = args["cellId"] as String

        deleteCell(sheetId, cellId)
    }

    return wiring.dataFetcher("reorderWorksheet") { env ->
        val sheetId = env.getArgument<String>("sheetId")
        val order = env.getArgument<List<String>>("cells")

        reorderWorksheet(sheetId, order)
    }
}

internal fun WorkbookStore.reorderWorksheet(sheetId: String?, order: List<String>): Worksheet? {
    return transaction {
        val sheet = allWorkbooks
                .flatMap { it.sheets }
                .find { it.uuid == sheetId }

        sheet?.cells?.toSet()

        val isValidOrder = order.containsAll(sheet?.cells?.map { it.uuid }.orEmpty())

        if (isValidOrder) {
            val cells = sheet!!.cells.associateBy { it.uuid }
            val newCells = order.map { cells.getValue(it) }
            sheet.cells.clear()
            sheet.cells.addAll(newCells)
        }

        sheet
    }
}

internal fun WorkbookStore.deleteCell(sheetId: String, cellId: String): DeleteCellOutput? {
    return transaction {
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

internal fun WorkbookStore.insertCell(sheetId: String, cellType: String?): InsertCellOutput {
    return transaction {
        val sheet = sheets.fetch(sheetId) ?: throw InvalidUUID("Worksheet $sheetId dose not exists")

        val cell = when (cellType) {
            "GRAPH" -> GraphCell(nextUUID(), "", "")
            else -> CodeCell(nextUUID(), "")
        }

        sheet.cells.add(cell)
        InsertCellOutput(sheet, cell)
    }
}

internal fun WorkbookStore.setGraphSpec(cellId: String, spec: String): Cell {
    return transaction {
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

internal fun WorkbookStore.setCellScript(cellId: String, script: String): Cell {
    return transaction {
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

internal fun WorkbookStore.executeCell(ctxId: String, cellId: String): CellResult? {
    // TODO error handling

    return transaction {
        val context = allProcesses.find { it.uuid == ctxId }
        context ?: throw InvalidUUID("Process $ctxId does not exist")
        context.executeCell(cellId)
    }
}

internal fun WorkbookStore.createProcess(sheetId: String?): SheetContext {
    return transaction {
        val sheet = allWorkbooks.flatMap { it.sheets }
                .find { it.uuid == sheetId }
                ?: throw InvalidUUID("Worksheet $sheetId does not exist")

        val proc = SheetContext(nextUUID(), sheet)
        allProcesses.add(proc)
        proc
    }
}

internal fun WorkbookStore.createWorksheet(bookId: String, name: String): Worksheet {
    return transaction {
        val book = allWorkbooks.find { it.uuid == bookId }
                ?: throw InvalidUUID("Workbook $bookId does not exist")

        // TODO retry until unique
        val nameExists = book.sheets.any { it.name == name }
        val uuid = nextUUID()
        val prefix = uuid.take(5)

        val autoName = if (nameExists) "$name ($prefix)" else name
        val sheet = Worksheet(uuid, bookId, autoName, mutableListOf(CodeCell(nextUUID(), "")))
        allWorksheets.add(sheet)

        sheet
    }
}

internal fun WorkbookStore.handleQuery(wiring: TypeRuntimeWiring.Builder): TypeRuntimeWiring.Builder? {
    wiring.dataFetcher("allWorkbooks") {
        allWorkbooks
    }

    wiring.dataFetcher("allProcesses") {
        allProcesses
    }

    return wiring.dataFetcher("worksheet") { env ->
        val sheetId = env.getArgument<String>("sheetId")
        allWorkbooks
                .flatMap { it.sheets }
                .find { it.uuid == sheetId }
    }
}
