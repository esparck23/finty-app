'use client';
import { useState, useMemo } from 'react';
import { Category } from '@/types/transaction';
import { toast } from '@/components/ui/Toaster';

const ITEMS_PER_PAGE = 8;

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        toast(`Categoría "${editName.trim()}" creada`, 'success');
      } else {
        await onUpdate(id, editName.trim(), editType);
        toast(`Categoría actualizada`, 'success');
      }
      cancelEdit();
    } catch (err: any) {
      toast(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
      toast('Categoría eliminada', 'success');
      setDeletingId(null);
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', 'error');
      setDeletingId(null);
    }
  };

  const EditRow = ({ id }: { id: string }) => (
    <tr className="border-b border-white/5 bg-blue-500/5">
      <td className="py-2 pr-3">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="input-field w-full text-sm py-2"
          placeholder="Nombre"
          autoFocus
        />
      </td>
      <td className="py-2 pr-3">
        <select
          value={editType}
          onChange={(e) => setEditType(e.target.value as 'income' | 'expense' | 'exchange')}
          className="input-field w-full text-sm py-2"
        >
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
          <option value="exchange">Cambio</option>
        </select>
      </td>
      <td className="py-2 text-right space-x-2 whitespace-nowrap">
        <button
          onClick={() => saveEdit(id)}
          disabled={saving}
          className="text-emerald-400 hover:underline text-sm disabled:opacity-50"
        >
          {saving ? '...' : 'Guardar'}
        </button>
        <button onClick={cancelEdit} className="text-slate-400 hover:underline text-sm">
          Cancelar
        </button>
      </td>
    </tr>
  );

  return (
    <div className="card-glass overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar..."
            className="input-field flex-1 text-sm py-2"
          />
          <button onClick={startNew} className="btn-primary whitespace-nowrap text-sm py-2">
            + Nueva
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-white/5">
              <th className="py-2 px-3 sm:px-4 font-medium">Nombre</th>
              <th className="py-2 px-3 sm:px-4 font-medium">Tipo</th>
              <th className="py-2 px-3 sm:px-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' && <EditRow id="new" />}

            {paginated.map((cat) => {
              if (editingId === cat.id) {
                return <EditRow key={cat.id} id={cat.id!} />;
              }
              return (
                <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="py-2 px-3 sm:px-4 font-medium text-white truncate max-w-[200px]">{cat.name}</td>
                  <td className="py-2 px-3 sm:px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeColors[cat.type]}`}>
                      {typeLabels[cat.type]}
                    </span>
                  </td>
                  <td className="py-2 px-3 sm:px-4 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(cat)} className="text-sm hover:underline text-slate-400 hover:text-white transition-colors" title="Editar">
                      ✏️
                    </button>
                    <span className="mx-2 text-slate-600">|</span>
                    <button onClick={() => setDeletingId(cat.id!)} className="text-sm hover:underline text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-500 text-sm">
                  {search ? 'Sin resultados' : 'No hay categorías'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-white/5">
          <p className="text-xs text-slate-500">
            {safePage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
              className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <p className="text-white font-medium text-lg">¿Eliminar categoría?</p>
            <p className="text-sm text-slate-400">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-sm shadow-lg shadow-red-900/20">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
