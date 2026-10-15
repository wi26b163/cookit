// Einstiegspunkt der Windows-EXE. UI und Beispieldaten sind eingebettet.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { getAsset } = require("node:sea");
const dataHome =
    process.env.COOKIT_DESKTOP_HOME ||
    path.join(process.env.LOCALAPPDATA || os.homedir(), "CookIt");
fs.mkdirSync(path.join(dataHome, "public"), { recursive: true });
fs.mkdirSync(path.join(dataHome, "data"), { recursive: true });
for (const name of ["index.html", "style.css", "app.js", "catalog.js"]) {
    fs.writeFileSync(path.join(dataHome, "public", name), getAsset("public/" + name, "utf8"));
}
const recipesFile = path.join(dataHome, "data", "recipes.json");
if (!fs.existsSync(recipesFile)) {
    fs.writeFileSync(recipesFile, getAsset("recipes.json", "utf8"));
}
process.env.COOKIT_HOME = dataHome;
process.env.COOKIT_DESKTOP = "1";
const application = { exports: {} };
// SERVER_BUNDLE_PLACEHOLDER
const server = application.exports.server;
server.on("error", (error) => {
    console.error("CookIt konnte nicht gestartet werden:", error.message);
    process.exitCode = 1;
});
server.listen(0, "127.0.0.1", () => {
    const url = "http://127.0.0.1:" + server.address().port;
    console.log("\nCookIt läuft: " + url);
    console.log("Rezepte werden gespeichert in: " + recipesFile);
    console.log(
        "Dieses Fenster geöffnet lassen. Zum Beenden Fenster schließen oder Strg+C drücken.\n",
    );
    if (process.platform === "win32" && !process.env.COOKIT_NO_BROWSER) {
        const child = require("node:child_process").spawn(
            "rundll32.exe",
            ["url.dll,FileProtocolHandler", url],
            { detached: true, stdio: "ignore" },
        );
        child.on("error", () =>
            console.log("Bitte die oben angezeigte Adresse im Browser öffnen."),
        );
        child.unref();
    }
});
