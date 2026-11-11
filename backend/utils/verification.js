const MONTH_NAMES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

// Normativa CDMX / Estado de México:
// el último dígito de la placa define el engomado, el día de no circulación
// y la ventana de verificación dentro de cada semestre.
const PLATE_RULES = {
    amarillo: { digits: [5, 6], noCircula: 'Lunes', periodos: [[1, 2], [7, 8]] },
    rosa: { digits: [7, 8], noCircula: 'Martes', periodos: [[2, 3], [8, 9]] },
    rojo: { digits: [3, 4], noCircula: 'Miércoles', periodos: [[3, 4], [9, 10]] },
    verde: { digits: [1, 2], noCircula: 'Jueves', periodos: [[4, 5], [10, 11]] },
    azul: { digits: [9, 0], noCircula: 'Viernes', periodos: [[5, 6], [11, 12]] },
};

function getPlateDigit(plate) {
    const match = String(plate || '').match(/(\d)(?!.*\d)/);
    return match ? Number(match[1]) : null;
}

function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getVerificationData(plate, referenceDate = new Date()) {
    const digit = getPlateDigit(plate);
    if (digit == null) return null;

    const entry = Object.entries(PLATE_RULES).find(([, rule]) => rule.digits.includes(digit));
    if (!entry) return null;

    const [colorKey, rule] = entry;
    const reference = startOfDay(referenceDate);
    const referenceYear = reference.getFullYear();

    let periodYear = referenceYear;
    let windowStart = null;
    let windowEnd = null;

    for (const [startMonth, endMonth] of rule.periodos) {
        const start = new Date(referenceYear, startMonth - 1, 1);
        const end = new Date(referenceYear, endMonth, 0);
        if (reference <= end) {
            windowStart = start;
            windowEnd = end;
            break;
        }
    }

    // Si ya pasó la última ventana del año, la próxima es la primera del
    // siguiente año.
    if (!windowStart) {
        const [startMonth, endMonth] = rule.periodos[0];
        periodYear = referenceYear + 1;
        windowStart = new Date(periodYear, startMonth - 1, 1);
        windowEnd = new Date(periodYear, endMonth, 0);
    }

    const period = windowStart.getMonth() + 1;
    const semester = period <= 6 ? 1 : 2;
    const dueDate = reference >= windowStart ? reference : windowStart;

    return {
        digit,
        color: colorKey.charAt(0).toUpperCase() + colorKey.slice(1),
        colorKey,
        noCircula: rule.noCircula,
        period,
        year: periodYear,
        periodKey: `${periodYear}-${String(period).padStart(2, '0')}`,
        dueDate: toIsoDate(dueDate),
        windowStart: toIsoDate(windowStart),
        windowEnd: toIsoDate(windowEnd),
        periodLabel: `${MONTH_NAMES[period - 1]}–${MONTH_NAMES[windowEnd.getMonth()]} ${periodYear}`,
        semester,
        semesterLabel: `${periodYear} · Semestre ${semester}`,
    };
}

module.exports = { PLATE_RULES, getPlateDigit, getVerificationData };
