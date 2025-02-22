"use strict";

// Liste der Lagerorte
const lagerorte = ["Wareneingang", "Chargierung", "Mischerei", "Füllerei", "Verpackung", "Kartonierung", "Versand"];

// Globaler Lagerbestand – wird aus dem localStorage geladen oder als leeres Array initialisiert
let lagerbestand = JSON.parse(localStorage.getItem("lagerbestand")) || [];

// Global für den aktuell gescannten Artikel
let currentScannedItem = null;

// ------------------ Hilfsfunktionen ------------------
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const matrix = [];
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }
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

// ------------------ Barcode-Scan Handling ------------------
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
    openConfirmAusbuchenModal(index);
  } else {
    notify("Ware nicht gefunden! (Bereinigt: " + cleanedScanned + ")");
  }
}

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

// ------------------ Neue Funktionen für Ablaufwarnung, Dashboard und Filter ------------------

// Prüft, ob das MHD innerhalb von 7 Tagen erreicht wird
function isExpiringSoon(mhdStr) {
  const mhd = new Date(mhdStr);
  const today = new Date();
  const diffTime = mhd - today;
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays <= 3;
}

// Aktualisiert Kennzahlen im Dashboard (z. B. auf index.html)
function updateDashboard() {
  const totalProductsElem = document.getElementById("totalProducts");
  const expiringProductsElem = document.getElementById("expiringProducts");
  const totalQuantityElem = document.getElementById("totalQuantity");

  let totalProducts = lagerbestand.length;
  let totalQuantity = 0;
  let expiringCount = 0;

  lagerbestand.forEach(product => {
    totalQuantity += product.menge;
    if (isExpiringSoon(product.mhd)) {
      expiringCount++;
    }
  });

  if (totalProductsElem) totalProductsElem.textContent = totalProducts;
  if (expiringProductsElem) expiringProductsElem.textContent = expiringCount;
  if (totalQuantityElem) totalQuantityElem.textContent = totalQuantity + " Kg";
}

// Zeigt den Lagerbestand in der Tabelle an und fügt in einer zusätzlichen Spalte den Status ein
function zeigeLagerbestand() {
  const tabelle = document.getElementById("lagerbestandTabelle");
  if (!tabelle) return;
  tabelle.innerHTML = "";

  if (lagerbestand.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='5'>Kein Lagerbestand vorhanden.</td></tr>";
    return;
  }

  lagerbestand.forEach((produkt, index) => {
    let row = document.createElement("tr");
    row.style.cursor = "pointer";
    let status = isExpiringSoon(produkt.mhd)
      ? "<span style='color: red; font-weight: bold;'>Ablaufend</span>"
      : "OK";

    row.innerHTML = `
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
      <td>${status}</td>
    `;
    row.addEventListener("click", () => openProductModal(index));
    tabelle.appendChild(row);
  });
}

// Zeigt den gefilterten Lagerbestand an (wie zeigeLagerbestand, aber mit Filter-Ergebnis)
function zeigeGefiltertenLagerbestand(filtered) {
  const tabelle = document.getElementById("lagerbestandTabelle");
  if (!tabelle) return;
  tabelle.innerHTML = "";

  if (filtered.length === 0) {
    tabelle.innerHTML = "<tr><td colspan='5'>Keine Produkte gefunden.</td></tr>";
    return;
  }

  filtered.forEach((produkt) => {
    let row = document.createElement("tr");
    row.style.cursor = "pointer";
    let status = isExpiringSoon(produkt.mhd)
      ? "<span style='color: red; font-weight: bold;'>Ablaufend</span>"
      : "OK";

    row.innerHTML = `
      <td>${produkt.produktname}</td>
      <td>${produkt.menge}</td>
      <td>${produkt.mhd}</td>
      <td>${produkt.lagerort}</td>
      <td>${status}</td>
    `;
    row.addEventListener("click", () => openProductModal(lagerbestand.indexOf(produkt)));
    tabelle.appendChild(row);
  });
}

