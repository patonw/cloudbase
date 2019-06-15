package net.varionic.cloudbase

import org.junit.Test
import org.koin.test.inject
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class WorksheetRegistryTest: TestBase() {
    @Test
    fun `fetching absent worksheet returns null`() {
        val store: WorkbookStore by inject()
        val result = store.sheets.fetch("doesNotExist")
        assertNull(result)
    }

    @Test
    fun `fetching valid worksheet`() {
        val store: WorkbookStore by inject()
        val reg = WorksheetRegistry(store)
        val result = reg.fetch("secondWorksheetId")

        assertNotNull(result)
        snap.matchWithSnapshot(result)
    }

    @Test
    fun `resolve the sheet that owns a cell`() {
        val store: WorkbookStore by inject()
        val sheet = store.allWorksheets.first()
        val cell = sheet.cells.first()
        val result = store.sheets.owner(cell)

        assertEquals(sheet, result)
        snap.matchWithSnapshot(result)
    }

    @Test
    fun `edit a worksheet cell`() {
        val store: WorkbookStore by inject()
        val sheet = store.allWorksheets.first()
        val cell = sheet.cells.first()
        store.sheets.edit(sheet) {
            cell.edit {
                this as CodeCell
                script = "1 + 5"
            }
        }

        val result = store.cells.fetch(cell.uuid)
        assertNotNull(result)
        assertTrue { result is CodeCell }
        assertEquals("1 + 5", (result as? CodeCell)?.script)
        snap.matchWithSnapshot(result)
    }
}