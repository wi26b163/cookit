/* Gemeinsame feste Auswahlwerte für Oberfläche und Server.
 * Allergengruppen: Anhang II der Verordnung (EU) Nr. 1169/2011.
 * Zutatenprodukte sind jeweils eingeschlossen; rechtliche Ausnahmen beachten.
 */
(function (global) {
    const catalog = {
        units: ["g", "dg", "kg", "ml", "l", "Stück", "Prise", "Pak"],
        allergens: [
            "Glutenhaltiges Getreide",
            "Krebstiere",
            "Eier",
            "Fisch",
            "Erdnüsse",
            "Soja",
            "Milch (einschließlich Laktose)",
            "Schalenfrüchte",
            "Sellerie",
            "Senf",
            "Sesam",
            "Schwefeldioxid und Sulphite",
            "Lupinen",
            "Weichtiere",
        ],
        notes: {
            "Glutenhaltiges Getreide":
                "Weizen (auch Dinkel und Khorasan), Roggen, Gerste, Hafer und Hybridstämme",
            Schalenfrüchte:
                "Mandeln, Haselnüsse, Walnüsse, Cashews, Pecannüsse, Paranüsse, Pistazien, Macadamianüsse",
            "Schwefeldioxid und Sulphite":
                "Mehr als 10 mg/kg oder 10 mg/l SO₂ im verzehrfertigen Lebensmittel",
        },
        // Bekannte alte Bezeichnungen zuordnen, unbekannte Werte niemals still löschen.
        legacyAllergens: {
            Gluten: "Glutenhaltiges Getreide",
            Milch: "Milch (einschließlich Laktose)",
            Fische: "Fisch",
            Sojabohnen: "Soja",
            Sesamsamen: "Sesam",
        },
    };
    if (typeof module !== "undefined" && module.exports) module.exports = catalog;
    else global.CookItCatalog = catalog;
})(globalThis);
