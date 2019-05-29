package net.varionic.cloudbase

import graphql.GraphQL
import graphql.schema.idl.SchemaParser
import java.util.*
import javax.script.ScriptEngineManager

interface WorkbookService: GraphQLService

fun nextUUID() = UUID.randomUUID().toString()

data class Workbook(val uuid: String, val name: String, val sheets: List<Worksheet>)
data class Worksheet(val uuid: String, val name: String, val cells: List<CodeCell>)

sealed class Cell(val uuid: String, var script: String)
class CodeCell(uuid: String, script: String): Cell(uuid, script)
class GraphCell(uuid: String, script: String, val spec: String) : Cell(uuid, script)

data class CellResult(val uuid: String, val cell: Cell, val data: Any, val error: Throwable? = null)

val WorkbookGraphQLSchema = """
    type Query {
        worksheet(sheetId: ID!): Worksheet
        allWorkbooks: [Workbook!]!
        allProcesses: [Process!]!
    }

    type Mutation {
        executeCell(processId: ID!, cellId: ID!): CellResult
        setCellScript(cellId: ID!, script: String!): Cell
        appendCell(sheetId: ID!, script: String): Cell
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
""".trimIndent()