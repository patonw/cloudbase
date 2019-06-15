package net.varionic.cloudbase.backend

import net.varionic.cloudbase.*

class MockWorkbookStore(override val idGen: IDGenerator) : WorkbookStore {
    override fun <T> transaction(block: WorkbookStore.() -> T): T = run(block)

    private fun mockCodeCell(uuid: String, script: String) = CodeCell(Nucleus(uuid, 0, null), script)
    private fun mockGraphCell(uuid: String, script:String, spec: String) = GraphCell(Nucleus(uuid, 0, null), script, spec)

    private val vegaSpec = """
        {
          "${'$'}schema": "https://vega.github.io/schema/vega-lite/v3.json",
          "description": "A simple bar chart with embedded data.",
          "mark": "bar",
          "encoding": {
            "x": {"field": "first", "type": "ordinal"},
            "y": {"field": "second", "type": "quantitative"}
          }
        }
        """.trimIndent()

    private val defaultWorkbook = Workbook("defaultWorkbookId", "Default Workbook")

    override val allWorksheets = mutableListOf(
            Worksheet("firstWorksheetId", defaultWorkbook.uuid, "Random Bars", mutableListOf(
                    mockCodeCell("codeCell_00", """import kotlin.random.Random"""),
                    mockGraphCell("graphCell_01", """(1..100).map { (it to (Random.nextInt() % 100 + 100) % 100) }""", vegaSpec)
            )),

            Worksheet("secondWorksheetId", defaultWorkbook.uuid, "Hello World", mutableListOf(
                    mockCodeCell("codeCell_10", """listOf(5, 4, 9, 13)"""),
                    mockCodeCell("codeCell_11", """data class World(val x: Int, val y: Int)"""),
                    mockCodeCell("codeCell_12", """World(5,10)""")
            ))
    )

    override val allWorkbooks = mutableListOf(
            defaultWorkbook
    )

    override val allProcesses = allWorkbooks.flatMap { it.sheets }.map {
        SheetContext(nextUUID(), it, idGen)
    }.toMutableList()

}