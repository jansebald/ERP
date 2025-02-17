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
      matrix[i][j] = a.charAt(i - 1) === b.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[m][n];
}

function cleanCode(code) {
  return code.replace(/[^A-Z0-9-]/gi, "").toUpperCase();
}

// Konsolidierte handleScannedBarcode-Funktion (angepasst)
function handleScannedBarcode(scannedCode) {
  const cleanedScanned = cleanCode(scannedCode);
  console.log("Original gescannt:", scannedCode);
  console.log("Bereinigt gescannt:", cleanedScanned);
  
  if (!cleanedScanned.startsWith("WARE-")) {
    notify("Ungültiger Barcode: " + cleanedScanned);
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
    // Statt des bisherigen Produkt-Detail-Modals öffnen wir jetzt unser Bestätigungs-Modal:
    openConfirmAusbuchenModal(index);
  } else {
    notify("Ware nicht gefunden! (Bereinigt: " + cleanedScanned + ")");
  }
}

// Neues Modal für Bestätigung des Ausbuchens
function openConfirmAusbuchenModal(index) {
  const produkt = lagerbestand[index];
  if (!produkt) return;
  const modal = document.getElementById("confirmAusbuchenModal");
  const content = document.getElementById("confirmModalContent");
  content.innerHTML = `
    <p><strong>Produkt:</strong> ${produkt.produktname}</p>
    <p><strong>MHD:</strong> ${produkt.mhd}</p>
    <p><strong>Charge:</strong> ${produkt.barcode}</p>
  `;
  modal.style.display = "block";
}

// Funktion, um ausgebuchte Ware zu verarbeiten (hier wird standardmäßig 1 Einheit ausgebucht)
function confirmAusbuchenScanned() {
  if (currentScannedItem) {
    const index = lagerbestand.indexOf(currentScannedItem);
    if (index !== -1) {
      let produkt = lagerbestand[index];
      // Ganze Charge ausbuchen: Artikel komplett entfernen
      lagerbestand.splice(index, 1);
      localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
      notify(`${produkt.produktname} (Charge ${produkt.barcode}) wurde vollständig ausgebucht.`);
    }
  }
  document.getElementById("confirmAusbuchenModal").style.display = "none";
}

// DOMContentLoaded – Eventlistener hinzufügen
document.addEventListener("DOMContentLoaded", () => {
  // ... (weitere Initialisierungen)
  
  // Scanner initialisieren, falls Container vorhanden ist
  initScanner();

  // Eventlistener für das Ausbuchen-Modal (auf scanner.html)
  const btnConfirm = document.getElementById("btnConfirmAusbuchen");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", confirmAusbuchenScanned);
  }
  const btnCancel = document.getElementById("btnCancelAusbuchen");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      document.getElementById("confirmAusbuchenModal").style.display = "none";
    });
  }
});

// UI-Funktionen, die nur aktiv werden, wenn die Elemente existieren

function ladeLagerorte() {
  console.log("ladeLagerorte wird ausgeführt");
  const einbuchenDropdown = document.getElementById("lagerortEinbuchen");
  const ausbuchenDropdown = document.getElementById("lagerortAusbuchen");
  
  if (einbuchenDropdown) {
    einbuchenDropdown.innerHTML = "";
    let defaultOption = document.createElement("option");
    defaultOption.textContent = "Bitte wählen...";
    defaultOption.value = "";
    einbuchenDropdown.appendChild(defaultOption);
    lagerorte.forEach(lagerort => {
      let option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      einbuchenDropdown.appendChild(option);
    });
  }
  
  if (ausbuchenDropdown) {
    ausbuchenDropdown.innerHTML = "";
    let defaultOption = document.createElement("option");
    defaultOption.textContent = "Bitte wählen...";
    defaultOption.value = "";
    ausbuchenDropdown.appendChild(defaultOption);
    lagerorte.forEach(lagerort => {
      let option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      ausbuchenDropdown.appendChild(option);
    });
  }
}