// Filtert den Lagerbestand anhand von Suchbegriffen, Lagerort, Mindestmenge und MHD
function applyFilters() {
  const searchQuery = (document.getElementById("search") || {}).value.toLowerCase();
  const filterLagerort = (document.getElementById("filterLagerort") || {}).value;
  const filterMinMenge = parseInt((document.getElementById("filterMinMenge") || {}).value, 10) || 0;
  const filterMHD = (document.getElementById("filterMHD") || {}).value;

  const filtered = lagerbestand.filter(produkt => {
    let matchesSearch = produkt.produktname.toLowerCase().includes(searchQuery) ||
                        produkt.lagerort.toLowerCase().includes(searchQuery);
    let matchesLagerort = filterLagerort === "" || produkt.lagerort === filterLagerort;
    let matchesMinMenge = produkt.menge >= filterMinMenge;
    let matchesMHD = true;
    if (filterMHD) {
      matchesMHD = new Date(produkt.mhd) <= new Date(filterMHD);
    }
    return matchesSearch && matchesLagerort && matchesMinMenge && matchesMHD;
  });

  zeigeGefiltertenLagerbestand(filtered);
}

// ------------------ Funktion für "Alle Positionen löschen" ------------------
function allePositionenLoeschen() {
  if (confirm("Alle Positionen wirklich löschen?")) {
    lagerbestand = [];
    localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
    zeigeLagerbestand();
    notify("Lagerbestand geleert.");
  }
}

// ------------------ Funktionen für Dropdowns und sonstige UI ------------------

// Lädt die Dropdowns für Einbuchen, Ausbuchen und den Filter
function ladeLagerorte() {
  console.log("ladeLagerorte wird ausgeführt");
  const einbuchenDropdown = document.getElementById("lagerortEinbuchen");
  const ausbuchenDropdown = document.getElementById("lagerortAusbuchen");
  const filterDropdown = document.getElementById("filterLagerort");

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

  if (filterDropdown) {
    filterDropdown.innerHTML = "";
    let defaultOption = document.createElement("option");
    defaultOption.textContent = "Alle";
    defaultOption.value = "";
    filterDropdown.appendChild(defaultOption);
    lagerorte.forEach(lagerort => {
      let option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      filterDropdown.appendChild(option);
    });
  }
}

function clearInputs() {
  ["produktname", "menge", "mhd", "ausbuchenProdukt", "ausbuchenMenge", "lagerortEinbuchen", "lagerortAusbuchen"].forEach(id => {
    let elem = document.getElementById(id);
    if (elem) {
      elem.value = "";
    }
  });
}

// ------------------ Originale Funktionen für Ein-/Ausbuchen etc. ------------------
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

  let lastCharge = parseInt(localStorage.getItem("lastCharge") || "0", 10);
  lastCharge++;
  if (lastCharge > 9999) {
    notify("Alle 9999 Kurz-Chargen sind verbraucht!");
    lastCharge = 1;
  }
  localStorage.setItem("lastCharge", lastCharge.toString());
  const chargeNummer = String(lastCharge).padStart(4, "0");
  const uniqueId = "WARE-" + chargeNummer;

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
      if (produkt.menge === 0) {
        lagerbestand.splice(index, 1);
      }
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

