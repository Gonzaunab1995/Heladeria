const COLORS = {
  chocolate: "#6b4132",
  "dulce de leche": "#c98a4b",
  frutilla: "#ff8fa3",
  vainilla: "#fff0b8",
  "menta granizada": "#9fe0c0",
  limón: "#f3e45c",
  limon: "#f3e45c",
  "banana split": "#f8d66d",
  sambayón: "#e8c27a",
  sambayon: "#e8c27a",
};

// Los gustos nuevos que cargues en la base reciben un color propio y estable
export function flavorColor(name = "") {
  const key = name.trim().toLowerCase();
  if (COLORS[key]) return COLORS[key];
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 75%)`;
}
