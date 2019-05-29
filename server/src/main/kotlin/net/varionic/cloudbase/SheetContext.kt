package net.varionic.cloudbase

import javax.script.ScriptEngineManager

data class SheetContext(val uuid: String, val sheet: Worksheet) {
    val engine = ScriptEngineManager().getEngineByName("kotlin")
    val resultMap = mutableMapOf<String,CellResult>()

    val results
        get() = resultMap.values

    fun executeCell(cell: Cell): CellResult? {
        val result = engine.eval(cell.script) ?: Unit
        val cr = CellResult(nextUUID(), cell, result)
        resultMap[cell.uuid] = cr

        return cr
    }

    fun executeCell(cellId: String): CellResult? {
        val cell = sheet.cells.find { it.uuid == cellId } ?: return null
        return executeCell(cell)
    }
}