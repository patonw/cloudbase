package net.varionic.cloudbase

import kotlin.test.*

class SheetContextTest : TestBase {
    @Test
    fun testMissingScript() {
        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "13")
        ))

        assertFails {
            val context = SheetContext("theContextID", sheet)
            val result = context.executeCell("wrongCellId")
            assertNull(result)
        }
    }

    @Test
    fun testTrivialScript() {
        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "")
        ))

        val context = SheetContext("theContextID", sheet)
        val result = context.executeCell("theCellId")
        assertNotNull(result)
        assertEquals(Unit, result.data)

        assertEquals(result, context.results.first())
    }

    @Test
    fun testSimpleScript() {
        val sheet = Worksheet("theSheetID", "theBookID", "A Worksheet", mutableListOf(
                CodeCell(Nucleus("theCellId", 0, null), "5*5")
        ))

        val context = SheetContext("theContextID", sheet)
        val result = context.executeCell("theCellId")
        assertNotNull(result)
        assertEquals(25, result.data)

        assertEquals(result, context.results.first())
    }
}