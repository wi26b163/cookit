// Erzeugt eine Windows-x64-EXE mit Node.js Single Executable Applications.
// Auf dem Build-Rechner: Node 24.19.0, npm install --no-save postject node-win-x64@24.19.0
// Danach: node build/build-windows.cjs [Pfad/zur/node.exe] [Pfad/zum/postject-cli.js]
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const project = path.resolve(__dirname, "..");
const out = path.join(project, "build", "generated");
fs.mkdirSync(out, { recursive: true });
if (process.version !== "v24.19.0") throw Error("Bitte exakt Node.js 24.19.0 zum Bauen verwenden.");
const catalog = require("../public/catalog.js");
const server = fs
    .readFileSync(path.join(project, "server.js"), "utf8")
    .replace('require("./public/catalog.js")', JSON.stringify(catalog));
const bootstrap = fs
    .readFileSync(path.join(__dirname, "desktop-bootstrap.cjs"), "utf8")
    .replace(
        "// SERVER_BUNDLE_PLACEHOLDER",
        "(function(require, module, __dirname) {\n" +
            server +
            "\n})(require, application, dataHome);",
    );
const main = path.join(out, "desktop.cjs");
fs.writeFileSync(main, bootstrap);
const assets = Object.fromEntries(
    ["index.html", "style.css", "app.js", "catalog.js"].map((name) => [
        "public/" + name,
        path.join(project, "public", name),
    ]),
);
assets["recipes.json"] = path.join(project, "data", "recipes.json");
const blob = path.join(out, "cookit.blob");
const config = path.join(out, "sea-config.json");
fs.writeFileSync(
    config,
    JSON.stringify(
        {
            main,
            output: blob,
            disableExperimentalSEAWarning: true,
            useSnapshot: false,
            useCodeCache: false,
            assets,
        },
        null,
        4,
    ),
);
execFileSync(process.execPath, ["--experimental-sea-config", config], { stdio: "inherit" });
const exe = path.join(project, "windows", "CookIt.exe");
fs.mkdirSync(path.dirname(exe), { recursive: true });
fs.copyFileSync(process.argv[2] || require.resolve("node-win-x64/bin/node.exe"), exe);
// Die Signatur des unveränderten Node-Binaries gilt nach dem Einbetten nicht mehr.
// Daher die alte Zertifikatstabelle vor dem Einbetten entfernen (EXE bleibt unsigniert).
let binary = fs.readFileSync(exe);
const pe = binary.readUInt32LE(0x3c);
const optionalHeader = pe + 24;
const certificateEntry = optionalHeader + 112 + 8 * 4;
const certificateOffset = binary.readUInt32LE(certificateEntry);
const certificateSize = binary.readUInt32LE(certificateEntry + 4);
binary.writeUInt32LE(0, certificateEntry);
binary.writeUInt32LE(0, certificateEntry + 4);
if (certificateOffset && certificateOffset + certificateSize === binary.length) {
    binary = binary.subarray(0, certificateOffset);
}
fs.writeFileSync(exe, binary);
execFileSync(
    process.execPath,
    [
        process.argv[3] || require.resolve("postject/dist/cli.js"),
        exe,
        "NODE_SEA_BLOB",
        blob,
        "--sentinel-fuse",
        "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    ],
    { stdio: "inherit" },
);
console.log("Fertig: " + exe);
