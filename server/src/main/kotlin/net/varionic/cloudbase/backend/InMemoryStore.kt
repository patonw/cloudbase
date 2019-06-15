package net.varionic.cloudbase.backend

import net.varionic.cloudbase.*

class InMemoryStore  : WorkbookStore {
    override val idGen = object: IDGenerator {}

    override fun <T> transaction(block: WorkbookStore.() -> T): T = run(block)

    private val defaultWorkbook = Workbook("defaultWorkbookId", "Default Workbook")

    override val allWorksheets = mutableListOf(
            Worksheet("firstWorksheetId", defaultWorkbook.uuid, "Untitled", mutableListOf(
                    CodeCell(Nucleus("codeCell_00", 0, null), "")
            ))
    )

    override val allWorkbooks = mutableListOf(
            defaultWorkbook
    )

    override val allProcesses = allWorkbooks.flatMap { it.sheets }.map {
        SheetContext(nextUUID(), it, idGen)
    }.toMutableList()
}