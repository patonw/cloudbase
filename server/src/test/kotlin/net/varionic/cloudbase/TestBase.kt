package net.varionic.cloudbase

import net.varionic.cloudbase.backend.MockWorkbookStore
import net.varionic.cloudbase.routing.GraphQLService
import kotlin.test.*

import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.dsl.module
import org.koin.test.KoinTest

val dummyModule = module {
    single { MockWorkbookStore as WorkbookStore }
    single { WorkbookService(get()) as GraphQLService }
}

interface TestBase: KoinTest {
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