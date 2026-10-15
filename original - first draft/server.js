const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());

app.use(express.static("."));

app.post("/recipe", (req, res) => {

    let recipes = [];

    if (fs.existsSync("recipes_example.json")) {
        const data = fs.readFileSync(
            "recipes_example.json",
            "utf8"
        );

        recipes = JSON.parse(data);
    }

    const newRecipe = req.body;

    newRecipe.recipe_id =
        recipes.length > 0
            ? Math.max(...recipes.map(r => r.recipe_id)) + 1
            : 1;

    newRecipe.created_at =
        new Date().toISOString().split("T")[0];

    recipes.push(newRecipe);

    fs.writeFileSync(
        "recipes_example.json",
        JSON.stringify(recipes, null, 2),
        "utf8"
    );

    res.send("Rezept wurde gespeichert.");
});

app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000");
});