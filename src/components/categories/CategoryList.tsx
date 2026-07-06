'use client';
import { useState, useMemo } from 'react';
import { Category } from '@/types/transaction';

const ITEMS_PER_PAGE = 10;

const badgeColors: Record<string, string> = {
  income: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  expense: 'bg-red-500/10 text-red-400 border border-red-500/20',
  exchange: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

const typeLabels: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  exchange: 'Cambio',
};

interface CategoryListProps {
  categories: Category[];
  onAdd: (name: string, type: 'income' | 'expense' | 'exchange') => Promise<void>;
  onUpdate: (id: string, name: string, type: 'income' | 'expense' | 'exchange') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryList({ categories, onAdd, onUpdate, onDelete }: CategoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense' | 'exchange'>('expense');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id!);
    setEditName(cat.name);
    setEditType(cat.type);
  };

  const startNew = () => {
    setEditingId('new');
    setEditName('');
    setEditType('expense');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditType('expense');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      if (id === 'new') {
        await onAdd(editName.trim(), editType);
      } else {
        await onUpdate(id, editName.trim(), editType);
      }
      cancelEdit();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await onDelete(id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const EditRow = ({ id }: { id: string }) => (
    <tr className="border-b border-white/5 bg-blue-500/5">
      <td className="py-3 pr-4">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="input-field w-full"
          placeholder="Nombre de la categoría"
          autoFocus
        />
      </td>
      <td className="py-3 pr-4">
        <select
          value={editType}
          onChange={(e) => setEditType(e.target.value as 'income' | 'expense' | 'exchange')}
          className="input-field w-full"
        >
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
          <option value="exchange">Cambio</option>
        </select>
      </td>
      <td className="py-3 text-right space-x-2">
        <button
          onClick={() => saveEdit(id)}
          disabled={saving}
          className="text-emerald-400 hover:underline disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={cancelEdit} className="text-slate-400 hover:underline">
          Cancelar
        </button>
      </td>
    </tr>
  );

  return (
    <div className="card-glass p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar categorías..."
          className="input-field flex-1"
        />
        <button onClick={startNew} className="btn-primary whitespace-nowrap">
          + Nueva Categoría
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-white/10">
              <th className="pb-3 pr-4">Nombre</th>
              <th className="pb-3 pr-4">Tipo</th>
              <th className="pb-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' && <EditRow id="new" />}

            {paginated.map((cat) => (
              <tr key={cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {editingId === cat.id ? (
                  <EditRow id={cat.id!} />
                ) : (
                  <>
                    <td className="py-3 pr-4 font-medium">{cat.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${badgeColors[cat.type]}`}>
                        {typeLabels[cat.type]}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => startEdit(cat)} className="text-sm hover:underline" title="Editar">
                        ✏️
                      </button>
                      <span className="text-sm text-slate-500">|</span>
                      <button onClick={() => handleDelete(cat.id!)} className="text-sm hover:underline" title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {filtered.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={3} className="text-center py-6 text-slate-500">
                  {search ? 'No se encontraron categorías.' : 'No hay categorías registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-slate-500">
            Página {safePage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
