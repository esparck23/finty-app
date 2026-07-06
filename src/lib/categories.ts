import { db } from './db';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'exchange';
}

export async function getCategories(): Promise<Category[]> {
  const result = await db.execute(
    'SELECT id, name, type FROM categories ORDER BY type, name'
  );
  return result.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as 'income' | 'expense' | 'exchange',
  }));
}

export function groupCategoriesByType(categories: Category[]) {
  return {
    income: categories.filter((c) => c.type === 'income'),
    expense: categories.filter((c) => c.type === 'expense'),
    exchange: categories.filter((c) => c.type === 'exchange'),
  };
}
