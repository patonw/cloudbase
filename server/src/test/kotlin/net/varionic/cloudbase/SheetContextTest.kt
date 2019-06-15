package net.varionic.cloudbase

import com.karumi.kotlinsnapshot.matchWithSnapshot
import org.koin.test.inject
import org.koin.test.mock.declareMock
import org.mockito.BDDMockito.given
import kotlin.test.*

class SheetContextTest : TestBase() {
    @Test
    fun testMissingScript() {
        declareMock<IDGenerator> {
            given(this.next()).willReturn("mockUUID")
        }
        val store: WorkbookStore by inject()

        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "13")
        ))

        assertFails {
            val context = store.sheets.createProcess(sheet)
            val result = context.executeCell("wrongCellId")
            assertNull(result)
        }
    }

    @Test
    fun testTrivialScript() {
        declareMock<IDGenerator> {
            given(this.next()).willReturn("mockUUID")
        }
        val store: WorkbookStore by inject()

        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "")
        ))
        val context = store.sheets.createProcess(sheet)

        val result = context.executeCell("theCellId")
        assertNotNull(result)
        assertEquals(Unit, result.data)

        assertEquals(result, context.results.first())
        snap.matchWithSnapshot(result)
    }

    @Test
    fun testSimpleScript() {
        declareMock<IDGenerator> {
            given(this.next()).willReturn("mockUUID")
        }

        val store: WorkbookStore by inject()

        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "5*5")
        ))

        val context = store.sheets.createProcess(sheet)
        val result = context.executeCell("theCellId")
        assertNotNull(result)
        assertEquals(25, result.data)

        assertEquals(result, context.results.first())
        snap.matchWithSnapshot(result)
    }
}