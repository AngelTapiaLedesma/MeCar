function normalizeTitle(value) {
    if (value == null) return value;
    return String(value)
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('es-MX')
        .replace(/(^|[\s\-'’])(\p{L})/gu, (_, separator, letter) =>
            `${separator}${letter.toLocaleUpperCase('es-MX')}`
        );
}

module.exports = { normalizeTitle };
