package net.varionic.cloudbase

import javax.script.ScriptEngineManager

data class SheetContext(val uuid: String, val sheet: Worksheet, val idGen: IDGenerator) {
    val engine = ScriptEngineManager().getEngineByName("kotlin")
    val resultMap = mutableMapOf<String,CellResult>()

    val results
        get() = resultMap.values

    fun executeCell(cell: ExecutableCell): CellResult? {
        val result = cell.execute(this)?: Unit
        val cr = CellResult(idGen.next(), cell, result)
        resultMap[cell.uuid] = cr

        return cr
    }

    fun executeCell(cellId: String): CellResult? {
        val cell = sheet.cells.find { it.uuid == cellId }
                as? ExecutableCell
                ?: error("Cell $cellId is not executable")

        return executeCell(cell)
    }
}