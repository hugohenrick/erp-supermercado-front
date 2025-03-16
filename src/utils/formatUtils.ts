import { BranchType, BranchStatus, Address, PersonType, CustomerType, CustomerStatus, TaxRegime, AddressTypes } from '../services/api';

/**
 * Formata o endereço completo
 * @param address Objeto de endereço
 * @param short Se true, retorna uma versão reduzida do endereço
 * @returns Endereço formatado
 */
export const formatFullAddress = (address: Address, short: boolean = false): string => {
  if (!address) return '';
  
  if (short) {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}`;
  }
  
  return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}, ${address.district}, ${address.city}, ${address.state}, ${address.zipCode}`;
};

/**
 * Formata o endereço resumido (apenas rua e número)
 * @param address Objeto de endereço
 * @returns Endereço resumido
 */
export const formatShortAddress = (address: Address): string => {
  if (!address) return '';
  return formatFullAddress(address, true);
};

/**
 * Formata o CEP
 * @param zipCode CEP não formatado
 * @returns CEP formatado (00000-000)
 */
export const formatZipCode = (zipCode: string): string => {
  if (!zipCode) return '';
  
  // Remove caracteres não numéricos
  const digits = zipCode.replace(/\D/g, '');
  
  if (digits.length !== 8) return zipCode;
  
  // Formata como 00000-000
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/**
 * Formata o tipo de filial
 * @param type Tipo de filial (enum)
 * @returns Descrição do tipo de filial
 */
export const formatBranchType = (type: BranchType): string => {
  const types: Record<BranchType, string> = {
    [BranchType.MAIN]: 'Matriz',
    [BranchType.BRANCH]: 'Filial',
    [BranchType.WAREHOUSE]: 'Depósito',
    [BranchType.DISTRIBUTION]: 'Centro de Distribuição',
    [BranchType.OTHER]: 'Outro'
  };
  
  return types[type] || type;
};

/**
 * Formata o status da filial
 * @param status Status da filial (enum)
 * @returns Descrição do status da filial
 */
export const formatBranchStatus = (status: BranchStatus): string => {
  const statuses: Record<BranchStatus, string> = {
    [BranchStatus.ACTIVE]: 'Ativo',
    [BranchStatus.INACTIVE]: 'Inativo',
    [BranchStatus.SUSPENDED]: 'Suspenso',
    [BranchStatus.MAINTENANCE]: 'Manutenção'
  };
  
  return statuses[status] || status;
};

/**
 * Retorna a cor correspondente ao status da filial
 * @param status Status da filial (enum)
 * @returns Nome da cor para o status
 */
export const getBranchStatusColor = (status: BranchStatus): string => {
  const colors: Record<BranchStatus, string> = {
    [BranchStatus.ACTIVE]: 'success',
    [BranchStatus.INACTIVE]: 'error',
    [BranchStatus.SUSPENDED]: 'warning',
    [BranchStatus.MAINTENANCE]: 'info'
  };
  
  return colors[status] || 'default';
};

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns Data formatada
 */
export const formatDate = (date?: Date | string): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formata uma data e hora para exibição (DD/MM/YYYY HH:MM)
 * @param date Data a ser formatada
 * @returns Data e hora formatada
 */
export const formatDateTime = (date?: Date | string): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Formata o tipo de pessoa
 * @param type Tipo de pessoa (enum)
 * @returns Descrição do tipo de pessoa
 */
export const formatPersonType = (type: PersonType): string => {
  const types: Record<PersonType, string> = {
    [PersonType.PF]: 'Pessoa Física',
    [PersonType.PJ]: 'Pessoa Jurídica'
  };
  
  return types[type] || type;
};

/**
 * Formata o tipo de cliente
 * @param type Tipo de cliente (enum)
 * @returns Descrição do tipo de cliente
 */
export const formatCustomerType = (type: CustomerType): string => {
  const types: Record<CustomerType, string> = {
    [CustomerType.FINAL]: 'Consumidor Final',
    [CustomerType.RESELLER]: 'Revendedor',
    [CustomerType.WHOLESALE]: 'Atacadista'
  };
  
  return types[type] || type;
};

/**
 * Formata o status do cliente
 * @param status Status do cliente (enum)
 * @returns Descrição do status do cliente
 */
export const formatCustomerStatus = (status: CustomerStatus): string => {
  const statuses: Record<CustomerStatus, string> = {
    [CustomerStatus.ACTIVE]: 'Ativo',
    [CustomerStatus.INACTIVE]: 'Inativo',
    [CustomerStatus.BLOCKED]: 'Bloqueado'
  };
  
  return statuses[status] || status;
};

/**
 * Retorna a cor correspondente ao status do cliente
 * @param status Status do cliente (enum)
 * @returns Nome da cor para o status
 */
export const getCustomerStatusColor = (status: CustomerStatus): string => {
  const colors: Record<CustomerStatus, string> = {
    [CustomerStatus.ACTIVE]: 'success',
    [CustomerStatus.INACTIVE]: 'error',
    [CustomerStatus.BLOCKED]: 'warning'
  };
  
  return colors[status] || 'default';
};

/**
 * Formata o regime tributário
 * @param regime Regime tributário (enum)
 * @returns Descrição do regime tributário
 */
export const formatTaxRegime = (regime: TaxRegime): string => {
  const regimes: Record<TaxRegime, string> = {
    [TaxRegime.SIMPLES]: 'Simples Nacional',
    [TaxRegime.MEI]: 'Microempreendedor Individual',
    [TaxRegime.PRESUMIDO]: 'Lucro Presumido',
    [TaxRegime.REAL]: 'Lucro Real'
  };
  
  return regimes[regime] || regime;
};

/**
 * Formata o tipo de endereço
 * @param type Tipo de endereço (string)
 * @returns Descrição do tipo de endereço
 */
export const formatAddressType = (type: string): string => {
  const types: Record<string, string> = {
    [AddressTypes.COMMERCIAL]: 'Comercial',
    [AddressTypes.RESIDENTIAL]: 'Residencial',
    [AddressTypes.DELIVERY]: 'Entrega',
    [AddressTypes.BILLING]: 'Cobrança',
    [AddressTypes.OTHER]: 'Outro'
  };
  
  return types[type] || type;
}; 