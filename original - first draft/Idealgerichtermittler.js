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


// ------------------------------------------------------
// 15 bereits angelegte Rezepte
// Werte jeweils pro Mahlzeit
// ------------------------------------------------------

const recipes = [
    {
        id: 1,
        name: "Spaghetti Bolognese",
        kcal: 650,
        protein: 38,
        carbs: 75,
        fat: 20
    },
    {
        id: 2,
        name: "Hühnerreis",
        kcal: 550,
        protein: 50,
        carbs: 65,
        fat: 10
    },
    {
        id: 3,
        name: "Lachs mit Kartoffeln",
        kcal: 620,
        protein: 42,
        carbs: 50,
        fat: 25
    },
    {
        id: 4,
        name: "Gemüsecurry mit Reis",
        kcal: 500,
        protein: 18,
        carbs: 80,
        fat: 12
    },
    {
        id: 5,
        name: "Protein-Porridge",
        kcal: 450,
        protein: 35,
        carbs: 55,
        fat: 10
    },
    {
        id: 6,
        name: "Thunfischsalat",
        kcal: 350,
        protein: 45,
        carbs: 15,
        fat: 12
    },
    {
        id: 7,
        name: "Hühner-Wrap",
        kcal: 520,
        protein: 40,
        carbs: 55,
        fat: 15
    },
    {
        id: 8,
        name: "Chili con Carne",
        kcal: 580,
        protein: 42,
        carbs: 60,
        fat: 18
    },
    {
        id: 9,
        name: "Skyr mit Banane",
        kcal: 320,
        protein: 30,
        carbs: 45,
        fat: 3
    },
    {
        id: 10,
        name: "Rührei mit Brot",
        kcal: 480,
        protein: 28,
        carbs: 35,
        fat: 24
    },
    {
        id: 11,
        name: "Reis mit Gemüse und Garnelen",
        kcal: 510,
        protein: 35,
        carbs: 70,
        fat: 10
    },
    {
        id: 12,
        name: "Linsen-Bowl",
        kcal: 470,
        protein: 25,
        carbs: 65,
        fat: 12
    },
    {
        id: 13,
        name: "Steak mit Kartoffeln",
        kcal: 700,
        protein: 55,
        carbs: 50,
        fat: 28
    },
    {
        id: 14,
        name: "Cottage Cheese Bowl",
        kcal: 300,
        protein: 32,
        carbs: 25,
        fat: 8
    },
    {
        id: 15,
        name: "Pasta mit Huhn",
        kcal: 680,
        protein: 48,
        carbs: 85,
        fat: 16
    }
];


// ------------------------------------------------------
// Standard-Zielwerte
// Können später geändert werden
// ------------------------------------------------------

let target = {
    kcal: 2500,
    protein: 180,
    carbs: 280,
    fat: 75
};


// ------------------------------------------------------
// Zielwerte eingeben
// Leere Eingabe = vorherigen Wert behalten
// ------------------------------------------------------

async function setTargets() {

    console.log("\n--- Zielwerte festlegen ---");
    console.log("Enter drücken = bisherigen Wert behalten\n");

    let kcal = await ask(`Kalorien [${target.kcal}]: `);
    let protein = await ask(`Protein [${target.protein} g]: `);
    let carbs = await ask(`Kohlenhydrate [${target.carbs} g]: `);
    let fat = await ask(`Fett [${target.fat} g]: `);

    if (kcal !== "") {
        target.kcal = Number(kcal);
    }

    if (protein !== "") {
        target.protein = Number(protein);
    }

    if (carbs !== "") {
        target.carbs = Number(carbs);
    }

    if (fat !== "") {
        target.fat = Number(fat);
    }
}


// ------------------------------------------------------
// Bereits konsumierte Mahlzeiten eingeben
// ------------------------------------------------------
// ------------------------------------------------------
// Gespeicherte Rezepte anzeigen
// ------------------------------------------------------

function showRecipeList() {

    console.log("\n--- Gespeicherte Rezepte ---");

    for (const recipe of recipes) {

        console.log(
            `${recipe.id}: ${recipe.name} | ` +
            `${recipe.kcal} kcal | ` +
            `${recipe.protein} g Protein | ` +
            `${recipe.carbs} g KH | ` +
            `${recipe.fat} g Fett`
        );
    }
}


// ------------------------------------------------------
// Bereits konsumierte Mahlzeiten eingeben
// ------------------------------------------------------

