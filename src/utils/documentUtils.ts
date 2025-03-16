/**
 * Utilitários para manipulação e formatação de documentos
 */

/**
 * Remove caracteres não numéricos de um CNPJ
 * @param cnpj CNPJ com ou sem formatação
 * @returns CNPJ apenas com números
 */
export const cleanCNPJ = (cnpj: string): string => {
  return cnpj.replace(/[^\d]/g, '');
};

/**
 * Formata um CNPJ para exibição
 * @param cnpj CNPJ com ou sem formatação
 * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleanedCNPJ = cleanCNPJ(cnpj);
  
  if (cleanedCNPJ.length <= 0) {
    return '';
  }
  
  // Limita a 14 dígitos
  const digits = cleanedCNPJ.slice(0, 14);
  
  if (digits.length < 14) {
    // Se ainda não temos 14 dígitos, formatamos até onde temos
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
  }
  
  // CNPJ completo: XX.XXX.XXX/XXXX-XX
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

/**
 * Verifica se um CNPJ é válido
 * @param cnpj CNPJ com ou sem formatação
 * @returns true se o CNPJ for válido, false caso contrário
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanedCNPJ = cleanCNPJ(cnpj);
  
  // CNPJ deve ter 14 dígitos
  if (cleanedCNPJ.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais, o que seria inválido
  if (/^(\d)\1+$/.test(cleanedCNPJ)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cleanedCNPJ.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  
  let resto = soma % 11;
  const digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cleanedCNPJ.charAt(12)) !== digitoVerificador1) {
    return false;
  }
  
  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cleanedCNPJ.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  
  resto = soma % 11;
  const digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cleanedCNPJ.charAt(13)) === digitoVerificador2;
};

/**
 * Remove caracteres não numéricos de um CPF
 * @param cpf CPF com ou sem formatação
 * @returns CPF apenas com números
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/[^\d]/g, '');
};

/**
 * Formata um CPF para exibição
 * @param cpf CPF com ou sem formatação
 * @returns CPF formatado (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf: string): string => {
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length <= 0) {
    return '';
  }
  
  // Limita a 11 dígitos
  const digits = cleanedCPF.slice(0, 11);
  
  if (digits.length < 11) {
    // Se ainda não temos 11 dígitos, formatamos até onde temos
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
  }
  
  // CPF completo: XXX.XXX.XXX-XX
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

/**
 * Verifica se um CPF é válido
 * @param cpf CPF com ou sem formatação
 * @returns true se o CPF for válido, false caso contrário
 */
export const validateCPF = (cpf: string): boolean => {
  const cleanedCPF = cleanCPF(cpf);
  
  // CPF deve ter 11 dígitos
  if (cleanedCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais, o que seria inválido
  if (/^(\d)\1+$/.test(cleanedCPF)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanedCPF.charAt(i)) * (10 - i);
  }
  
  let resto = soma % 11;
  const digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cleanedCPF.charAt(9)) !== digitoVerificador1) {
    return false;
  }
  
  // Validação do segundo dígito verificador
  soma = 0;
  
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanedCPF.charAt(i)) * (11 - i);
  }
  
  resto = soma % 11;
  const digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cleanedCPF.charAt(10)) === digitoVerificador2;
};

/**
 * Formata um número de telefone
 */
export const formatPhone = (phone: string): string => {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formata de acordo com o comprimento
  if (cleaned.length === 11) {
    // Celular com DDD (11) 98765-4321
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Telefone fixo com DDD (11) 3765-4321
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return cleaned;
};

/**
 * Remove a formatação do telefone, deixando apenas os números
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
}; 