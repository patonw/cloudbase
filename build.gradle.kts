tasks.register<Exec>("yarnInstall") {
    workingDir = projectDir.resolve("client")
    commandLine = listOf("yarn", "install")
    inputs.file("client/package.json")
    outputs.file("client/yarn.lock")
}

tasks.register<Exec>("webpack") {
    dependsOn("yarnInstall")
    workingDir = projectDir.resolve("client")
    commandLine = listOf("yarn", "build")
    inputs.dir("client/src")
    outputs.dir("client/build")
}