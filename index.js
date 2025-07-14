const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const app = express();

const DB_PATH = path.join(__dirname, "data", "immos.json");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initiale Daten laden oder Datei anlegen
function loadData() {
  if (!fs.existsSync(DB_PATH)) {
    return { offen: [], verkauft: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (err) {
    console.error("Fehler beim Lesen der Datei:", err);
    return { offen: [], verkauft: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Fehler beim Schreiben der Datei:", err);
  }
}

app.get("/api/immos", (req, res) => {
  const data = loadData();
  res.json(data);
});

app.post("/api/kauf", (req, res) => {
  const { name, ankauf, makler, ort } = req.body;
  if ([name, ankauf, makler, ort].some((v) => v == null || v === "")) {
    return res.status(400).json({ error: "Fehlende oder ungültige Daten" });
  }

  const data = loadData();
  data.offen.push({
    id: uuidv4(),
    name,
    ankauf,
    makler,
    ort,
    verkauf: null,
    verkaufsMakler: null,
  });
  saveData(data);
  res.json({ status: "ok" });
});

app.post("/api/verkauf", (req, res) => {
  const { id, verkauf, verkaufsMakler } = req.body;
  if (!id || !verkauf || !verkaufsMakler) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }
  const data = loadData();
  const index = data.offen.findIndex((h) => h.id === id);
  if (index === -1) return res.status(404).json({ error: "Nicht gefunden" });

  const haus = data.offen.splice(index, 1)[0];
  haus.verkauf = verkauf;
  haus.verkaufsMakler = verkaufsMakler;
  data.verkauft.push(haus);

  saveData(data);
  res.json({ status: "verkauft" });
});

app.put("/api/bearbeiten/:id", (req, res) => {
  const { id } = req.params;
  const { name, ankauf, makler, ort } = req.body;

  const data = loadData();
  const haus = data.offen.find((h) => h.id === id);
  if (!haus) return res.status(404).json({ error: "Nicht gefunden" });

  if (name !== undefined) haus.name = name;
  if (ankauf !== undefined) haus.ankauf = ankauf;
  if (makler !== undefined) haus.makler = makler;
  if (ort !== undefined) haus.ort = ort;

  saveData(data);
  res.json({ status: "bearbeitet" });
});

app.delete("/api/loeschen/:id", (req, res) => {
  const { id } = req.params;
  const data = loadData();

  const before = data.offen.length;
  data.offen = data.offen.filter((h) => h.id !== id);
  if (before === data.offen.length)
    return res.status(404).json({ error: "Nicht gefunden" });

  saveData(data);
  res.json({ status: "gelöscht" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server läuft auf Port " + PORT));