// ------------------ Produkt-Detail Modal ------------------
function openProductModal(index) {
  const produkt = lagerbestand[index];
  if (!produkt) return;
  const modal = document.getElementById("productModal");
  if (!modal) return;
  const content = document.getElementById("productDetailContent");
  content.innerHTML = `
    <p><strong>Produkt:</strong> <span id="editProduktname">${produkt.produktname}</span></p>
    <p><strong>Menge (in Kg):</strong> <span id="editMenge">${produkt.menge}</span></p>
    <p><strong>MHD:</strong> <span id="editMhd">${produkt.mhd}</span></p>
    <p><strong>Lagerort:</strong> <span id="editLagerort">${produkt.lagerort}</span></p>
    <p><strong>Eingebucht am:</strong> ${produkt.eingebuchtAm || '-'}</p>
    <div id="modalBarcodeContainer" style="margin-top:10px;">
      <svg id="modalBarcodeSvg"></svg>
      <p id="modalBarcodeValue">${produkt.barcode}</p>
    </div>
    <button id="btnEditProduct">Bearbeiten</button>
  `;
  // Eventlistener für Bearbeiten hinzufügen
  const btnEdit = document.getElementById("btnEditProduct");
  btnEdit.addEventListener("click", () => enterEditMode(index));
  
  // Barcode anzeigen
  let barcodeWidth = window.innerWidth < 400 ? 0.8 : window.innerWidth < 600 ? 1 : 2;
  JsBarcode("#modalBarcodeSvg", produkt.barcode, { 
    format: "CODE128", 
    width: barcodeWidth, 
    height: 50, 
    displayValue: false 
  });
  modal.style.display = "block";
}
function enterEditMode(index) {
  const produkt = lagerbestand[index];
  const content = document.getElementById("productDetailContent");
  content.innerHTML = `
    <p><strong>Produkt:</strong> <input type="text" id="editInputProduktname" value="${produkt.produktname}"></p>
    <p><strong>Menge (in Kg):</strong> <input type="number" id="editInputMenge" value="${produkt.menge}"></p>
    <p><strong>MHD:</strong> <input type="date" id="editInputMhd" value="${produkt.mhd}"></p>
    <p><strong>Lagerort:</strong> 
      <select id="editInputLagerort"></select>
    </p>
    <p><strong>Eingebucht am:</strong> ${produkt.eingebuchtAm || '-'}</p>
    <div id="modalBarcodeContainer" style="margin-top:10px;">
      <svg id="modalBarcodeSvg"></svg>
      <p id="modalBarcodeValue">${produkt.barcode}</p>
    </div>
    <button id="btnSaveProduct">Speichern</button>
    <button id="btnCancelEdit">Abbrechen</button>
  `;
  // Lagerort-Dropdown befüllen
  const select = document.getElementById("editInputLagerort");
  if (select) {
    select.innerHTML = "";
    lagerorte.forEach(lagerort => {
      let option = document.createElement("option");
      option.value = lagerort;
      option.textContent = lagerort;
      if (lagerort === produkt.lagerort) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }
  
  // Barcode neu generieren
  let barcodeWidth = window.innerWidth < 400 ? 0.8 : window.innerWidth < 600 ? 1 : 2;
  JsBarcode("#modalBarcodeSvg", produkt.barcode, { 
    format: "CODE128", 
    width: barcodeWidth, 
    height: 50, 
    displayValue: false 
  });
  
  // Eventlistener für Speichern und Abbrechen
  document.getElementById("btnSaveProduct").addEventListener("click", () => saveProductEdits(index));
  document.getElementById("btnCancelEdit").addEventListener("click", () => openProductModal(index));
}
function saveProductEdits(index) {
  const produkt = lagerbestand[index];
  if (!produkt) return;
  
  const newName = document.getElementById("editInputProduktname").value.trim();
  const newMenge = parseFloat(document.getElementById("editInputMenge").value);
  const newMhd = document.getElementById("editInputMhd").value;
  const newLagerort = document.getElementById("editInputLagerort").value;
  
  if (!newName || !newMenge || !newMhd || !newLagerort) {
    notify("Bitte alle Felder ausfüllen!");
    return;
  }
  
  // Update des Produkts
  produkt.produktname = newName;
  produkt.menge = newMenge;
  produkt.mhd = newMhd;
  produkt.lagerort = newLagerort;
  
  localStorage.setItem("lagerbestand", JSON.stringify(lagerbestand));
  notify("Produktdaten aktualisiert!");
  // Modal neu laden
  openProductModal(index);
  zeigeLagerbestand();
  updateDashboard();
}

function closeProductModal(event) {
  if (event) {
    event.stopPropagation();
  }
  let modal = document.getElementById("productModal");
  if (modal) {
    modal.style.display = "none";
  }
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
  setTimeout(() => { 
    printWindow.focus(); 
    printWindow.print(); 
    printWindow.close(); 
  }, 500);
}

// ------------------ Snackbar-Benachrichtigung ------------------
function notify(message) {
  const snackbar = document.getElementById("snackbar");
  if (snackbar) {
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => { 
      snackbar.className = snackbar.className.replace("show", ""); 
    }, 3000);
  } else {
    alert(message);
  }
}

// ------------------ Quagga Barcode-Scanner Initialisierung ------------------
function initScanner() {
  if (typeof Quagga !== "undefined" && document.querySelector("#scanner-container")) {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#scanner-container"),
        constraints: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      decoder: {
        readers: ["code_128_reader"],
        patchSize: "medium",
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
        if (resultElem) {
          resultElem.innerText = `Gescannt: ${scannedCode}`;
        }
        handleScannedBarcode(scannedCode);
      }
    });
  }
}

