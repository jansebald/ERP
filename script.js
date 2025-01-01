// Liste der Lagerorte (dies könnte auch aus einer externen Quelle kommen)
const lagerorte = ["Wareneingang", "Chargierung", "Mischerei", "Füllerei", "Verpackung", "Kartonierung", "Versand"];

// Funktion zum Laden der Lagerorte in die Dropdown-Menüs
function ladeLagerorte() {
    const einbuchenLagerortDropdown = document.getElementById("lagerortEinbuchen");
    const ausbuchenLagerortDropdown = document.getElementById("lagerortAusbuchen");

    // Leeren der Dropdowns, falls sie schon Optionen haben
    einbuchenLagerortDropdown.innerHTML = "";
    ausbuchenLagerortDropdown.innerHTML = "";

    // Erstelle eine Standard-Option
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Bitte wählen...";
    defaultOption.value = "";
    einbuchenLagerortDropdown.appendChild(defaultOption);
    ausbuchenLagerortDropdown.appendChild(defaultOption);

    // Füge die Lagerorte zum Einbuchen- und Ausbuchen-Dropdown hinzu
    lagerorte.forEach(lagerort => {
        // Option für Einbuchen
        const optionEinbuchen = document.createElement("option");
        optionEinbuchen.value = lagerort;
        optionEinbuchen.textContent = lagerort;
        einbuchenLagerortDropdown.appendChild(optionEinbuchen);

        // Option für Ausbuchen
        const optionAusbuchen = document.createElement("option");
        optionAusbuchen.value = lagerort;
        optionAusbuchen.textContent = lagerort;
        ausbuchenLagerortDropdown.appendChild(optionAusbuchen);
    });
}

// Diese Funktion wird aufgerufen, wenn die Seite geladen wird
window.onload = function() {
    ladeLagerorte();
};

// Funktion zum Einbuchen eines Produkts
function einbuchen() {
    const produktname = document.getElementById("produktname").value;
    const menge = parseInt(document.getElementById("menge").value);
    const mhd = document.getElementById("mhd").value;
    const lagerort = document.getElementById("lagerortEinbuchen").value;

    if (!produktname || !menge || !mhd || !lagerort) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    // Lagerbestand aktualisieren (oder hinzufügen)
    const produkt = lagerbestand.find(p => p.produktname === produktname && p.lagerort === lagerort);
    if (produkt) {
        produkt.menge += menge;
    } else {
        lagerbestand.push({ produktname, menge, mhd, lagerort });
    }

    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    alert(`${menge} von ${produktname} erfolgreich in ${lagerort} eingebucht!`);
    clearInputs();
}

// Funktion zum Ausbuchen eines Produkts
function ausbuchen() {
    const produktname = document.getElementById("ausbuchenProdukt").value;
    const menge = parseInt(document.getElementById("ausbuchenMenge").value);
    const lagerort = document.getElementById("lagerortAusbuchen").value;

    if (!produktname || !menge || !lagerort) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    const produkt = lagerbestand.find(p => p.produktname === produktname && p.lagerort === lagerort);

    if (produkt) {
        if (produkt.menge >= menge) {
            produkt.menge -= menge;
            if (produkt.menge === 0) {
                lagerbestand = lagerbestand.filter(p => p !== produkt);
            }
            localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
            alert(`${menge} von ${produktname} aus ${lagerort} erfolgreich ausgebucht.`);
        } else {
            alert("Nicht genügend Bestand verfügbar!");
        }
    } else {
        alert("Produkt oder Lagerort nicht gefunden!");
    }

    clearInputs();
}

// Funktion zum Löschen der Eingabefelder
function clearInputs() {
    document.getElementById("produktname").value = "";
    document.getElementById("menge").value = "";
    document.getElementById("mhd").value = "";
    document.getElementById("ausbuchenProdukt").value = "";
    document.getElementById("ausbuchenMenge").value = "";
    document.getElementById("lagerortEinbuchen").value = "";
    document.getElementById("lagerortAusbuchen").value = "";
}
// Lagerbestand speichern
let lagerbestand = JSON.parse(localStorage.getItem("lagerbestand")) || [];

// Einbuchen von Waren
function einbuchen() {
    const produktname = document.getElementById("produktname").value;
    const menge = parseInt(document.getElementById("menge").value);
    const mhd = document.getElementById("mhd").value;
    const lagerort = document.getElementById("lagerortEinbuchen").value; // Ausgewählten Lagerort

    if (!produktname || !menge || !mhd || !lagerort) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    // Produkt im Lagerbestand suchen
    const produkt = lagerbestand.find(p => p.produktname === produktname && p.lagerort === lagerort);
    if (produkt) {
        produkt.menge += menge;
    } else {
        lagerbestand.push({ produktname, menge, mhd, lagerort });
    }

    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    alert(`${menge} von ${produktname} erfolgreich in Lagerort ${lagerort} eingebucht!`);
    clearInputs();
}

