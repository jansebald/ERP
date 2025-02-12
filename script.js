"use strict";

// Liste der Lagerorte
const lagerorte = ["Wareneingang", "Chargierung", "Mischerei", "Füllerei", "Verpackung", "Kartonierung", "Versand"];

// Globaler Lagerbestand – wird aus dem localStorage geladen oder als leeres Array initialisiert
let lagerbestand = JSON.parse(localStorage.getItem("lagerbestand")) || [];

// Global für den aktuell gescannten Artikel
let currentScannedItem = null;

/* --------------- Funktionen für Dropdowns und Lagerbestand --------------- */

// Lagerorte in die Dropdown-Menüs laden
function ladeLagerorte() {
  const einbuchenDropdown = document.getElementById("lagerortEinbuchen");
  const ausbuchenDropdown = document.getElementById("lagerortAusbuchen");

  if (einbuchenDropdown) {
    einbuchenDropdown.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Bitte wählen...";
    defaultOption.value = "";
    einbuchenDropdown.appendChild(defaultOption);

    lagerorte.forEach(lagerort => {
      const option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      einbuchenDropdown.appendChild(option);
    });
  }

  if (ausbuchenDropdown) {
    ausbuchenDropdown.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Bitte wählen...";
    defaultOption.value = "";
    ausbuchenDropdown.appendChild(defaultOption);

    lagerorte.forEach(lagerort => {
      const option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      ausbuchenDropdown.appendChild(option);
    });
  }
}

// Eingabefelder leeren
function clearInputs() {
  const ids = [
    "produktname",
    "menge",
    "mhd",
    "ausbuchenProdukt",
    "ausbuchenMenge",
    "lagerortEinbuchen",
    "lagerortAusbuchen"
  ];
  ids.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
    }
  });
}

// Lagerbestand anzeigen
function zeigeLagerbestand() {
  const tabelle = document.getElementById("lagerbestandTabelle");
  if (!tabelle) return;
  tabelle.innerHTML = "";

  if (lagerbestand.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='4'>Kein Lagerbestand vorhanden.</td></tr>";
    return;
  }

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

// Alle Positionen löschen
function allePositionenLoeschen() {
  if (confirm("Möchten Sie wirklich alle Positionen im Lagerbestand löschen?")) {
    lagerbestand = [];
    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    zeigeLagerbestand();
    alert("Der Lagerbestand wurde erfolgreich geleert.");
  }
}

// Suche im Lagerbestand
function sucheLagerbestand() {
  const searchQuery = document.getElementById("search").value.toLowerCase();
  const filteredLagerbestand = lagerbestand.filter(produkt =>
    produkt.produktname.toLowerCase().includes(searchQuery) ||
    produkt.lagerort.toLowerCase().includes(searchQuery)
  );
  zeigeGefiltertenLagerbestand(filteredLagerbestand);
}

function zeigeGefiltertenLagerbestand(filteredLagerbestand) {
  const tabelle = document.getElementById("lagerbestandTabelle");
  tabelle.innerHTML = "";

  if (filteredLagerbestand.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='4'>Keine Produkte gefunden.</td></tr>";
    return;
  }

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

/* --------------- Funktionen für Ein- und Ausbuchen --------------- */

// Einbuchen eines Produkts inklusive Barcode-Generierung
function einbuchen() {
  const produktname = document.getElementById("produktname").value.trim();
  const menge = parseInt(document.getElementById("menge").value);
  const mhd = document.getElementById("mhd").value;
  const lagerort = document.getElementById("lagerortEinbuchen").value;

  if (!produktname || !menge || !mhd || !lagerort) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  if (menge <= 0) {
    alert("Die Menge muss größer als 0 sein.");
    return;
  }

  // Generiere einen eindeutigen Barcode (z. B. "WARE-<timestamp>-<zufallszahl>")
  const uniqueId = "WARE-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  // Erstelle einen neuen Eintrag – jeder Einbuchen-Vorgang ist hier ein eigener Datensatz
  const neuerEintrag = { produktname, menge, mhd, lagerort, barcode: uniqueId };
  lagerbestand.push(neuerEintrag);
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));

  alert(`${menge} von ${produktname} erfolgreich in Lagerort ${lagerort} eingebucht!`);

  clearInputs();
  zeigeLagerbestand();
  generateBarcodeLabel(uniqueId);
}

