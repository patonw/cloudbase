package net.varionic.cloudbase

import net.varionic.cloudbase.routing.GraphQLService
import java.util.*

interface IDGenerator {
    fun next(): String = UUID.randomUUID().toString()
}

open class WorkbookService(val store: WorkbookStore): GraphQLService {
    override val schema = this.javaClass.getResource("schema.gql").readText()
    override val engine by lazy { store.engine(schema) }
}

// Would like to make these data classes immutable
data class Workbook(var uuid: String, var name: String)

data class CellResult(val uuid: String, val cell: Cell, val data: Any, val error: Throwable? = null)
data class DeleteCellOutput(val sheet: Worksheet, val cell: Cell)
data class InsertCellOutput(val sheet: Worksheet, val cell: Cell)
