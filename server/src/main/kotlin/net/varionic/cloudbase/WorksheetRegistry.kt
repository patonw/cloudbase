package net.varionic.cloudbase

data class Worksheet(var uuid: String, var bookId: String?, var name: String, var cells: MutableList<Cell>)

class WorksheetRegistry(val store: WorkbookStore) {
    fun fetch(uuid: String) = with(store) {
        allWorkbooks
                .flatMap { it.sheets }
                .find { it.uuid == uuid }
    }

    fun owner(cell: Cell): Worksheet? = with(store) {
        allWorkbooks
                .flatMap { it.sheets }
                .find { sheet ->
                    sheet.cells.contains(cell)
                }
    }

    fun edit(sheet: Worksheet, block: WorksheetEditor.() -> Unit): Worksheet = with (WorksheetEditor(sheet)) {
        block()
        eject()
    }

    fun createProcess(sheet: Worksheet) = SheetContext(store.nextUUID(), sheet, store.idGen)
}

class WorksheetEditor(val original: Worksheet) {
    val cells = original.cells
    fun eject(): Worksheet {
        original.cells = cells
        return original //.copy(cells = cells)
    }

    fun <T: Cell> T.edit(block: T.() -> Unit) = apply(block)
}