const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer));
    });
}

async function addRecipe() {
    let recipes = [];

    // Vorhandene JSON-Datei laden
    if (fs.existsSync("recipes_example.json")) {
        const data = fs.readFileSync("recipes_example.json", "utf8");

        if (data.trim() !== "") {
            recipes = JSON.parse(data);
        }
    }

    // Rezeptdaten abfragen
    const name = await ask("Rezeptname: ");
    const basePortions = await ask("Grundportionen: ");
    const dietType = await ask("Ernährungsart: ");
    const preparationTime = await ask("Zubereitungszeit in Minuten: ");

    // Zutat abfragen
    const ingredientName = await ask("Zutat: ");
    const amount = await ask("Menge: ");
    const unit = await ask("Einheit: ");

    // Neue Rezept-ID erzeugen
    const newRecipeId =
        recipes.length > 0
            ? Math.max(...recipes.map(recipe => recipe.recipe_id)) + 1
            : 1;

    // Neues Rezept erstellen
    const newRecipe = {
        recipe_id: newRecipeId,
        name: name,
        base_portions: Number(basePortions),
        diet_type: dietType,
        preparation_time: Number(preparationTime),
        created_at: new Date().toISOString().split("T")[0],

        ingredients: [
            {
                ingredient_id: 1,
                name: ingredientName,
                amount: Number(amount),
                unit: unit
            }
        ]
    };

    // Neues Rezept hinzufügen
    recipes.push(newRecipe);

    // JSON-Datei speichern
    fs.writeFileSync(
        "recipes_example.json",
        JSON.stringify(recipes, null, 2),
        "utf8"
    );

    console.log("\nRezept wurde erfolgreich gespeichert.");

    rl.close();
}

function showRecipes() {
    try {
        const data = fs.readFileSync("recipes_example.json", "utf8");
        const recipes = JSON.parse(data);

        console.log("\nGESPEICHERTE REZEPTE\n");

        recipes.forEach(recipe => {
            console.log("------------------------------");
            console.log("ID:", recipe.recipe_id);
            console.log("Rezept:", recipe.name);
            console.log("Portionen:", recipe.base_portions);
            console.log("Ernährungsart:", recipe.diet_type);
            console.log(
                "Zubereitungszeit:",
                recipe.preparation_time,
                "Minuten"
            );
            console.log("Erstellt am:", recipe.created_at);

            console.log("Zutaten:");

            recipe.ingredients.forEach(ingredient => {
                console.log(
                    "-",
                    ingredient.amount,
                    ingredient.unit,
                    ingredient.name
                );
            });
        });

        console.log("------------------------------");

    } catch (error) {
        console.error("Fehler beim Anzeigen:", error.message);
    }
}


// -------------------------------------------------
// HIER AUSWÄHLEN, WAS DAS PROGRAMM MACHEN SOLL
// -------------------------------------------------

// Neues Rezept eingeben:
//addRecipe();

// Rezepte anzeigen:
showRecipes();

//GIT working ? 233232

//Git change test
//123123
//456456