// ------------------ DOMContentLoaded – Eventlistener setzen ------------------
document.addEventListener("DOMContentLoaded", () => {
  // Dropdowns und Lagerorte laden
  ladeLagerorte();
  // Lagerbestand und Dashboard aktualisieren
  zeigeLagerbestand();
  updateDashboard();

  // Eventlistener für Einbuchen
  let btnEinbuchen = document.getElementById("btnEinbuchen");
  if (btnEinbuchen) {
    btnEinbuchen.addEventListener("click", einbuchen);
  }

  // Eventlistener für Ausbuchen
  let btnAusbuchen = document.getElementById("btnAusbuchen");
  if (btnAusbuchen) {
    btnAusbuchen.addEventListener("click", ausbuchen);
  }

  // Eventlistener für Lagerbestand anzeigen
  let btnZeigeLagerbestand = document.getElementById("btnZeigeLagerbestand");
  if (btnZeigeLagerbestand) {
    btnZeigeLagerbestand.addEventListener("click", zeigeLagerbestand);
  }

  // Eventlistener für Alle Positionen löschen
  let btnAllePositionenLoeschen = document.getElementById("btnAllePositionenLoeschen");
  if (btnAllePositionenLoeschen) {
    btnAllePositionenLoeschen.addEventListener("click", allePositionenLoeschen);
  }

  // Filter-Eventlistener: Bei keyup im Suchfeld die Filterfunktion aufrufen
  let searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("keyup", applyFilters);
  }
  // Falls ein Filter-Button vorhanden ist, auch diesen verbinden
  let btnApplyFilters = document.getElementById("btnApplyFilters");
  if (btnApplyFilters) {
    btnApplyFilters.addEventListener("click", applyFilters);
  }

  // Eventlistener für das Schließen des Produkt-Modals
  let btnCloseProductModal = document.getElementById("btnCloseProductModal");
  if (btnCloseProductModal) {
    btnCloseProductModal.addEventListener("click", closeProductModal);
  }

  // Eventlistener für den Barcode-Druck
  let btnPrintBarcode = document.getElementById("btnPrintBarcode");
  if (btnPrintBarcode) {
    btnPrintBarcode.addEventListener("click", printBarcode);
  }

  // *** Eventlistener für Ausbuchen-Modal in scanner.html ***
  let btnConfirmAusbuchen = document.getElementById("btnConfirmAusbuchen");
  if (btnConfirmAusbuchen) {
    btnConfirmAusbuchen.addEventListener("click", confirmAusbuchenScanned);
  }
  let btnCancelAusbuchen = document.getElementById("btnCancelAusbuchen");
  if (btnCancelAusbuchen) {
    btnCancelAusbuchen.addEventListener("click", () => {
      document.getElementById("confirmAusbuchenModal").style.display = "none";
    });
  }

  // Scanner-spezifische Initialisierung
  initScanner();
});