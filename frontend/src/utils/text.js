// Normaliza texto visible a "Título Por Palabra" sin tocar VIN, placas,
// correos, teléfonos ni notas.
export function normalizeTitle(value) {
  if (value == null) return value;
  return String(value)
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX")
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, separator, letter) =>
      `${separator}${letter.toLocaleUpperCase("es-MX")}`
    );
}

// Comparación estable y tolerante a mayúsculas/acentos para ordenar listas.
export function compareText(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "es-MX", {
    sensitivity: "base",
    numeric: true,
  });
}

export function sortByName(items, getName) {
  return [...items].sort((a, b) => compareText(getName(a), getName(b)));
}
