const catalog = CookItCatalog;
const defaultTargets = [2500, 180, 280, 75];
// Hilfsfunktionen und Zustand der Oberfläche
const $ = (id) => document.getElementById(id),
    keys = ["kcal", "protein", "carbs", "fat"],
    labels = ["Kalorien (kcal)", "Protein (g)", "Kohlenhydrate (g)", "Fett (g)"];
let recipes = [],
    editing = null,
    meals = [],
    selected = null,
    scale = 1;
const esc = (s) =>
    String(s ?? "").replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
const fmt = (n) =>
    n == null ? "—" : new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 }).format(n);
const allergens = (r) => [...new Set(r.ingredients.flatMap((i) => i.allergens || []))];
const complete = (r) => r.nutrition && keys.every((k) => r.nutrition[k] != null);
function notify(s) {
    $("message").textContent = s;
    setTimeout(() => ($("message").textContent = ""), 5000);
}
// Kommunikation mit dem lokalen Server
async function api(method, data) {
    const r = await fetch("/api/recipes", {
        method,
        headers: { "Content-Type": "application/json" },
        ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const v = await r.json();
    if (!r.ok) throw Error(v.error || "Anfrage fehlgeschlagen");
    return v;
}
// Rezeptkarten und Filter
function card(r, extra = "") {
    return `<article class="card"><span class="badge">${esc(r.diet_type)}</span><button class="heart ${r.favorite ? "on" : ""}" data-fav="${r.recipe_id}" aria-label="${r.favorite ? "Favorit entfernen" : "Als Favorit speichern"}" aria-pressed="${!!r.favorite}">${r.favorite ? "♥" : "♡"}</button><h2>${esc(r.name)}</h2><div class="meta"><span>${fmt(r.preparation_time)} Min.</span><span>${fmt(r.base_portions)} Grundportionen</span></div><div class="values"><div><strong>${fmt(r.nutrition?.kcal)}</strong>kcal / Portion</div><div><strong>${fmt(r.nutrition?.protein)} g</strong>Protein</div></div><p class="muted">${r.nutrition ? "Manuell erfasste Nährwerte" : "Nährwerte nicht erfasst"}</p>${extra}<button class="open" data-open="${r.recipe_id}">Rezept ansehen</button></article>`;
}
function render() {
    const all = [...catalog.allergens].sort();
    const prev = $("exclude").value;
    $("exclude").innerHTML =
        '<option value="">Allergen ausschließen</option>' +
        all.map((a) => `<option>${esc(a)}</option>`).join("");
    $("exclude").value = prev;
    let list = recipes.filter(
        (r) =>
            (!$("diet").value || r.diet_type === $("diet").value) &&
            (!$("favorites").checked || r.favorite) &&
            (!$("exclude").value || !allergens(r).includes($("exclude").value)) &&
            (r.name + " " + r.ingredients.map((i) => i.name).join(" "))
                .toLowerCase()
                .includes($("search").value.toLowerCase()),
    );
    const sort = $("sort").value;
    if (["new", "old"].includes(sort))
        list.sort(
            (a, b) =>
                (sort === "new" ? -1 : 1) *
                (a.created_at.localeCompare(b.created_at) || a.recipe_id - b.recipe_id),
        );
    else {
        const [key, dir] = sort.split("-");
        list.sort((a, b) => {
            const x = a.nutrition?.[key],
                y = b.nutrition?.[key];
            return x == null
                ? y == null
                    ? 0
                    : 1
                : y == null
                  ? -1
                  : (dir === "up" ? 1 : -1) * (x - y);
        });
    }
    $("stats").innerHTML = [
        [recipes.length, "Gespeicherte Rezepte"],
        [recipes.filter((r) => r.favorite).length, "Favoriten"],
        [
            recipes.filter((r) => ["Vegan", "Vegetarisch"].includes(r.diet_type)).length,
            "Vegetarisch & vegan",
        ],
        [recipes.filter((r) => r.nutrition).length, "Mit Nährwertangaben"],
    ]
        .map(([n, t]) => `<div class="stat"><strong>${n}</strong><span>${t}</span></div>`)
        .join("");
    $("count").textContent = `${list.length} Rezepte angezeigt`;
    $("grid").innerHTML =
        list.map((r) => card(r)).join("") ||
        '<div class="empty">Keine passenden Rezepte. Passe deine Filter an oder lege ein Rezept an.</div>';
    renderOptimizer();
}
// Formular: Zutaten und Rezeptbearbeitung
function ingredient(i = { name: "", amount: "", unit: "g", allergens: [] }) {
    const row = document.createElement("div");
    row.className = "ingredients";
    const chosen = (i.allergens || []).map((a) => catalog.legacyAllergens[a] || a);
    const unknown = chosen.filter((a) => !catalog.allergens.includes(a));
    const oldUnit = i.unit && !catalog.units.includes(i.unit);
    row.innerHTML = `
        <input class="ingredient-name" aria-label="Zutat" placeholder="Zutat" value="${esc(i.name)}" required>
        <input class="ingredient-amount" aria-label="Menge" type="number" min="0.01" step="any" placeholder="Menge" value="${esc(i.amount)}" required>
        <select class="ingredient-unit" aria-label="Einheit" required>
            ${oldUnit ? '<option value="" disabled selected>Einheit neu auswählen</option>' : ""}
            ${catalog.units.map((u) => `<option value="${esc(u)}" ${u === (i.unit || "g") ? "selected" : ""}>${esc(u)}</option>`).join("")}
        </select>
        <div class="allergen-cell">
            <details class="allergen-dropdown">
                <summary>Allergene auswählen</summary>
                <div class="allergen-options">
                    ${catalog.allergens
                        .map(
                            (a) => `
                        <label class="allergen-option">
                            <input type="checkbox" value="${esc(a)}" ${chosen.includes(a) ? "checked" : ""}>
                            <span>${esc(a)}${catalog.notes[a] ? `<small>${esc(catalog.notes[a])}</small>` : ""}</span>
                        </label>`,
                        )
                        .join("")}
                </div>
            </details>
            ${unknown.length ? `<p class="legacy-warning">Bisherige Angabe: ${esc(unknown.join(", "))}. Bitte korrekt zuordnen.</p><label class="check"><input class="legacy-confirm" type="checkbox" required> Alte Angaben geprüft</label>` : ""}
            ${oldUnit ? `<p class="legacy-warning">Bisherige Einheit: ${esc(i.unit)}. Menge bei Bedarf anpassen.</p>` : ""}
        </div>
        <button type="button" aria-label="Zutat entfernen">×</button>
    `;
    function updateSummary() {
        const count = row.querySelectorAll(".allergen-options input:checked").length;
        row.querySelector("summary").textContent = count
            ? `${count} Allergene ausgewählt`
            : "Allergene auswählen";
    }
    row.querySelector(".allergen-options").onchange = updateSummary;
    row.querySelector("button").onclick = () => row.remove();
    updateSummary();
    $("ingredientRows").append(row);
}
function openEditor(r = null) {
    editing = r;
    const f = $("recipeForm");
    f.reset();
    $("editorTitle").textContent = r ? "Rezept bearbeiten" : "Neues Rezept";
    for (const k of ["name", "base_portions", "diet_type", "preparation_time", "instructions"])
        if (r) f.elements[k].value = r[k] ?? "";
    f.elements.favorite.checked = !!r?.favorite;
    $("ingredientRows").innerHTML = "";
    (r?.ingredients || [{}]).forEach(ingredient);
    $("nutritionFields").innerHTML = keys
        .map(
            (k, i) =>
                `<label>${labels[i]}<input name="${k}" type="number" min="0" step="any" value="${r?.nutrition?.[k] ?? ""}"></label>`,
        )
        .join("");
    $("editor").showModal();
}
$("recipeForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const ingredients = [...$("ingredientRows").children].map((r, i) => {
        return {
            ingredient_id: i + 1,
            name: r.querySelector(".ingredient-name").value.trim(),
            amount: Number(r.querySelector(".ingredient-amount").value),
            unit: r.querySelector(".ingredient-unit").value,
            allergens: [...r.querySelectorAll(".allergen-options input:checked")].map(
                (input) => input.value,
            ),
        };
    });
    if (!ingredients.length) return notify("Mindestens eine Zutat hinzufügen.");
    const nutrition = Object.fromEntries(
        keys.map((k) => [k, f.elements[k].value === "" ? null : Number(f.elements[k].value)]),
    );
    const data = {
        recipe_id: editing?.recipe_id,
        name: f.elements.name.value.trim(),
        base_portions: Number(f.elements.base_portions.value),
        diet_type: f.elements.diet_type.value,
        preparation_time: Number(f.elements.preparation_time.value),
        instructions: f.elements.instructions.value,
        favorite: f.elements.favorite.checked,
        ingredients,
        nutrition: keys.every((k) => nutrition[k] === null) ? null : nutrition,
    };
    $("saveRecipe").disabled = true;
    try {
        recipes = await api(editing ? "PUT" : "POST", data);
        $("editor").close();
        render();
        notify("Rezept gespeichert.");
    } catch (e) {
        notify(e.message);
    } finally {
        $("saveRecipe").disabled = false;
    }
};
// Rezeptdetails und proportionale Skalierung
function detail(r) {
    selected = r;
    scale = 1;
    drawDetail();
    $("detail").showModal();
}
function drawDetail() {
    const r = selected;
    $("detailContent").innerHTML =
        `<div class="modalhead"><div><p class="eyebrow">${esc(r.diet_type)} · ${fmt(r.preparation_time)} MINUTEN</p><h2>${esc(r.name)}</h2></div><button class="close" id="closeDetail" aria-label="Schließen">×</button></div><div class="scale"><label>Gewünschte Portionen<input id="portionScale" type="number" min="0.01" step="any" value="${r.base_portions * scale}"></label><label>Nach einer Zutat skalieren<select id="ingredientScale">${r.ingredients.map((i, n) => `<option value="${n}">${esc(i.name)} (${esc(i.unit)})</option>`).join("")}</select></label><label>Zielmenge der Zutat<input id="amountScale" type="number" min="0.01" step="any" value="${r.ingredients[0].amount * scale}"></label></div><p class="muted">Grundrezept: ${fmt(r.base_portions)} Portionen · Faktor <span id="factor"></span></p><table class="detailtable"><thead><tr><th>Menge</th><th>Zutat</th><th>Allergene</th></tr></thead><tbody id="scaledIngredients"></tbody></table><h3>Zubereitung</h3><ol>${(
            r.instructions || "Keine Zubereitung erfasst."
        )
            .split("\n")
            .filter(Boolean)
            .map((s) => `<li>${esc(s)}</li>`)
            .join(
                "",
            )}</ol><h3>Nährwerte</h3><div id="scaledNutrition"></div><p class="muted">${r.nutrition ? "Manuell erfasst; Werte pro Portion bleiben bei reiner Mengen-Skalierung gleich." : "Für dieses Rezept wurden keine Nährwerte erfasst."}</p><div class="actions"><button id="cancelDetail">Abbrechen</button><button class="danger" id="deleteRecipe">Löschen</button><button id="editRecipe">Bearbeiten</button><button class="primary" id="printRecipe">Drucken</button></div>`;
    updateScale();
    $("closeDetail").onclick = () => $("detail").close();
    $("cancelDetail").onclick = () => $("detail").close();
    $("portionScale").oninput = () => {
        const n = Number($("portionScale").value);
        if (n > 0) {
            scale = n / r.base_portions;
            $("amountScale").value =
                r.ingredients[Number($("ingredientScale").value)].amount * scale;
            updateScale();
        }
    };
    $("ingredientScale").onchange = () =>
        ($("amountScale").value = r.ingredients[Number($("ingredientScale").value)].amount * scale);
    $("amountScale").oninput = () => {
        const n = Number($("amountScale").value);
        if (n > 0) {
            scale = n / r.ingredients[Number($("ingredientScale").value)].amount;
            $("portionScale").value = r.base_portions * scale;
            updateScale();
        }
    };
    $("printRecipe").onclick = () => window.print();
    $("editRecipe").onclick = () => {
        $("detail").close();
        openEditor(r);
    };
    $("deleteRecipe").onclick = async () => {
        if (!confirm(`„${r.name}“ löschen?`)) return;
        try {
            recipes = await api("DELETE", { recipe_id: r.recipe_id });
            $("detail").close();
            render();
            notify("Rezept gelöscht.");
        } catch (e) {
            notify(e.message);
        }
    };
}
function updateScale() {
    $("factor").textContent = fmt(scale);
    $("scaledIngredients").innerHTML = selected.ingredients
        .map(
            (i) =>
                `<tr><td>${fmt(i.amount * scale)} ${esc(i.unit)}</td><td>${esc(i.name)}</td><td>${esc((i.allergens || []).join(", ") || "Keine erfasst")}</td></tr>`,
        )
        .join("");
    $("scaledNutrition").innerHTML =
        `<table class="detailtable"><tr><th>Nährwert</th><th>Pro Portion</th><th>Gesamt (${fmt(selected.base_portions * scale)} Portionen)</th></tr>${keys.map((k, i) => `<tr><td>${labels[i]}</td><td>${fmt(selected.nutrition?.[k])}</td><td>${fmt(selected.nutrition?.[k] == null ? null : selected.nutrition[k] * selected.base_portions * scale)}</td></tr>`).join("")}</table>`;
}
document.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]"),
        f = e.target.closest("[data-fav]");
    if (o) detail(recipes.find((r) => r.recipe_id === Number(o.dataset.open)));
    if (f) {
        const r = recipes.find((r) => r.recipe_id === Number(f.dataset.fav));
        f.disabled = true;
        try {
            recipes = await api("PUT", { ...r, favorite: !r.favorite });
            render();
        } catch (e) {
            notify(e.message);
            f.disabled = false;
        }
    }
});
// Tagesbilanz und Rezeptempfehlungen
function renderOptimizer() {
    const prev = $("mealRecipe").value;
    $("mealRecipe").innerHTML =
        '<option value="manual">Mahlzeit manuell erfassen</option>' +
        recipes
            .filter(complete)
            .map((r) => `<option value="${r.recipe_id}">${esc(r.name)}</option>`)
            .join("");
    $("mealRecipe").value = prev || "manual";
    if (!$("mealRecipe").value) $("mealRecipe").value = "manual";
    $("manualMeal").hidden = $("mealRecipe").value !== "manual";
    $("meals").innerHTML =
        meals
            .map(
                (m, i) =>
                    `<div class="meal"><span>${esc(m.name)} · ${fmt(m.kcal)} kcal</span><button data-remove="${i}" aria-label="Mahlzeit entfernen">×</button></div>`,
            )
            .join("") ||
        '<p class="muted">Noch keine Mahlzeiten eingetragen. Diese Tagesliste gilt bis zum Neuladen.</p>';
    const target = Object.fromEntries(keys.map((k) => [k, Number($("target-" + k).value)])),
        sum = Object.fromEntries(keys.map((k) => [k, meals.reduce((s, m) => s + m[k], 0)]));
    $("balance").innerHTML = keys
        .map(
            (k, i) =>
                `<div class="stat"><span>${labels[i]}</span><strong>${fmt(sum[k])} / ${fmt(target[k])}</strong><span>${sum[k] > target[k] ? "Ziel überschritten um " + fmt(sum[k] - target[k]) : "Verbleibend: " + fmt(target[k] - sum[k])}</span></div>`,
        )
        .join("");
    if (keys.some((k) => !Number.isFinite(target[k]) || target[k] <= 0)) {
        $("recommendations").innerHTML =
            '<div class="empty">Alle Tagesziele müssen größer als 0 sein.</div>';
        return;
    }
    const ranked = recipes
        .filter(complete)
        .map((r) => ({
            r,
            score: keys.reduce(
                (s, k) => s + Math.abs(target[k] - sum[k] - r.nutrition[k]) / target[k],
                0,
            ),
        }))
        .sort((a, b) => a.score - b.score);
    $("recommendations").innerHTML =
        ranked
            .slice(0, 3)
            .map(({ r, score }, i) =>
                card(
                    r,
                    `<p class="muted">Platz ${i + 1} · Abweichungswert ${fmt(score)} (kleiner ist besser)</p>`,
                ),
            )
            .join("") ||
        '<div class="empty">Noch keine Rezepte mit vollständigen Nährwerten vorhanden.</div>';
}
$("targets").innerHTML = keys
    .map(
        (k, i) =>
            `<label>${labels[i]}<input id="target-${k}" type="number" min="1" step="any" value="${defaultTargets[i]}"></label>`,
    )
    .join("");
