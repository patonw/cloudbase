package net.varionic.cloudbase

import java.util.*

open class WorkbookService(val store: WorkbookStore): GraphQLService {
    override val engine by lazy { store.engine() }
}

fun nextUUID() = UUID.randomUUID().toString()

data class Workbook(val uuid: String, val name: String, val sheets: MutableList<Worksheet>)
data class Worksheet(val uuid: String, val name: String, val cells: MutableList<Cell>)

sealed class Cell(val uuid: String, var script: String)
class CodeCell(uuid: String, script: String): Cell(uuid, script)
class GraphCell(uuid: String, script: String, var spec: String) : Cell(uuid, script)

data class CellResult(val uuid: String, val cell: Cell, val data: Any, val error: Throwable? = null)

data class DeleteCellOutput(val sheet: Worksheet, val cell: Cell)
data class InsertCellOutput(val sheet: Worksheet, val cell: Cell)

val WorkbookGraphQLSchema = """
    type Query {
        worksheet(sheetId: ID!): Worksheet
        allWorkbooks: [Workbook!]!
        allProcesses: [Process!]!
    }

    type Mutation {
        createWorksheet(workbookId: ID!, name: String = "Untitled"): Worksheet!
        createProcess(sheetId: ID!): Process!
        executeCell(processId: ID!, cellId: ID!): CellResult
        setCellScript(cellId: ID!, script: String!): Cell
        setGraphSpec(cellId: ID!, spec: String!): GraphCell
        insertCell(sheetId: ID!, index: Int = -1, cellType: CellType = CODE): InsertCellOutput
        reorderWorksheet(sheetId: ID!, cells: [ID!]!): Worksheet
        deleteCell(sheetId: ID!, cellId: ID!): DeleteCellOutput
    }

    enum CellType {
        CODE
        GRAPH
    }

    type Workbook {
        uuid: ID!
        name: String!
        sheets: [Worksheet!]!
    }

    type Worksheet {
        uuid: ID!
        name: String!
        cells: [Cell!]!
    }

    interface Cell {
        uuid: ID!
        script: String!
    }

    type CodeCell implements Cell {
        uuid: ID!
        script: String!
    }

    type GraphCell implements Cell {
        uuid: ID!
        script: String!
        spec: String!
    }

    type CellResult {
        cell: Cell!
        data: String!
        json: String!
    }

    type Process {
        uuid: ID!
        sheet: Worksheet!
        results: [CellResult!]!
    }

    type DeleteCellOutput {
        sheet: Worksheet!
        cell: Cell!
    }

    type InsertCellOutput {
        sheet: Worksheet!
        cell: Cell!
    }
""".trimIndent()
