const { isValidCPF, onlyDigits } = require('../src/services/cpfValidator');

describe('cpfValidator', () => {
  test('aceita CPF válido conhecido', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  test('rejeita CPF com dígitos verificadores errados', () => {
    expect(isValidCPF('529.982.247-00')).toBe(false);
  });

  test('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });

  test('rejeita CPF com tamanho incorreto', () => {
    expect(isValidCPF('123456')).toBe(false);
  });

  test('onlyDigits remove máscara', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });
});
