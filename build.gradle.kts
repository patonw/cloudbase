tasks.register<Exec>("yarnInstall") {
    workingDir = projectDir.resolve("client")
    commandLine = listOf("yarn", "install")
}

tasks.register<Exec>("webpack") {
    dependsOn("yarnInstall")
    workingDir = projectDir.resolve("client")
    commandLine = listOf("yarn", "build")
}