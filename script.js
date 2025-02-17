"use strict";

// Liste der Lagerorte
const lagerorte = ["Wareneingang", "Chargierung", "Mischerei", "Füllerei", "Verpackung", "Kartonierung", "Versand"];

// Globaler Lagerbestand – wird aus dem localStorage geladen oder als leeres Array initialisiert
let lagerbestand = JSON.parse(localStorage.getItem("lagerbestand")) || [];

// Global für den aktuell gescannten Artikel
let currentScannedItem = null;

// Hilfsfunktionen
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const matrix = [];
  for (let i = 0; i <= m; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= n; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[m][n];
}

function cleanCode(code) {
  return code.replace(/[^A-Z0-9-]/gi, "").toUpperCase();
}

// Konsolidierte handleScannedBarcode-Funktion
function handleScannedBarcode(scannedCode) {
  const cleanedScanned = cleanCode(scannedCode);
  console.log("Original gescannt:", scannedCode);
  console.log("Bereinigt gescannt:", cleanedScanned);
  
  if (!cleanedScanned.startsWith("WARE-")) {
    notify("Ungültiger Barcode erkannt: " + cleanedScanned + "\nBitte verbessere die Scanbedingungen (Beleuchtung, Druckqualität etc.).");
    return;
  }
  
  let bestMatch = null;
  let bestDistance = Infinity;
  lagerbestand.forEach(item => {
    const cleanedStored = cleanCode(item.barcode);
    const distance = levenshtein(cleanedScanned, cleanedStored);
    console.log(`Vergleiche ${cleanedScanned} mit ${cleanedStored} -> Abstand: ${distance}`);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = item;
    }
  });
  
  const threshold = 2;
  if (bestDistance <= threshold && bestMatch) {
    currentScannedItem = bestMatch;
    const index = lagerbestand.indexOf(bestMatch);
    openProductModal(index);
  } else {
    notify("Ware nicht gefunden! (Bereinigt gescannt: " + cleanedScanned + ")");
  }
}

// Dropdowns und Lagerbestand anzeigen
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

function clearInputs() {
  const ids = ["produktname", "menge", "mhd", "ausbuchenProdukt", "ausbuchenMenge", "lagerortEinbuchen", "lagerortAusbuchen"];
  ids.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) { elem.value = ""; }
  });
}

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
    row.addEventListener("click", () => openProductModal(index));
    row.addEventListener("touchend", () => openProductModal(index));
    tabelle.appendChild(row);
  });
}

function allePositionenLoeschen() {
  if (confirm("Möchten Sie wirklich alle Positionen im Lagerbestand löschen?")) {
    lagerbestand = [];
    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    zeigeLagerbestand();
    notify("Der Lagerbestand wurde erfolgreich geleert.");
  }
}

function sucheLagerbestand() {
  const searchQuery = document.getElementById("search").value.toLowerCase();
  const filtered = lagerbestand.filter(produkt =>
    produkt.produktname.toLowerCase().includes(searchQuery) ||
    produkt.lagerort.toLowerCase().includes(searchQuery)
  );
  zeigeGefiltertenLagerbestand(filtered);
}

function zeigeGefiltertenLagerbestand(filtered) {
  const tabelle = document.getElementById("lagerbestandTabelle");
  tabelle.innerHTML = "";
  if (filtered.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='4'>Keine Produkte gefunden.</td></tr>";
    return;
  }
  filtered.forEach((produkt, index) => {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.innerHTML = `
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
    `;
    row.addEventListener("click", () => openProductModal(index));
    tabelle.appendChild(row);
  });
}

// Einbuchen und Ausbuchen
function einbuchen() {
  const produktname = document.getElementById("produktname").value.trim();
  const menge = parseInt(document.getElementById("menge").value);
  const mhd = document.getElementById("mhd").value;
  const lagerort = document.getElementById("lagerortEinbuchen").value;
  
  if (!produktname || !menge || !mhd || !lagerort) {
    notify("Bitte alle Felder ausfüllen!");
    return;
  }
  if (menge <= 0) {
    notify("Die Menge muss größer als 0 sein.");
    return;
  }
  
  const uniqueId = "WARE-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
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
  
  notify(`${menge} von ${produktname} erfolgreich in Lagerort ${lagerort} eingebucht!`);
  clearInputs();
  zeigeLagerbestand();
}

function ausbuchen() {
  const produktname = document.getElementById("ausbuchenProdukt").value.trim();
  const menge = parseInt(document.getElementById("ausbuchenMenge").value);
  const lagerort = document.getElementById("lagerortAusbuchen").value;
  
  if (!produktname || !menge || !lagerort) {
    notify("Bitte alle Felder ausfüllen!");
    return;
  }
  if (menge <= 0) {
    notify("Die Menge muss größer als 0 sein.");
    return;
  }
  
  const index = lagerbestand.findIndex(p =>
    p.produktname.toLowerCase() === produktname.toLowerCase() && p.lagerort === lagerort
  );
  
  if (index !== -1) {
    const produkt = lagerbestand[index];
    if (produkt.menge >= menge) {
      produkt.menge -= menge;
      if (produkt.menge === 0) { lagerbestand.splice(index, 1); }
      localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
      notify(`${menge} von ${produktname} aus Lagerort ${lagerort} erfolgreich ausgebucht.`);
    } else {
      notify("Nicht genügend Bestand verfügbar!");
    }
  } else {
    notify("Produkt oder Lagerort nicht gefunden!");
  }
  
  clearInputs();
  zeigeLagerbestand();
}

