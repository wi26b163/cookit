const { test } = require("node:test"),
    assert = require("node:assert/strict");
const { server, valid } = require("./server");
const fs = require("node:fs");
const file = __dirname + "/data/recipes.json";
test("Speicherung, Validierung und API", async () => {
    const original = fs.readFileSync(file);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/recipes`;
    const call = (method, data) =>
        fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    try {
        const r = {
            name: "Testrezept",
            base_portions: 4,
            diet_type: "Vegan",
            preparation_time: 20,
            ingredients: [{ name: "Reis", amount: 200, unit: "g", allergens: [] }],
            instructions: "Kochen",
            nutrition: null,
            favorite: false,
        };
        assert.ok(valid(r));
        assert.equal(valid({ ...r, ingredients: [{ ...r.ingredients[0], unit: "Tonne" }] }), false);
        assert.equal(
            valid({
                ...r,
                ingredients: [{ ...r.ingredients[0], allergens: ["Fantasieallergen"] }],
            }),
            false,
        );
        const catalog = require("./public/catalog");
        assert.equal(catalog.allergens.length, 14);
        assert.equal(catalog.units.length, 8);
        for (const unit of catalog.units)
            assert.ok(valid({ ...r, ingredients: [{ ...r.ingredients[0], unit }] }));
        for (const allergen of catalog.allergens)
            assert.ok(
                valid({ ...r, ingredients: [{ ...r.ingredients[0], allergens: [allergen] }] }),
            );

        assert.equal(valid({ ...r, base_portions: 0 }), false);
        assert.equal(valid({ ...r, ingredients: [] }), false);
        assert.equal(
            valid({ ...r, nutrition: { kcal: -1, protein: null, carbs: null, fat: null } }),
            false,
        );
        assert.equal((await call("POST", { ...r, base_portions: 0 })).status, 400);
        let response = await call("POST", r);
        assert.equal(response.status, 200);
        let rows = await response.json(),
            saved = rows.at(-1);
        assert.equal(saved.nutrition, null);
        assert.ok(saved.recipe_id);
        response = await call("PUT", {
            ...saved,
            name: "Geändert",
            nutrition: { kcal: 123, protein: null, carbs: 10, fat: 0 },
        });
        assert.equal(response.status, 200);
        rows = await response.json();
        assert.equal(rows.at(-1).name, "Geändert");
        assert.equal(rows.at(-1).nutrition.protein, null);
        assert.equal((await call("PUT", { ...saved, recipe_id: 99999 })).status, 404);
        assert.equal((await call("DELETE", { recipe_id: saved.recipe_id })).status, 200);
        assert.equal((await call("DELETE", { recipe_id: saved.recipe_id })).status, 404);
        assert.equal((await fetch(url)).status, 200);
        assert.equal((await fetch(url.replace("/api/recipes", "/"))).status, 200);
        assert.equal((await fetch(url.replace("/api/recipes", "/server.js"))).status, 404);
    } finally {
        fs.writeFileSync(file, original);
        await new Promise((resolve) => server.close(resolve));
    }
});
