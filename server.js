const http = require("node:http"),
    fs = require("node:fs"),
    path = require("node:path");
const catalog = require("./public/catalog.js");
const appDirectory = process.env.COOKIT_HOME || __dirname;
const root = path.join(appDirectory, "public"),
    file = path.join(appDirectory, "data", "recipes.json");
function valid(r) {
    return (
        typeof r.name === "string" &&
        r.name.trim() &&
        Number.isFinite(r.base_portions) &&
        r.base_portions > 0 &&
        Number.isFinite(r.preparation_time) &&
        r.preparation_time >= 0 &&
        ["Fleisch", "Vegetarisch", "Vegan", "Fisch"].includes(r.diet_type) &&
        Array.isArray(r.ingredients) &&
        r.ingredients.length > 0 &&
        r.ingredients.every(
            (i) =>
                typeof i.name === "string" &&
                i.name.trim() &&
                Number.isFinite(i.amount) &&
                i.amount > 0 &&
                catalog.units.includes(i.unit) &&
                Array.isArray(i.allergens) &&
                i.allergens.every((a) => catalog.allergens.includes(a)),
        ) &&
        typeof r.instructions === "string" &&
        (r.nutrition === null ||
            (r.nutrition &&
                ["kcal", "protein", "carbs", "fat"].every(
                    (k) =>
                        r.nutrition[k] === null ||
                        (Number.isFinite(r.nutrition[k]) && r.nutrition[k] >= 0),
                )))
    );
}
// Alte bekannte Schreibweisen beim Laden vereinheitlichen.
function readRecipes() {
    const recipes = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const recipe of recipes) {
        for (const ingredient of recipe.ingredients) {
            ingredient.allergens = (ingredient.allergens || []).map(
                (value) => catalog.legacyAllergens[value] || value,
            );
        }
    }
    return recipes;
}
let queue = Promise.resolve();
const server = http.createServer(async (req, res) => {
    const send = (s, d) => {
        res.writeHead(s, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(d));
    };
    try {
        const u = new URL(req.url, "http://localhost");
        if (u.pathname === "/api/recipes") {
            if (req.method === "GET") return send(200, readRecipes());
            if (!["POST", "PUT", "DELETE"].includes(req.method))
                return send(405, { error: "Methode nicht erlaubt" });
            let body = "",
                size = 0;
            for await (const chunk of req) {
                size += chunk.length;
                if (size > 1024 * 1024) return send(413, { error: "Eingabe zu groß" });
                body += chunk;
            }
            let data;
            try {
                data = JSON.parse(body);
            } catch {
                return send(400, { error: "Ungültiges JSON" });
            }
            queue = queue
                .catch(() => {})
                .then(() => {
                    const recipes = readRecipes();
                    if (req.method === "DELETE") {
                        const idx = recipes.findIndex((r) => r.recipe_id === data.recipe_id);
                        if (idx < 0) return send(404, { error: "Rezept nicht gefunden" });
                        recipes.splice(idx, 1);
                    } else {
                        if (!valid(data)) return send(400, { error: "Bitte Rezeptdaten prüfen." });
                        if (req.method === "POST") {
                            data.recipe_id = Math.max(0, ...recipes.map((r) => r.recipe_id)) + 1;
                            data.created_at = new Date().toISOString();
                            recipes.push(data);
                        } else {
                            const idx = recipes.findIndex((r) => r.recipe_id === data.recipe_id);
                            if (idx < 0) return send(404, { error: "Rezept nicht gefunden" });
                            data.created_at = recipes[idx].created_at;
                            recipes[idx] = data;
                        }
                    }
                    fs.writeFileSync(file + ".tmp", JSON.stringify(recipes, null, 2));
                    fs.renameSync(file + ".tmp", file);
                    send(200, recipes);
                });
            await queue;
            return;
        }
        if (!["GET", "HEAD"].includes(req.method))
            return send(405, { error: "Methode nicht erlaubt" });
        const target = path.resolve(
            root,
            "." + decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname),
        );
        if (!target.startsWith(root + path.sep)) return send(403, { error: "Nicht erlaubt" });
        if (!fs.existsSync(target) || !fs.statSync(target).isFile())
            return send(404, { error: "Nicht gefunden" });
        const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
        res.writeHead(200, {
            "Content-Type":
                (mime[path.extname(target)] || "application/octet-stream") + "; charset=utf-8",
        });
        res.end(req.method === "HEAD" ? "" : fs.readFileSync(target));
    } catch (e) {
        console.error(e.message);
        send(500, { error: "Speichern oder Laden fehlgeschlagen. Bitte erneut versuchen." });
    }
});
if (require.main === module && !process.env.COOKIT_DESKTOP)
    server.listen(process.env.PORT || 3000, "127.0.0.1", () =>
        console.log("CookIt: http://localhost:" + (process.env.PORT || 3000)),
    );
module.exports = { server, valid };
