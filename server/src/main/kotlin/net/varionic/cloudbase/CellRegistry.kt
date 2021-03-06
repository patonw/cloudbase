package net.varionic.cloudbase

data class Nucleus(val uuid: String, val revision: Long, val parent: String?) {
    fun update(): Nucleus = Nucleus(uuid, revision + 1, parent)
}

// TODO TableCell, StackedCell, MarkdownCell, GeneratorCell
interface Cell {
    val nucleus: Nucleus
    val uuid get() = nucleus.uuid
    val revision get() = nucleus.revision
    val parent get() = nucleus.parent

    fun WorkbookStore.clone(): Cell
}

interface ExecutableCell: Cell {
    var script: String
    fun execute(ctx: SheetContext): Any? = ctx.engine.eval(script)
}

open class CodeCell(override val nucleus: Nucleus, override var script: String) : ExecutableCell {
    override fun WorkbookStore.clone(): CodeCell = CodeCell(Nucleus(nextUUID(), 0, this@CodeCell.uuid), script)
    fun update(script: String = this.script) = CodeCell(nucleus.update(), script)
}

class GraphCell(override val nucleus: Nucleus, override var script: String, var spec: String): ExecutableCell {
    override fun WorkbookStore.clone(): GraphCell = GraphCell(Nucleus(nextUUID(), 0, this@GraphCell.uuid), script, spec)
    fun update(script: String = this.script, spec: String = this.spec) = GraphCell(nucleus.update(), script, spec)
}

class CellRegistry(val store: WorkbookStore) {
    fun fetch(uuid: String): Cell? = with(store) {
        allWorkbooks
                .flatMap { it.sheets }
                .flatMap { it.cells }
                .find { it.uuid == uuid }
    }

    fun <T : Cell> edit(cell: T, block: T.() -> Unit) = cell.apply {
        block()
    }

    fun nucleus(parent: Cell? = null) = Nucleus(store.nextUUID(), 0, parent?.uuid)
    fun codeCell(script: String, parent: Cell? = null) = CodeCell(nucleus(parent), script)
    fun graphCell(script: String, spec: String, parent: Cell? = null) = GraphCell(nucleus(parent), script, spec)
}
