import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../components/AdminLayout'

interface MenuItem {
  id: string; name: string; description: string; price: number
  category: string; imageUrl?: string; available: boolean; ingredients: string[]
}

const EMPTY_FORM = { name: '', description: '', price: 0, category: '蛋餅類', imageUrl: '', available: true, ingredients: [] as string[] }
const CATEGORIES = ['蛋餅類', '吐司類', '燒餅類', '飯類', '飲料類', '加點類']

export default function AdminMenuPage() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [ingredientInput, setIngredientInput] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['adminMenu'],
    queryFn: () => adminApi.menu.getAll({ limit: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.menu.create(data),
    onSuccess: () => { toast.success('餐點已新增'); qc.invalidateQueries({ queryKey: ['adminMenu'] }); setModal(null) },
    onError: () => toast.error('新增失敗'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.menu.update(id, data),
    onSuccess: () => { toast.success('餐點已更新'); qc.invalidateQueries({ queryKey: ['adminMenu'] }); setModal(null) },
    onError: () => toast.error('更新失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.menu.delete(id),
    onSuccess: () => { toast.success('餐點已刪除'); qc.invalidateQueries({ queryKey: ['adminMenu'] }) },
    onError: () => toast.error('刪除失敗'),
  })

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal('create') }
  const openEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description, price: item.price, category: item.category, imageUrl: item.imageUrl || '', available: item.available, ingredients: item.ingredients || [] })
    setEditId(item.id); setModal('edit')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, imageUrl: form.imageUrl || undefined }
    if (modal === 'create') createMutation.mutate(payload)
    else if (editId) updateMutation.mutate({ id: editId, data: payload })
  }

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setForm(f => ({ ...f, ingredients: [...f.ingredients, ingredientInput.trim()] }))
      setIngredientInput('')
    }
  }

  const items: MenuItem[] = data?.data || []

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900">菜單管理</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> 新增餐點
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="overflow-hidden card">
          <table className="w-full text-sm">
            <thead className="bg-charcoal-50 border-b border-charcoal-100">
              <tr>
                {['餐點名稱', '分類', '價格', '狀態', '操作'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-charcoal-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-charcoal-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-charcoal-900">{item.name}</div>
                    <div className="text-xs text-charcoal-500 truncate max-w-48">{item.description}</div>
                  </td>
                  <td className="px-4 py-3"><span className="badge bg-dawn-100 text-dawn-700">{item.category}</span></td>
                  <td className="px-4 py-3 font-semibold text-dawn-600">NT$ {item.price}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.available ? '供應中' : '已下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-charcoal-100 rounded-lg text-charcoal-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`確定刪除「${item.name}」？`)) deleteMutation.mutate(item.id) }}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-charcoal-950/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h2 className="font-display font-bold text-lg">{modal === 'create' ? '新增餐點' : '編輯餐點'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-charcoal-100 rounded-xl"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">餐點名稱</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">分類</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">價格 (NT$)</label>
                  <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({...f, price: Number(e.target.value)}))} min={0} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">描述</label>
                  <textarea className="input resize-none h-20" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">圖片網址 (選填)</label>
                  <input className="input" placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5">食材</label>
                  <div className="flex gap-2 mb-2">
                    <input className="input" placeholder="輸入食材後按新增" value={ingredientInput} onChange={e => setIngredientInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient() }}} />
                    <button type="button" onClick={addIngredient} className="btn-outline px-4 py-2 text-sm whitespace-nowrap">新增</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.ingredients.map((ing, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-charcoal-100 text-charcoal-700 px-2.5 py-1 rounded-full">
                        {ing}
                        <button type="button" onClick={() => setForm(f => ({...f, ingredients: f.ingredients.filter((_, j) => j !== i)}))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <label className="text-sm font-medium text-charcoal-700">供應狀態</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({...f, available: !f.available}))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.available ? 'bg-dawn-500' : 'bg-charcoal-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.available ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm ${form.available ? 'text-green-600' : 'text-charcoal-500'}`}>{form.available ? '供應中' : '已下架'}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 btn-ghost border border-charcoal-200">取消</button>
                <button type="submit" className="flex-1 btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
