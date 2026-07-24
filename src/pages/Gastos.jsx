import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Edit2, Save, X, RefreshCw } from 'lucide-react';

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('2026-07');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    codigo: 'GC0001',
    descripcion: '',
    monto_usd: '',
    categoria: 'GASTO_COMUN',
    periodo: '2026-07',
    unidades_reparto: 35
  });

  useEffect(() => {
    cargarGastos();
  }, [periodo]);

  async function cargarGastos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gastos_comunes')
        .select('*')
        .eq('periodo', periodo)
        .order('id', { ascending: true });

      if (error) throw error;
      setGastos(data || []);
    } catch (err) {
      console.error('Error al cargar gastos:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Sugerir prefijo de código al cambiar de categoría
  const handleCategoriaChange = (nuevaCat) => {
    let codSugerido = formData.codigo;
    if (!editingId) {
      if (nuevaCat === 'GASTO_COMUN') codSugerido = 'GC0001';
      else if (nuevaCat === 'GASTO_NO_COMUN') codSugerido = 'GNC01';
      else if (nuevaCat === 'INGRESO_EXTRA') codSugerido = 'ING01';
    }

    setFormData(prev => ({
      ...prev,
      categoria: nuevaCat,
      codigo: codSugerido
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.descripcion || !formData.monto_usd) {
      alert('Por favor complete el código, la descripción y el monto.');
      return;
    }

    try {
      const esNoComun = formData.categoria === 'GASTO_NO_COMUN';
      const numUnidades = esNoComun 
        ? (parseInt(formData.unidades_reparto, 10) || 35) 
        : null;

      const payload = {
        codigo: formData.codigo.trim().toUpperCase(),
        descripcion: formData.descripcion,
        monto_usd: parseFloat(formData.monto_usd) || 0,
        categoria: formData.categoria,
        periodo: periodo,
        unidades_reparto: numUnidades
      };

      if (editingId) {
        const { error } = await supabase
          .from('gastos_comunes')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gastos_comunes')
          .insert([payload]);

        if (error) throw error;
      }

      resetForm();
      cargarGastos();
    } catch (err) {
      console.error('Error al guardar:', err);
      alert(`Error guardando el registro: ${err.message || 'Revisa la consola'}`);
    }
  };

  const handleEdit = (gasto) => {
    setEditingId(gasto.id);
    const esNoComun = gasto.categoria === 'GASTO_NO_COMUN';

    setFormData({
      codigo: gasto.codigo || (esNoComun ? 'GNC01' : 'GC0001'),
      descripcion: gasto.descripcion || '',
      monto_usd: gasto.monto_usd || '',
      categoria: gasto.categoria || 'GASTO_COMUN',
      periodo: gasto.periodo || periodo,
      unidades_reparto: esNoComun ? (gasto.unidades_reparto || 35) : 35
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      const { error } = await supabase.from('gastos_comunes').delete().eq('id', id);
      if (error) throw error;
      cargarGastos();
    } catch (err) {
      console.error('Error eliminando:', err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      codigo: 'GC0001',
      descripcion: '',
      monto_usd: '',
      categoria: 'GASTO_COMUN',
      periodo: periodo,
      unidades_reparto: 35
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Gastos e Ingresos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro de egresos comunes, no comunes y deducciones</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Período:</label>
          <input 
            type="month" 
            value={periodo}
            onChange={(e) => {
              setPeriodo(e.target.value);
              setFormData(prev => ({ ...prev, periodo: e.target.value }));
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-fit">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
            {editingId ? 'Editar Registro' : 'Nuevo Registro'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Código</label>
                <input
                  type="text"
                  required
                  placeholder="GC0001"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GASTO_COMUN">Gasto Común (Alícuota)</option>
                  <option value="GASTO_NO_COMUN">Gasto No Común (Reparto Fijo)</option>
                  <option value="INGRESO_EXTRA">Ingreso / Deducción (Renta)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Descripción</label>
              <input
                type="text"
                required
                placeholder="Ej. Honorarios Profesionales / Administración"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monto (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.monto_usd}
                onChange={(e) => setFormData({ ...formData, monto_usd: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {formData.categoria === 'GASTO_NO_COMUN' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-900">
                  ¿Entre cuántas unidades se divide este gasto?
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.unidades_reparto}
                  onChange={(e) => setFormData({ ...formData, unidades_reparto: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-800 leading-tight">
                  Cuota individual para este gasto: <span className="font-bold">${((parseFloat(formData.monto_usd || 0)) / (parseInt(formData.unidades_reparto, 10) || 1)).toFixed(2)} USD</span>
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>{editingId ? 'Actualizar Registro' : 'Guardar Registro'}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabla de Registros */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase">Registros del Período ({gastos.length})</span>
            <button onClick={cargarGastos} className="text-slate-400 hover:text-slate-600">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* 1. Vista Tabla Escritorio (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-center">Reparto</th>
                  <th className="p-3 text-right">Monto (USD)</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gastos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400">No hay gastos registrados en este período.</td>
                  </tr>
                ) : (
                  gastos.map((g) => {
                    const esNoComun = g.categoria === 'GASTO_NO_COMUN';
                    const esIngreso = g.categoria === 'INGRESO_EXTRA';
                    const cantUnidades = g.unidades_reparto || 35;
                    const cuotaInd = (g.monto_usd || 0) / cantUnidades;

                    return (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{g.codigo || '—'}</td>
                        <td className="p-3 font-semibold text-slate-800">{g.descripcion || 'Sin descripción'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            esIngreso ? 'bg-emerald-100 text-emerald-800' :
                            esNoComun ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {esIngreso ? 'INGRESO / DEDUCCIÓN' : esNoComun ? 'NO COMÚN' : 'COMÚN'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                          {esNoComun ? `${cantUnidades} unid. ($${cuotaInd.toFixed(2)} c/u)` : 'Por Alícuota'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          ${Number(g.monto_usd || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button onClick={() => handleEdit(g)} className="text-indigo-600 hover:text-indigo-800 p-1">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(g.id)} className="text-rose-600 hover:text-rose-800 p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 2. Vista Cards Móvil (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {gastos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No hay gastos registrados en este período.</div>
            ) : (
              gastos.map((g) => {
                const esNoComun = g.categoria === 'GASTO_NO_COMUN';
                const esIngreso = g.categoria === 'INGRESO_EXTRA';
                const cantUnidades = g.unidades_reparto || 35;
                const cuotaInd = (g.monto_usd || 0) / cantUnidades;

                return (
                  <div key={g.id} className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{g.codigo || '—'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          esIngreso ? 'bg-emerald-100 text-emerald-800' :
                          esNoComun ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {esIngreso ? 'INGRESO' : esNoComun ? 'NO COMÚN' : 'COMÚN'}
                        </span>
                      </div>
                      <span className="font-black text-slate-900 text-sm">${Number(g.monto_usd || 0).toFixed(2)}</span>
                    </div>

                    <p className="font-bold text-xs text-slate-800">{g.descripcion || 'Sin descripción'}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>{esNoComun ? `${cantUnidades} unid. ($${cuotaInd.toFixed(2)} c/u)` : 'Reparto por Alícuota'}</span>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(g)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs flex items-center gap-1">
                          <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs flex items-center gap-1">
                          <Trash2 size={12} /> Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}