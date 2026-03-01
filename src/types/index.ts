export type TransactionType = 'income' | 'expense';

export type Category =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Outros';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

export interface FinancialSummary {
  income: number;
  expense: number;
  balance: number;
}