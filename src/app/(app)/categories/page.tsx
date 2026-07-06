'use client';
import { useCategories } from '@/hooks/useCategories';
import { CategoryList } from '@/components/categories/CategoryList';

export default function CategoriesPage() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();

  if (loading) return <div className="p-4 md:p-8 text-center py-12 text-slate-500">Cargando categorías...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 relative min-h-full">
      <header>
        <h1 className="text-2xl font-bold text-white">Categorías</h1>
        <p className="text-slate-400 text-sm">Listado completo de categorías</p>
      </header>

      {error && <p className="text-red-400">{error}</p>}

      <CategoryList
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  );
}