async function enterConsumedMeals() {

    const consumedMeals = [];

    console.log("\n--- Bereits konsumierte Mahlzeiten ---");

    const numberOfMeals =
        Number(await ask("Wie viele Mahlzeiten wurden bereits gegessen? "));


    for (let i = 0; i < numberOfMeals; i++) {

        console.log(`\n--- Mahlzeit ${i + 1} ---`);

        console.log("1 = Gespeichertes Rezept auswählen");
        console.log("2 = Mahlzeit manuell eingeben");

        const choice =
            await ask("Auswahl: ");


        // --------------------------------------------------
        // Gespeichertes Rezept auswählen
        // --------------------------------------------------

        if (choice === "1") {

            showRecipeList();

            const recipeId =
                Number(await ask("\nRezept-ID auswählen: "));

            const selectedRecipe =
                recipes.find(recipe => recipe.id === recipeId);


            if (selectedRecipe) {

                consumedMeals.push({
                    name: selectedRecipe.name,
                    kcal: selectedRecipe.kcal,
                    protein: selectedRecipe.protein,
                    carbs: selectedRecipe.carbs,
                    fat: selectedRecipe.fat
                });

                console.log(
                    `\n"${selectedRecipe.name}" wurde hinzugefügt.`
                );

            } else {

                console.log("Ungültige Rezept-ID.");

                // Diese Mahlzeit erneut eingeben
                i--;
            }
        }


        // --------------------------------------------------
        // Mahlzeit manuell eingeben
        // --------------------------------------------------

        else if (choice === "2") {

            const name =
                await ask("Name der Mahlzeit: ");

            const kcal =
                Number(await ask("Kalorien: "));

            const protein =
                Number(await ask("Protein in g: "));

            const carbs =
                Number(await ask("Kohlenhydrate in g: "));

            const fat =
                Number(await ask("Fett in g: "));


            consumedMeals.push({
                name,
                kcal,
                protein,
                carbs,
                fat
            });

            console.log(
                `\n"${name}" wurde als konsumierte Mahlzeit hinzugefügt.`
            );
        }


        // --------------------------------------------------
        // Ungültige Eingabe
        // --------------------------------------------------

        else {

            console.log("Ungültige Auswahl.");

            // gleiche Mahlzeit noch einmal abfragen
            i--;
        }
    }


    return consumedMeals;
}


// ------------------------------------------------------
// Nährwerte des Tages summieren
// ------------------------------------------------------

function calculateConsumed(consumedMeals) {

    const sum = {
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    for (const meal of consumedMeals) {

        sum.kcal += meal.kcal;
        sum.protein += meal.protein;
        sum.carbs += meal.carbs;
        sum.fat += meal.fat;
    }

    return sum;
}


// ------------------------------------------------------
// Differenz zum Tagesziel berechnen
// ------------------------------------------------------

function calculateDifference(consumed) {

    return {
        kcal: target.kcal - consumed.kcal,
        protein: target.protein - consumed.protein,
        carbs: target.carbs - consumed.carbs,
        fat: target.fat - consumed.fat
    };
}


// ------------------------------------------------------
// Bewertung eines Rezeptes
// Je kleiner der Score, desto besser
// ------------------------------------------------------

function calculateScore(recipe, consumed) {

    const afterMeal = {
        kcal: consumed.kcal + recipe.kcal,
        protein: consumed.protein + recipe.protein,
        carbs: consumed.carbs + recipe.carbs,
        fat: consumed.fat + recipe.fat
    };

    const kcalDifference =
        Math.abs(target.kcal - afterMeal.kcal) / target.kcal;

    const proteinDifference =
        Math.abs(target.protein - afterMeal.protein) / target.protein;

    const carbsDifference =
        Math.abs(target.carbs - afterMeal.carbs) / target.carbs;

    const fatDifference =
        Math.abs(target.fat - afterMeal.fat) / target.fat;


    const score =
        kcalDifference +
        proteinDifference +
        carbsDifference +
        fatDifference;

    return score;
}


// ------------------------------------------------------
// Bestes Rezept finden
// ------------------------------------------------------

function findBestRecipe(consumed) {

    let bestRecipe = null;
    let bestScore = Infinity;

    for (const recipe of recipes) {

        const score =
            calculateScore(recipe, consumed);

        if (score < bestScore) {

            bestScore = score;
            bestRecipe = recipe;
        }
    }

    return bestRecipe;
}


// ------------------------------------------------------
// Hauptprogramm
// ------------------------------------------------------

async function main() {

    console.log("=================================");
    console.log("      CookIt Meal Optimizer");
    console.log("=================================");

    await setTargets();

    const consumedMeals =
        await enterConsumedMeals();

    const consumed =
        calculateConsumed(consumedMeals);

    const difference =
        calculateDifference(consumed);

    console.log("\n--- Bisher konsumiert ---");

    console.log(`Kalorien:      ${consumed.kcal} kcal`);
    console.log(`Protein:       ${consumed.protein} g`);
    console.log(`Kohlenhydrate: ${consumed.carbs} g`);
    console.log(`Fett:          ${consumed.fat} g`);


    console.log("\n--- Noch benötigt ---");

    console.log(`Kalorien:      ${difference.kcal} kcal`);
    console.log(`Protein:       ${difference.protein} g`);
    console.log(`Kohlenhydrate: ${difference.carbs} g`);
    console.log(`Fett:          ${difference.fat} g`);


    const bestRecipe =
        findBestRecipe(consumed);


    console.log("\n=================================");
    console.log("Empfohlenes Rezept:");
    console.log("=================================");

    console.log(bestRecipe.name);

    console.log(`Kalorien:      ${bestRecipe.kcal} kcal`);
    console.log(`Protein:       ${bestRecipe.protein} g`);
    console.log(`Kohlenhydrate: ${bestRecipe.carbs} g`);
    console.log(`Fett:          ${bestRecipe.fat} g`);


    console.log("\n--- Tageswerte danach ---");

    console.log(
        `Kalorien:      ${consumed.kcal + bestRecipe.kcal} / ${target.kcal}`
    );

    console.log(
        `Protein:       ${consumed.protein + bestRecipe.protein} / ${target.protein} g`
    );

    console.log(
        `Kohlenhydrate: ${consumed.carbs + bestRecipe.carbs} / ${target.carbs} g`
    );

    console.log(
        `Fett:          ${consumed.fat + bestRecipe.fat} / ${target.fat} g`
    );


    rl.close();
}


main();