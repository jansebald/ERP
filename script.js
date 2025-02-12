"use strict";

// Liste der Lagerorte
const lagerorte = ["Wareneingang", "Chargierung", "Mischerei", "Füllerei", "Verpackung", "Kartonierung", "Versand"];

// Globaler Lagerbestand – wird aus dem localStorage geladen oder als leeres Array initialisiert
let lagerbestand = JSON.parse(localStorage.getItem("lagerbestand")) || [];

// Global für den aktuell gescannten Artikel (wird z. B. im Barcode-Scanner genutzt)
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

// Lagerbestand anzeigen – jede Zeile ist klickbar und öffnet das Detail-Modal
function zeigeLagerbestand() {
  const tabelle = document.getElementById("lagerbestandTabelle");
  if (!tabelle) return;
  tabelle.innerHTML = "";

  if (lagerbestand.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='4'>Kein Lagerbestand vorhanden.</td></tr>";
    return;
  }

  lagerbestand.forEach((produkt, index) => {
    const row = `<tr onclick="openProductModal(${index})" style="cursor: pointer;">
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

  filteredLagerbestand.forEach((produkt, index) => {
    const row = `<tr onclick="openProductModal(${index})" style="cursor: pointer;">
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
    </tr>`;
    tabelle.innerHTML += row;
  });
}

/* --------------- Funktionen für Ein- und Ausbuchen --------------- */

// Einbuchen eines Produkts inklusive Barcode-Generierung und Erfassung des Buchungszeitpunkts
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

  // Neuer Datensatz inkl. Erfassung des Buchungszeitpunkts
  const neuerEintrag = {
    produktname,
    menge,
    mhd,
    lagerort,
    barcode: uniqueId,
    eingebuchtAm: new Date().toLocaleString()
  };

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
  document.getElementById("barcodeValue").innerText = barcodeValue;
  JsBarcode("#barcodeSvg", barcodeValue, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: false
  });
  document.getElementById("etikettContainer").style.display = "block";
}

function closeEtikett() {
  document.getElementById("etikettContainer").style.display = "none";
}

/* --------------- Funktionen für den Barcode-Scanner (Modal) --------------- */

// Wird aufgerufen, wenn ein Barcode gescannt wurde
function handleScannedBarcode(scannedCode) {
  const item = lagerbestand.find(p => p.barcode === scannedCode);
  if (!item) {
    alert("Ware nicht gefunden!");
    return;
  }
  currentScannedItem = item;

  const modalInfo = document.getElementById("modalInfo");
  modalInfo.innerHTML = `<p><strong>Produkt:</strong> ${item.produktname}</p>
                         <p><strong>Menge:</strong> ${item.menge}</p>
                         <p><strong>MHD:</strong> ${item.mhd}</p>
                         <p><strong>Lagerort:</strong> ${item.lagerort}</p>
                         <p><strong>Barcode:</strong> ${item.barcode}</p>`;
  document.getElementById("umlagerungSection").style.display = "none";
  document.getElementById("modalActions").style.display = "block";
  document.getElementById("scannedModal").style.display = "block";
}

function closeModal() {
  document.getElementById("scannedModal").style.display = "none";
  currentScannedItem = null;
}

function ausbuchenScannedItem() {
  if (!currentScannedItem) return;
  lagerbestand = lagerbestand.filter(p => p.barcode !== currentScannedItem.barcode);
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
  alert(`Die Ware ${currentScannedItem.produktname} wurde ausgebucht.`);
  closeModal();
  zeigeLagerbestand();
}

function showUmlagerungOptions() {
  if (!currentScannedItem) return;
  document.getElementById("modalActions").style.display = "none";
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
  document.getElementById("umlagerungSection").style.display = "block";
}

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

function cancelUmlagerung() {
  document.getElementById("umlagerungSection").style.display = "none";
  document.getElementById("modalActions").style.display = "block";
}

/* --------------- Funktionen für das Produkt-Detail Modal --------------- */

// Öffnet das Modal und füllt es mit den Details des angeklickten Produkts
function openProductModal(index) {
    const produkt = lagerbestand[index];
    const modal = document.getElementById("productModal");
    const content = document.getElementById("productDetailContent");
  
    // Fülle das Modal mit den Produktdetails inklusive Barcode
    content.innerHTML = `
      <p><strong>Produkt:</strong> ${produkt.produktname}</p>
      <p><strong>Menge:</strong> ${produkt.menge}</p>
      <p><strong>MHD:</strong> ${produkt.mhd}</p>
      <p><strong>Lagerort:</strong> ${produkt.lagerort}</p>
      <p><strong>Eingebucht am:</strong> ${produkt.eingebuchtAm || '-'}</p>
      <div id="modalBarcodeContainer" style="margin-top:10px;">
        <svg id="modalBarcodeSvg"></svg>
        <p id="modalBarcodeValue">${produkt.barcode}</p>
      </div>
    `;
  
    // Generiere den Barcode sofort im Modal
    JsBarcode("#modalBarcodeSvg", produkt.barcode, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: false
    });
  
    modal.style.display = "block";
  }

function toggleBarcodeDisplay(barcodeValue) {
    const container = document.getElementById("modalBarcodeContainer");
    if (container.style.display === "none") {
      container.style.display = "block";
      // Barcode generieren (falls noch nicht generiert)
      JsBarcode("#modalBarcodeSvg", barcodeValue, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false
      });
    } else {
      container.style.display = "none";
    }
  }

  // Beispiel: Statt direkt im HTML:
// <tr onclick="openProductModal(${index})" style="cursor: pointer;"> ... </tr>
// ... kannst du das dynamisch mit JavaScript machen:
function addRowEventListeners() {
    const rows = document.querySelectorAll("#lagerbestandTabelle tr");
    rows.forEach(row => {
      row.addEventListener("click", function() {
        // Hier kannst du z.B. einen Datensatzindex aus einem data-Attribut auslesen
        const index = this.getAttribute("data-index");
        openProductModal(index);
      });
      // Zusätzlich für Touch:
      row.addEventListener("touchend", function() {
        const index = this.getAttribute("data-index");
        openProductModal(index);
      });
    });
  }

// Schließt das Produkt-Detail Modal
function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

// Öffnet ein neues Fenster mit dem Barcode, um diesen zu drucken
function printBarcode() {
  const barcodeContainer = document.getElementById("modalBarcodeContainer").innerHTML;
  const printWindow = window.open('', '', 'width=400,height=400');
  printWindow.document.write('<html><head><title>Barcode Drucken</title></head><body>');
  printWindow.document.write(barcodeContainer);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Beim Laden der Seite: Dropdowns laden und Lagerbestand anzeigen
window.onload = function() {
  ladeLagerorte();
  zeigeLagerbestand();
};