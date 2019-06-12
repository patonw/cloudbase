package net.varionic.cloudbase

import com.google.gson.*
import net.varionic.cloudbase.mock.MockWorkbookStore
import java.io.File
import java.lang.reflect.Type

object CellSerializer: JsonSerializer<Cell> {
    val gson = Gson()

    override fun serialize(src: Cell, typeOfSrc: Type, context: JsonSerializationContext?): JsonElement {
        val result =  gson.toJsonTree(src).asJsonObject

        when (src) {
            is GraphCell -> {
                result.addProperty("spec", src.spec)
            }
        }
        return result
    }

}

object CellDeserializer: JsonDeserializer<Cell> {
    val gson = Gson()

    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Cell {
        val obj = json.asJsonObject
        return if (obj.has("spec"))
            gson.fromJson(obj, GraphCell::class.java)
        else
            gson.fromJson(obj, CodeCell::class.java)
    }
}

class JsonStore(val path: File): WorkbookStore {
    data class Backend(var workbooks: List<Workbook>, var worksheets: List<Worksheet>) {
        constructor(): this(emptyList(), emptyList())
    }

    private val gson = with (GsonBuilder()) {
        registerTypeAdapter(Cell::class.java, CellSerializer)
        registerTypeAdapter(Cell::class.java, CellDeserializer)
        setPrettyPrinting()
        create()
    }

    private val backend by lazy {
        if (path.exists() && path.isFile) {
            path.bufferedReader().use {
                gson.fromJson(it, Backend::class.java)
            }
        }
        else
            Backend(MockWorkbookStore.allWorkbooks, MockWorkbookStore.allWorksheets)
    }

    override val allWorkbooks: MutableList<Workbook> by lazy {
        backend.workbooks.toMutableList()
    }

    override val allProcesses: MutableList<SheetContext> = mutableListOf()

    override val allWorksheets: MutableList<Worksheet> by lazy {
        backend.worksheets.toMutableList()
    }

    override val cells = CellRegistry(this)
    override val sheets = WorksheetRegistry(this)

    override fun <T> transaction(block: WorkbookStore.() -> T): T {
        return path.bufferedWriter().use {
            val result = block()
            it.write(gson.toJson(Backend(allWorkbooks, allWorksheets)))
            result
        }
    }

}