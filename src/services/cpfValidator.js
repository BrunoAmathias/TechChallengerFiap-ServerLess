/**
 * Validação de CPF: formato + dígitos verificadores.
 * Não depende de nenhuma lib externa de propósito — é um cálculo simples
 * e assim evitamos dependências desnecessárias na Lambda.
 */

function onlyDigits(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

function isValidCPF(rawCpf) {
  const cpf = onlyDigits(rawCpf);

  if (cpf.length !== 11) return false;

  // Rejeita sequências repetidas (000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheckDigit = (base) => {
    let sum = 0;
    let weight = base.length + 1;
    for (const digit of base) {
      sum += parseInt(digit, 10) * weight;
      weight -= 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const firstNine = cpf.slice(0, 9);
  const digit1 = calcCheckDigit(firstNine);
  if (digit1 !== parseInt(cpf[9], 10)) return false;

  const firstTen = cpf.slice(0, 10);
  const digit2 = calcCheckDigit(firstTen);
  if (digit2 !== parseInt(cpf[10], 10)) return false;

  return true;
}

function formatCPF(rawCpf) {
  const cpf = onlyDigits(rawCpf);
  if (cpf.length !== 11) return rawCpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

module.exports = { isValidCPF, onlyDigits, formatCPF };
