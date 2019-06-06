package net.varionic.cloudbase.mock

import net.varionic.cloudbase.*

class MockWorkbookStore : WorkbookStore {
    override fun <T> transaction(block: WorkbookStore.() -> T): T = block()

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

    override val allWorkbooks = mutableListOf(
        Workbook(nextUUID(), "Bookish", mutableListOf(
            Worksheet(nextUUID(), "foobar", mutableListOf(
                CodeCell(nextUUID(), """import kotlin.random.Random"""),
                CodeCell(nextUUID(), """data class Foo(val x: Int, val y: Int)"""),
                CodeCell(nextUUID(), """Foo(5,10)"""),
                CodeCell(nextUUID(), """import kotlin.random.Random"""),
                GraphCell(nextUUID(), """(1..100).map { (it to (Random.nextInt() % 100 + 100) % 100) }""", vegaSpec)
            )),

            Worksheet(nextUUID(), "hello", mutableListOf(
                CodeCell(nextUUID(), """listOf(5, 4, 9, 13)"""),
                CodeCell(nextUUID(), """data class World(val x: Int, val y: Int)"""),
                CodeCell(nextUUID(), """World(5,10)""")
            ))
        ))
    )

    override val allProcesses = allWorkbooks.flatMap { it.sheets }.map {
        SheetContext(nextUUID(), it)
    }.toMutableList()

}