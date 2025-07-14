let offene = [];
let verkauft = [];
const totalAktien = 10000;
let lastKurs = 10;

function updateWerte() {
  let gewinn = verkauft.reduce((sum, h) => sum + (h.verkauf - h.ankauf), 0);
  document.getElementById("unternehmenswert").textContent = `📊 Unternehmenswert: ${gewinn.toFixed(2)} €`;

  let kurs = gewinn / totalAktien;
  kurs *= 1 + (Math.random() * 0.02 - 0.01);
  let maxDelta = lastKurs * 0.05;
  let delta = kurs - lastKurs;
  if (Math.abs(delta) > maxDelta) kurs = lastKurs + Math.sign(delta) * maxDelta;
  if (kurs < 1) kurs = 1;
  lastKurs = kurs;

  document.getElementById("aktienkurs").textContent = `📈 Aktienkurs: ${kurs.toFixed(2)} €`;
}

async function fetchImmos() {
  let res = await fetch("/api/immos");
  let data = await res.json();
  offene = data.offen;
  verkauft = data.verkauft;

  document.getElementById("log").innerHTML = offene.map(h =>
    `<div class="haus">
      <strong>${h.name}</strong> (${h.ort})<br>
      🛒 ${h.ankauf} € | Makler: ${h.makler}<br>
      ID: ${h.id}
      <br>
      <button onclick="bearbeiten('${h.id}')">Bearbeiten</button>
      <button onclick="loeschen('${h.id}')">Löschen</button>
    </div>`
  ).join("");

  document.getElementById("verkauft-log").innerHTML = verkauft.map(h =>
    `<div class="haus verkauft">
      <strong>${h.name}</strong> (${h.ort})<br>
      🛒 ${h.ankauf} € → 💰 ${h.verkauf} € = 📈 ${(h.verkauf - h.ankauf).toFixed(2)} €<br>
      Verkaufs-Makler: ${h.verkaufsMakler}
    </div>`
  ).join("");

  updateWerte();
}

async function kaufen() {
  const name = document.getElementById("name").value;
  const ankauf = parseFloat(document.getElementById("ankauf").value);
  const makler = document.getElementById("makler").value;
  const ort = document.getElementById("ort").value;

  await fetch("/api/kauf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ankauf, makler, ort })
  });

  document.getElementById("name").value = "";
  document.getElementById("ankauf").value = "";
  document.getElementById("makler").value = "";
  document.getElementById("ort").value = "";
  fetchImmos();
}

async function verkaufen() {
  const id = document.getElementById("verkaufs-id").value;
  const verkauf = parseFloat(document.getElementById("verkauf").value);
  const verkaufsMakler = document.getElementById("verkaufs-makler").value;

  await fetch("/api/verkauf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, verkauf, verkaufsMakler })
  });

  document.getElementById("verkaufs-id").value = "";
  document.getElementById("verkauf").value = "";
  document.getElementById("verkaufs-makler").value = "";
  fetchImmos();
}

async function bearbeiten(id) {
  const name = prompt("Neuer Name?");
  const ankauf = parseFloat(prompt("Neuer Ankaufspreis?"));
  const makler = prompt("Neuer Makler?");
  const ort = prompt("Neuer Ort?");

  await fetch(`/api/bearbeiten/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ankauf, makler, ort })
  });

  fetchImmos();
}

async function loeschen(id) {
  if (!confirm("Wirklich löschen?")) return;

  await fetch(`/api/loeschen/${id}`, {
    method: "DELETE"
  });

  fetchImmos();
}

setInterval(updateWerte, 10000);
fetchImmos();