// Ausbuchen über das klassische Formular
function ausbuchen() {
  const produktname = document.getElementById("ausbuchenProdukt").value.trim();
  const menge = parseInt(document.getElementById("ausbuchenMenge").value);
  const lagerort = document.getElementById("lagerortAusbuchen").value;

  if (!produktname || !menge || !lagerort) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  if (menge <= 0) {
    alert("Die Menge muss größer als 0 sein.");
    return;
  }

  // Suchen anhand von Name (case-insensitive) und Lagerort
  const index = lagerbestand.findIndex(p =>
    p.produktname.toLowerCase() === produktname.toLowerCase() && p.lagerort === lagerort
  );

  if (index !== -1) {
    const produkt = lagerbestand[index];
    if (produkt.menge >= menge) {
      produkt.menge -= menge;
      if (produkt.menge === 0) {
        lagerbestand.splice(index, 1);
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
  zeigeLagerbestand();
}

/* --------------- Funktionen für Barcode-Etikett (Einbuchen) --------------- */

// Erzeugt das Barcode-Etikett und zeigt den Etikett-Container an
function generateBarcodeLabel(barcodeValue) {
  // Setze den Barcode-Wert als Text
  document.getElementById("barcodeValue").innerText = barcodeValue;
  // Erzeuge den Barcode im SVG-Element mit JsBarcode
  JsBarcode("#barcodeSvg", barcodeValue, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: false
  });
  // Blende den Etikett-Container ein
  document.getElementById("etikettContainer").style.display = "block";
}

function closeEtikett() {
  document.getElementById("etikettContainer").style.display = "none";
}

/* --------------- Funktionen für den Barcode-Scanner (Modal) --------------- */

// Wird aufgerufen, wenn ein Barcode gescannt wurde
function handleScannedBarcode(scannedCode) {
  // Suche den Datensatz anhand des Barcodes
  const item = lagerbestand.find(p => p.barcode === scannedCode);
  if (!item) {
    alert("Ware nicht gefunden!");
    return;
  }
  currentScannedItem = item;

  // Fülle das Modal mit den Informationen
  const modalInfo = document.getElementById("modalInfo");
  modalInfo.innerHTML = `<p><strong>Produkt:</strong> ${item.produktname}</p>
                         <p><strong>Menge:</strong> ${item.menge}</p>
                         <p><strong>MHD:</strong> ${item.mhd}</p>
                         <p><strong>Lagerort:</strong> ${item.lagerort}</p>
                         <p><strong>Barcode:</strong> ${item.barcode}</p>`;
  // Stelle sicher, dass der Umlagerungsabschnitt versteckt ist und die Standardaktionen angezeigt werden
  document.getElementById("umlagerungSection").style.display = "none";
  document.getElementById("modalActions").style.display = "block";
  // Zeige das Modal
  document.getElementById("scannedModal").style.display = "block";
}

// Schließt das Modal
function closeModal() {
  document.getElementById("scannedModal").style.display = "none";
  currentScannedItem = null;
}

// Ausbuchen der gescannten Ware (vollständiges Entfernen)
function ausbuchenScannedItem() {
  if (!currentScannedItem) return;
  // Entferne den Artikel aus dem Lagerbestand
  lagerbestand = lagerbestand.filter(p => p.barcode !== currentScannedItem.barcode);
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
  alert(`Die Ware ${currentScannedItem.produktname} wurde ausgebucht.`);
  closeModal();
  zeigeLagerbestand();
}

// Bereitet den Umlagerungsprozess vor, indem ein Dropdown mit möglichen Ziel-Lagerorten (außer dem aktuellen) angezeigt wird
function showUmlagerungOptions() {
  if (!currentScannedItem) return;
  // Verstecke die Standardaktionen
  document.getElementById("modalActions").style.display = "none";
  // Fülle das Dropdown mit Lagerorten, ausgenommen den aktuellen Lagerort
  const newLagerortSelect = document.getElementById("newLagerort");
  newLagerortSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Bitte wählen...";
  newLagerortSelect.appendChild(defaultOption);

  lagerorte.forEach(lagerort => {
    if (lagerort !== currentScannedItem.lagerort) {
      const option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      newLagerortSelect.appendChild(option);
    }
  });
  // Blende den Umlagerungsabschnitt ein
  document.getElementById("umlagerungSection").style.display = "block";
}

// Umlagern der gescannten Ware in den neuen Lagerort
function umlagernScannedItem() {
  const newLagerort = document.getElementById("newLagerort").value;
  if (!newLagerort) {
    alert("Bitte einen neuen Lagerort auswählen.");
    return;
  }
  currentScannedItem.lagerort = newLagerort;
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
  alert(`Die Ware ${currentScannedItem.produktname} wurde nach ${newLagerort} umlagert.`);
  closeModal();
  zeigeLagerbestand();
}

// Abbrechen der Umlagerung: Blende den Umlagerungsabschnitt wieder aus und zeige die Standardaktionen
function cancelUmlagerung() {
  document.getElementById("umlagerungSection").style.display = "none";
  document.getElementById("modalActions").style.display = "block";
}

// Beim Laden der Seite: Dropdowns laden und Lagerbestand anzeigen
window.onload = function() {
  ladeLagerorte();
  zeigeLagerbestand();
};