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
    console.log("ladeLagerorte wird ausgeführt");
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
  const ids = ["produktname", "menge", "mhd", "ausbuchenProdukt", "ausbuchenMenge", "lagerortEinbuchen", "lagerortAusbuchen"];
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
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.setAttribute("data-index", index);
    row.innerHTML = `
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
    `;
    // Eventlistener für Klick und Touch hinzufügen:
    row.addEventListener("click", function() {
      openProductModal(index);
    });
    row.addEventListener("touchend", function() {
      openProductModal(index);
    });
    tabelle.appendChild(row);
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
  
  // Generiere einen eindeutigen Barcode (z. B. "WARE-<timestamp>-<zufallszahl>")
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
  
/* --------------- Funktionen für das Produkt-Detail Modal --------------- */
  
// Öffnet das Modal und füllt es mit den Details des angeklickten Produkts (inklusive Barcode)
function openProductModal(index) {
  const produkt = lagerbestand[index];
  const modal = document.getElementById("productModal");
  const content = document.getElementById("productDetailContent");
  
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
  
  let barcodeWidth;
  if (window.innerWidth < 400) {
    barcodeWidth = 0.8;
  } else if (window.innerWidth < 600) {
    barcodeWidth = 1;
  } else {
    barcodeWidth = 2;
  }
  
  JsBarcode("#modalBarcodeSvg", produkt.barcode, {
    format: "CODE128",
    width: barcodeWidth,
    height: 50,
    displayValue: false
  });
  
  modal.style.display = "block";
}
  
// Schließt das Produkt-Detail Modal
function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}
  
// Öffnet ein neues Fenster mit dem Barcode, um diesen zu drucken
function printBarcode() {
    // Barcode-Wert aus dem Modal holen
    const barcodeValue = document.getElementById("modalBarcodeValue").textContent.trim();
    if (!barcodeValue) {
      alert("Kein Barcode verfügbar!");
      return;
    }
    
    // Neues Fenster für den Druck öffnen – hier wird eine feste Fenstergröße definiert
    const printWindow = window.open('', '_blank', 'width=800,height=600,resizable=yes');
    
    // HTML-Struktur für das Druckfenster schreiben:
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <!-- Meta viewport mit fester Breite, um Skalierung zu vermeiden -->
        <meta name="viewport" content="width=800, initial-scale=1.0">
        <title>Barcode Drucken</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #fff;
          }
          /* Feste Größe für das Barcode-SVG */
          #barcode {
            width: 600px;
            height: 150px;
          }
        </style>
        <!-- JsBarcode einbinden -->
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <svg id="barcode"></svg>
        <script>
          // Barcode in fester Größe generieren:
          JsBarcode("#barcode", "${barcodeValue}", {
            format: "CODE128",
            width: 4,      // Balkenbreite (fest)
            height: 100,   // Höhe
            displayValue: true,
            margin: 10
          });
        <\/script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Kurze Verzögerung, damit der Barcode vollständig gerendert wird, bevor der Druckdialog aufgerufen wird
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  }
  
/* --------------- Funktionen für den Barcode-Scanner (Modal) --------------- */
  
// Diese Funktion wird nur einmal definiert und bereinigt den gescannten Code
function handleScannedBarcode(scannedCode) {
    scannedCode = scannedCode.trim().replace(/[\n\r]+/g, "");
    console.log("Original gescannt:", scannedCode);
    // In Großbuchstaben umwandeln und bereinigen:
    scannedCode = cleanScannedCode(scannedCode.toUpperCase());
    console.log("Bereinigt gescannt:", scannedCode);
    
    console.log("Gespeicherte Barcodes:", lagerbestand.map(p => p.barcode).join(", "));
    const item = lagerbestand.find(p =>
      p.barcode.trim().toUpperCase() === scannedCode
    );
    if (!item) {
      alert("Ware nicht gefunden! (Scanned: " + scannedCode + ")");
      return;
    }
    currentScannedItem = item;
    openProductModal(lagerbestand.indexOf(item));
  }
  
/* --------------- Quagga Barcode-Scanner Initialisierung --------------- */
  
if (typeof Quagga !== "undefined") {
    // Wir packen die Initialisierung in window.onload, um sicherzustellen, dass alle DOM-Elemente geladen sind
    window.onload = function() {
      // Lade zuerst die Dropdowns und den lokalen Lagerbestand
      ladeLagerorte();
      zeigeLagerbestand();
  
      // Quagga initialisieren
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scanner-container"),
          constraints: {
            facingMode: "environment",
            // Falls möglich, kannst du auch hier eine minimale Auflösung definieren:
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        decoder: {
          readers: ["code_128_reader"],
          multiple: false,
          // Du könntest auch experimentell den "patchSize" Parameter ändern:
          // patchSize: "medium" // Alternativen: "small", "large"
        },
        locate: true
      }, function(err) {
        if (err) {
          console.error("Quagga init error:", err);
          alert("Fehler beim Initialisieren des Scanners: " + err);
          return;
        }
        console.log("Quagga wurde erfolgreich initialisiert.");
        Quagga.start();
      });

      function cleanScannedCode(code) {
        // Erlaubte Zeichen: A-Z, 0-9 und Bindestrich
        return code.replace(/[^A-Z0-9-]/g, "");
      }
  
      // Registrierung des Detektions-Callbacks
      Quagga.onDetected(function(result) {
        console.log("Quagga onDetected result:", result);
        if (result && result.codeResult && result.codeResult.code) {
          let scannedCode = result.codeResult.code.trim();
          console.log("Gescannt:", scannedCode);
          // Setze das Ergebnis in ein Display-Element (falls vorhanden)
          const resultElem = document.getElementById("barcode-result");
          if (resultElem) {
            resultElem.innerText = `Gescannt: ${scannedCode}`;
          }
          // Zur Debug-Zwecken rufen wir handleScannedBarcode direkt auf
          handleScannedBarcode(scannedCode);
        } else {
          console.log("Kein gültiger Barcode erkannt.");
        }
      });
    };
  }
  
/* --------------- Initialisierung beim Laden der Seite --------------- */
window.onload = function() {
  ladeLagerorte();
  zeigeLagerbestand();
};