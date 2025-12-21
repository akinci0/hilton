import { getDistrictCards } from "../models/dashboard.model.js";

function normName(s) {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // aksanlari sil (c, s, g vs)
    .replace(/ı/g, "i") // kritiiik: ı -> i (karsıyaka -> karsiyaka, bayraklı -> bayrakli)
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED = new Set([
  "konak",
  "gaziemir",
  "cesme",
  "bayrakli",
  "karsiyaka",
  "aliaga",
]);

export async function districts(req, res) {
  const items = await getDistrictCards();

  const filtered = (items || []).filter((x) => ALLOWED.has(normName(x.name)));

  res.json({ items: filtered });
}
