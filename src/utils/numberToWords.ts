export function numeroALetras(num: number): string {
    const unidades = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'occhenta', 'noventa'];
    const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (num === 0) return 'cero pesos';
    if (num < 0) return 'menos ' + numeroALetras(Math.abs(num));
    
    // Simple implementation for receipts (covers up to millions)
    let letters = '';
    
    if (num >= 1000000) {
        const millions = Math.floor(num / 1000000);
        letters += (millions === 1 ? 'un millón ' : numeroALetras(millions) + ' millones ');
        num %= 1000000;
    }
    
    if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        letters += (thousands === 1 ? 'mil ' : numeroALetras(thousands) + ' mil ');
        num %= 1000;
    }
    
    if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        const labels = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
        if (num === 100) letters += 'cien ';
        else if (num > 100 && num < 200) letters += 'ciento ';
        else letters += labels[hundreds] + ' ';
        num %= 100;
    }
    
    if (num >= 10 && num <= 19) {
        letters += especiales[num - 11] || decenas[Math.floor(num / 10)];
        num = 0;
    } else if (num >= 20) {
        letters += decenas[Math.floor(num / 10)];
        num %= 10;
        if (num > 0) letters += ' y ';
    }
    
    if (num > 0) {
        letters += unidades[num];
    }
    
    return letters.trim().toUpperCase() + ' PESOS';
}
