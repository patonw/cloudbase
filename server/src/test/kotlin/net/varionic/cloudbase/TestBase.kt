package net.varionic.cloudbase

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.karumi.kotlinsnapshot.KotlinSnapshot
import com.karumi.kotlinsnapshot.core.SerializationModule
import com.karumi.kotlinsnapshot.core.serializers.RuntimeClassNameTypeAdapterFactory
import com.karumi.kotlinsnapshot.serializers.GsonUTCDateAdapter
import net.varionic.cloudbase.backend.CellDeserializer
import net.varionic.cloudbase.backend.CellSerializer
import net.varionic.cloudbase.backend.MockWorkbookStore
import net.varionic.cloudbase.routing.GraphQLService
import kotlin.test.*

import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.dsl.module
import org.koin.test.KoinTest
import java.util.*

val dummyModule = module {
    single { object: IDGenerator {} as IDGenerator }
    single { MockWorkbookStore(get()) as WorkbookStore }
    single { WorkbookService(get()) as GraphQLService }
}

class CustomKotlinSerialization : SerializationModule {
    internal val adapter = RuntimeClassNameTypeAdapterFactory.of<Any>(Any::class.java)
            .registerSubtype(ArrayList::class.java)

    internal val gson: Gson = with(GsonBuilder()) {
        setPrettyPrinting()
        registerTypeAdapter(Cell::class.java, CellSerializer)
        registerTypeAdapter(Cell::class.java, CellDeserializer)
        registerTypeAdapter(Date::class.java, GsonUTCDateAdapter())
        // registerTypeAdapterFactory(adapter) // Broken on ArrayLists
        create()
    }

    override fun serialize(value: Any?): String = gson.toJson(value)
}

abstract class TestBase : KoinTest {
    val snap = KotlinSnapshot(serializationModule = CustomKotlinSerialization())

    @BeforeTest
    fun setup() {
        startKoin {
            modules(dummyModule)
        }
    }

    @AfterTest
    fun tearDown() {
        stopKoin()
    }
}