// Produkt-Detail Modal
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
  
  let barcodeWidth = window.innerWidth < 400 ? 0.8 : (window.innerWidth < 600 ? 1 : 2);
  JsBarcode("#modalBarcodeSvg", produkt.barcode, {
    format: "CODE128",
    width: barcodeWidth,
    height: 50,
    displayValue: false
  });
  
  modal.style.display = "block";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

function printBarcode() {
  const barcodeValue = document.getElementById("modalBarcodeValue").textContent.trim();
  if (!barcodeValue) {
    notify("Kein Barcode verfügbar!");
    return;
  }
  
  const printWindow = window.open('', '_blank', 'width=800,height=600,resizable=yes');
  printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=800, initial-scale=1.0">
        <title>Barcode Drucken</title>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
          #barcode { width: 600px; height: 150px; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <svg id="barcode"></svg>
        <script>
          JsBarcode("#barcode", "${barcodeValue}", {
            format: "CODE128",
            width: 4,
            height: 100,
            displayValue: true,
            margin: 10
          });
        <\/script>
      </body>
      </html>
    `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
}

// Snackbar-Benachrichtigung
function notify(message) {
  const snackbar = document.getElementById("snackbar");
  if (snackbar) {
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
  } else {
    alert(message);
  }
}

// Quagga Barcode-Scanner Initialisierung
function initScanner() {
  if (typeof Quagga !== "undefined") {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#scanner-container"),
        constraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      decoder: {
        readers: ["code_128_reader"],
        multiple: false
      },
      locate: true
    }, function(err) {
      if (err) {
        console.error("Quagga init error:", err);
        notify("Fehler beim Initialisieren des Scanners: " + err);
        return;
      }
      console.log("Quagga wurde erfolgreich initialisiert.");
      Quagga.start();
    });
  
    Quagga.onDetected(function(result) {
      if (result && result.codeResult && result.codeResult.code) {
        let scannedCode = result.codeResult.code;
        document.getElementById("barcode-result").innerText = `Gescannt: ${scannedCode}`;
        handleScannedBarcode(scannedCode);
      } else {
        console.log("Kein gültiger Barcode erkannt.");
      }
    });
  }
}

// Eventlistener an DOMContentLoaded anhängen
document.addEventListener("DOMContentLoaded", function() {
  ladeLagerorte();
  zeigeLagerbestand();
  
  // Buttons aus index.html und lagerbestand.html
  const btnEinbuchen = document.getElementById("btnEinbuchen");
  if (btnEinbuchen) btnEinbuchen.addEventListener("click", einbuchen);
  
  const btnAusbuchen = document.getElementById("btnAusbuchen");
  if (btnAusbuchen) btnAusbuchen.addEventListener("click", ausbuchen);
  
  const btnZeigeLagerbestand = document.getElementById("btnZeigeLagerbestand");
  if (btnZeigeLagerbestand) btnZeigeLagerbestand.addEventListener("click", zeigeLagerbestand);
  
  const btnAllePositionenLoeschen = document.getElementById("btnAllePositionenLoeschen");
  if (btnAllePositionenLoeschen) btnAllePositionenLoeschen.addEventListener("click", allePositionenLoeschen);
  
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.addEventListener("keyup", sucheLagerbestand);
  
  const btnCloseEtikett = document.getElementById("btnCloseEtikett");
  if (btnCloseEtikett) btnCloseEtikett.addEventListener("click", () => {
    document.getElementById("etikettContainer").style.display = "none";
  });
  
  const btnCloseProductModal = document.getElementById("btnCloseProductModal");
  if (btnCloseProductModal) btnCloseProductModal.addEventListener("click", closeProductModal);
  
  const btnPrintBarcode = document.getElementById("btnPrintBarcode");
  if (btnPrintBarcode) btnPrintBarcode.addEventListener("click", printBarcode);
  
  // Buttons in scanner.html
  const btnAusbuchenScanned = document.getElementById("btnAusbuchenScanned");
  if (btnAusbuchenScanned) btnAusbuchenScanned.addEventListener("click", () => {
    // Beispielhafte Logik für gescannte Ware – hier einfach ausbuchen aufrufen
    ausbuchen();
  });
  
  const btnUmlagernScanned = document.getElementById("btnUmlagernScanned");
  if (btnUmlagernScanned) btnUmlagernScanned.addEventListener("click", () => {
    document.getElementById("umlagerungSection").style.display = "block";
  });
  
  const btnCloseScannedModal = document.getElementById("btnCloseScannedModal");
  if (btnCloseScannedModal) btnCloseScannedModal.addEventListener("click", () => {
    document.getElementById("scannedModal").style.display = "none";
  });
  
  const btnUmlagernConfirm = document.getElementById("btnUmlagernConfirm");
  if (btnUmlagernConfirm) btnUmlagernConfirm.addEventListener("click", () => {
    notify("Umlagerung durchgeführt (Platzhalter).");
  });
  
  const btnCancelUmlagerung = document.getElementById("btnCancelUmlagerung");
  if (btnCancelUmlagerung) btnCancelUmlagerung.addEventListener("click", () => {
    document.getElementById("umlagerungSection").style.display = "none";
  });
  
  // Scanner initialisieren, falls vorhanden
  if (document.querySelector("#scanner-container")) {
    initScanner();
  }
});