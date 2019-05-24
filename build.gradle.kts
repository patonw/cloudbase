tasks.register<Exec>("webpack") {
    // TODO define inputs/outputs
    workingDir = projectDir.resolve("client")
    commandLine = listOf("yarn", "build")
}