function clearInputs() {
  ["produktname", "menge", "mhd", "ausbuchenProdukt", "ausbuchenMenge", "lagerortEinbuchen", "lagerortAusbuchen"].forEach(id => {
    let elem = document.getElementById(id);
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
    let row = document.createElement("tr");
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

const btnCloseProductModal = document.getElementById("btnCloseProductModal");
if (btnCloseProductModal) btnCloseProductModal.addEventListener("click", closeProductModal);

function allePositionenLoeschen() {
  if (confirm("Alle Positionen wirklich löschen?")) {
    lagerbestand = [];
    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    zeigeLagerbestand();
    notify("Lagerbestand geleert.");
  }
}

function sucheLagerbestand() {
  const searchQuery = (document.getElementById("search") || {}).value.toLowerCase();
  const filtered = lagerbestand.filter(produkt =>
    produkt.produktname.toLowerCase().includes(searchQuery) ||
    produkt.lagerort.toLowerCase().includes(searchQuery)
  );
  zeigeGefiltertenLagerbestand(filtered);
}

function zeigeGefiltertenLagerbestand(filtered) {
  const tabelle = document.getElementById("lagerbestandTabelle");
  if (!tabelle) return;
  tabelle.innerHTML = "";
  if (filtered.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='4'>Keine Produkte gefunden.</td></tr>";
    return;
  }
  filtered.forEach((produkt, index) => {
    let row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.innerHTML = `
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
    `;
    row.addEventListener("click", () => openProductModal(lagerbestand.indexOf(produkt)));
    tabelle.appendChild(row);
  });
}

// Einbuchen und Ausbuchen
function einbuchen() {
  const produktname = document.getElementById("produktname").value.trim();
  const menge = parseInt(document.getElementById("menge").value);
  const mhd = document.getElementById("mhd").value;
  const lagerort = document.getElementById("lagerortEinbuchen").value;

  // Prüfen, ob Eingaben okay sind ...
  if (!produktname || !menge || !mhd || !lagerort) {
    notify("Bitte alle Felder ausfüllen!");
    return;
  }
  if (menge <= 0) {
    notify("Die Menge muss größer als 0 sein.");
    return;
  }

  // Hier holen wir uns die letzte Charge aus dem localStorage
  // Wenn noch nichts da ist, starten wir bei 0
  let lastCharge = parseInt(localStorage.getItem("lastCharge") || "0", 10);

  // Hochzählen, damit wir die nächste Charge bekommen
  lastCharge++;
  if (lastCharge > 9999) {
    notify("Alle 9999 Kurz-Chargen sind verbraucht!"); 
    // Hier kannst du auch wieder bei 1 anfangen oder was anderes machen
    lastCharge = 1; 
  }

  // Im localStorage speichern
  localStorage.setItem("lastCharge", lastCharge.toString());

  // Chargennummer mit führenden Nullen formatieren
  const chargeNummer = String(lastCharge).padStart(4, "0");

  // Hier baust du deinen Barcode zusammen
  const uniqueId = "WARE-" + chargeNummer; 
  // => z.B. "WARE-0001", "WARE-0002", ...

  // Jetzt dein Objekt
  const neuerEintrag = {
    produktname,
    menge,
    mhd,
    lagerort,
    barcode: uniqueId,
    eingebuchtAm: new Date().toLocaleString()
  };

  // Ab in den Lagerbestand
  lagerbestand.push(neuerEintrag);
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));

  // Feedback & Refresh
  notify(`${menge} von ${produktname} erfolgreich in Lagerort ${lagerort} eingebucht!`);
  clearInputs();
  zeigeLagerbestand();
}

function ausbuchen() {
  const produktname = (document.getElementById("ausbuchenProdukt") || {}).value.trim();
  const menge = parseInt((document.getElementById("ausbuchenMenge") || {}).value);
  const lagerort = (document.getElementById("lagerortAusbuchen") || {}).value;
  
  if (!produktname || !menge || !lagerort) {
    notify("Bitte alle Felder ausfüllen!");
    return;
  }
  if (menge <= 0) {
    notify("Menge muss > 0 sein!");
    return;
  }
  
  const index = lagerbestand.findIndex(p =>
    p.produktname.toLowerCase() === produktname.toLowerCase() && p.lagerort === lagerort
  );
  
  if (index !== -1) {
    let produkt = lagerbestand[index];
    if (produkt.menge >= menge) {
      produkt.menge -= menge;
      if (produkt.menge === 0) { lagerbestand.splice(index, 1); }
      localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
      notify(`${menge} von ${produktname} ausgebucht.`);
    } else {
      notify("Nicht genügend Bestand!");
    }
  } else {
    notify("Produkt/Lagerort nicht gefunden!");
  }
  
  clearInputs();
  zeigeLagerbestand();
}

// Produkt-Detail Modal
function openProductModal(index) {
  const produkt = lagerbestand[index];
  if (!produkt) return;
  const modal = document.getElementById("productModal");
  if (!modal) return;
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
  let barcodeWidth = window.innerWidth < 400 ? 0.8 : window.innerWidth < 600 ? 1 : 2;
  JsBarcode("#modalBarcodeSvg", produkt.barcode, { format: "CODE128", width: barcodeWidth, height: 50, displayValue: false });
  modal.style.display = "block";
}

function closeProductModal() {
  let modal = document.getElementById("productModal");
  if (modal) { modal.style.display = "none"; }
}

function printBarcode() {
  const barcodeValue = (document.getElementById("modalBarcodeValue") || {}).textContent.trim();
  if (!barcodeValue) {
    notify("Kein Barcode vorhanden!");
    return;
  }
  let printWindow = window.open('', '_blank', 'width=800,height=600,resizable=yes');
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
          JsBarcode("#barcode", "${barcodeValue}", { format: "CODE128", width: 4, height: 100, displayValue: true, margin: 10 });
        <\/script>
      </body>
      </html>
    `);
  printWindow.document.close();
  setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
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

// Quagga Barcode-Scanner Initialisierung (nur wenn Container vorhanden)
function initScanner() {
  if (typeof Quagga !== "undefined" && document.querySelector("#scanner-container")) {
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
        patchSize: "medium", // probiere auch "small" oder "large"
        multiple: false
      },
      locate: true
    }, function(err) {
      if (err) {
        console.error("Quagga init error:", err);
        notify("Scanner-Fehler: " + err);
        return;
      }
      console.log("Quagga initialisiert.");
      Quagga.start();
    });
    Quagga.onDetected(result => {
      if (result && result.codeResult && result.codeResult.code) {
        let scannedCode = result.codeResult.code;
        let resultElem = document.getElementById("barcode-result");
        if (resultElem) { resultElem.innerText = `Gescannt: ${scannedCode}`; }
        handleScannedBarcode(scannedCode);
      }
    });
  }
}

// DOMContentLoaded – seitenkontextabhängige Initialisierung
document.addEventListener("DOMContentLoaded", () => {
  // Gemeinsame Funktionen
  ladeLagerorte();
  zeigeLagerbestand();
  
  // Index-spezifische Buttons
  let btnEinbuchen = document.getElementById("btnEinbuchen");
  if (btnEinbuchen) { btnEinbuchen.addEventListener("click", einbuchen); }
  
  let btnAusbuchen = document.getElementById("btnAusbuchen");
  if (btnAusbuchen) { btnAusbuchen.addEventListener("click", ausbuchen); }
  
  let btnZeigeLagerbestand = document.getElementById("btnZeigeLagerbestand");
  if (btnZeigeLagerbestand) { btnZeigeLagerbestand.addEventListener("click", zeigeLagerbestand); }
  
  let btnAllePositionenLoeschen = document.getElementById("btnAllePositionenLoeschen");
  if (btnAllePositionenLoeschen) { btnAllePositionenLoeschen.addEventListener("click", allePositionenLoeschen); }
  
  let searchInput = document.getElementById("search");
  if (searchInput) { searchInput.addEventListener("keyup", sucheLagerbestand); }
  
  let btnCloseEtikett = document.getElementById("btnCloseEtikett");
  if (btnCloseEtikett) { btnCloseEtikett.addEventListener("click", () => { 
      let etikett = document.getElementById("etikettContainer");
      if (etikett) etikett.style.display = "none";
    }); 
  }
  
  let btnCloseProductModal = document.getElementById("btnCloseProductModal");
  if (btnCloseProductModal) { btnCloseProductModal.addEventListener("click", closeProductModal); }
  
  let btnPrintBarcode = document.getElementById("btnPrintBarcode");
  if (btnPrintBarcode) { btnPrintBarcode.addEventListener("click", printBarcode); }
  
  // Scanner-spezifische Initialisierung
  initScanner();
});