$("manualValues").innerHTML = keys
    .map(
        (k, i) =>
            `<label>${labels[i]}<input id="manual-${k}" type="number" min="0" step="any"></label>`,
    )
    .join("");
// Alle Optimierer-Eingaben zurücksetzen; die Rezeptsammlung bleibt erhalten.
$("resetOptimizer").onclick = () => {
    meals = [];
    keys.forEach((key, i) => {
        $("target-" + key).value = defaultTargets[i];
        $("manual-" + key).value = "";
    });
    $("mealName").value = "";
    $("mealPortions").value = "1";
    $("mealRecipe").value = "manual";
    renderOptimizer();
    notify("Alle Optimierer-Eingaben wurden zurückgesetzt.");
};
$("targets").oninput = renderOptimizer;
$("mealRecipe").onchange = renderOptimizer;
$("mealForm").onsubmit = (e) => {
    e.preventDefault();
    const p = Number($("mealPortions").value);
    if (p <= 0) return;
    let n, name;
    if ($("mealRecipe").value === "manual") {
        name = $("mealName").value.trim();
        if (
            !name ||
            keys.some((k) => $("manual-" + k).value === "" || Number($("manual-" + k).value) < 0)
        )
            return notify("Name und alle vier Nährwerte für die manuelle Mahlzeit eingeben.");
        n = Object.fromEntries(keys.map((k) => [k, Number($("manual-" + k).value)]));
    } else {
        const r = recipes.find((r) => r.recipe_id === Number($("mealRecipe").value));
        n = r.nutrition;
        name = r.name;
    }
    meals.push({
        name: name + " (" + fmt(p) + " Portionen)",
        ...Object.fromEntries(keys.map((k) => [k, n[k] * p])),
    });
    renderOptimizer();
};
$("meals").onclick = (e) => {
    const b = e.target.closest("[data-remove]");
    if (b) {
        meals.splice(Number(b.dataset.remove), 1);
        renderOptimizer();
    }
};
// Bedienelemente verbinden und Anwendung starten
$("newRecipe").onclick = () => openEditor();
$("addIngredient").onclick = () => ingredient();
for (const id of ["closeEditor", "cancelEditor"]) $(id).onclick = () => $("editor").close();
for (const id of ["search", "diet", "exclude", "sort", "favorites"])
    $(id).addEventListener("input", render);
function navigate(opt) {
    $("collection").hidden = opt;
    $("optimizer").hidden = !opt;
    $("recipesNav").classList.toggle("active", !opt);
    $("optimizerNav").classList.toggle("active", opt);
}
$("recipesNav").onclick = () => navigate(false);
$("optimizerNav").onclick = () => navigate(true);
function prefs() {
    document.body.classList.toggle("dark", $("theme").value === "dark");
    document.documentElement.style.fontSize = $("font").value + "px";
    try {
        localStorage.setItem(
            "cookit-ui",
            JSON.stringify({ theme: $("theme").value, font: $("font").value }),
        );
    } catch {}
}
try {
    const p = JSON.parse(localStorage.getItem("cookit-ui") || "{}");
    $("theme").value = p.theme || "light";
    $("font").value = p.font || "16";
} catch {}
$("theme").onchange = prefs;
$("font").onchange = prefs;
prefs();
api("GET")
    .then((r) => {
        recipes = r;
        render();
    })
    .catch((e) => {
        $("grid").innerHTML =
            '<div class="empty">Rezepte konnten nicht geladen werden. Bitte App neu laden.</div>';
        notify(e.message);
    });