// Ausbuchen von Waren
function ausbuchen() {
    const produktname = document.getElementById("ausbuchenProdukt").value;
    const menge = parseInt(document.getElementById("ausbuchenMenge").value);
    const lagerort = document.getElementById("lagerortAusbuchen").value; // Ausgewählten Lagerort

    if (!produktname || !menge || !lagerort) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    // Produkt anhand von Name und Lagerort suchen
    const produkt = lagerbestand.find(p => p.produktname === produktname && p.lagerort === lagerort);

    if (produkt) {
        if (produkt.menge >= menge) {
            produkt.menge -= menge;

            if (produkt.menge === 0) {
                // Produkt entfernen, wenn keine Menge mehr übrig ist
                lagerbestand = lagerbestand.filter(p => p !== produkt);
            }

            localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
            alert(`${menge} von ${produktname} aus Lagerort ${lagerort} erfolgreich ausgebucht.`);
        } else {
            alert("Nicht genügend Bestand verfügbar!");
        }
    } else {
        alert("Produkt oder Lagerort nicht gefunden!");
    }

    clearInputs();
}

// Lagerbestand anzeigen
function zeigeLagerbestand() {
    const tabelle = document.getElementById("lagerbestandTabelle");
    tabelle.innerHTML = "";

    lagerbestand.forEach(produkt => {
        const row = `<tr>
            <td>${produkt.produktname}</td>
            <td>${produkt.menge}</td>
            <td>${produkt.mhd}</td>
            <td>${produkt.lagerort}</td>
        </tr>`;
        tabelle.innerHTML += row;
    });
}

// Eingabefelder leeren
function clearInputs() {
    document.getElementById("produktname").value = "";
    document.getElementById("menge").value = "";
    document.getElementById("mhd").value = "";
    document.getElementById("lagerort").value = "";
    document.getElementById("ausbuchenProdukt").value = "";
    document.getElementById("ausbuchenMenge").value = "";
    document.getElementById("ausbuchenLagerort").value = "";
}
function allePositionenLoeschen() {
    if (confirm("Möchten Sie wirklich alle Positionen im Lagerbestand löschen?")) {
        lagerbestand = []; // Setzt den Lagerbestand zurück
        localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand)); // Speicher im localStorage löschen
        zeigeLagerbestand(); // Aktualisiere die Anzeige
        alert("Der Lagerbestand wurde erfolgreich geleert.");
    }
}
// Funktion zur Suche im Lagerbestand
function sucheLagerbestand() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const filteredLagerbestand = lagerbestand.filter(produkt => {
        // Sucht im Produktnamen und im Lagerort nach dem Suchbegriff
        return produkt.produktname.toLowerCase().includes(searchQuery) ||
               produkt.lagerort.toLowerCase().includes(searchQuery);
    });

    // Lagerbestand mit den gefilterten Produkten anzeigen
    zeigeGefiltertenLagerbestand(filteredLagerbestand);
}

// Funktion zur Anzeige der gefilterten Lagerbestände
function zeigeGefiltertenLagerbestand(filteredLagerbestand) {
    const tabelle = document.getElementById("lagerbestandTabelle");
    tabelle.innerHTML = ""; // Tabelle leeren

    // Wenn keine Produkte gefunden wurden
    if (filteredLagerbestand.length === 0) {
        tabelle.innerHTML = "<tr><td colspan='4'>Keine Produkte gefunden.</td></tr>";
        return;
    }

    // Filterte Produkte anzeigen
    filteredLagerbestand.forEach(produkt => {
        const row = `<tr>
            <td>${produkt.produktname}</td>
            <td>${produkt.menge}</td>
            <td>${produkt.mhd}</td>
            <td>${produkt.lagerort}</td>
        </tr>`;
        tabelle.innerHTML += row;
    });
}

// Funktion zum Laden des gesamten Lagerbestands
function zeigeLagerbestand() {
    const tabelle = document.getElementById("lagerbestandTabelle");
    tabelle.innerHTML = ""; // Tabelle leeren

    lagerbestand.forEach(produkt => {
        const row = `<tr>
            <td>${produkt.produktname}</td>
            <td>${produkt.menge}</td>
            <td>${produkt.mhd}</td>
            <td>${produkt.lagerort}</td>
        </tr>`;
        tabelle.innerHTML += row;
    });
}