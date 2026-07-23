import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  AlertCircle,
  RefreshCw,
  Flame,
  Printer
} from 'lucide-react';

export default function Gastos() {
  const [periodo, setPeriodo] = useState('2026-07');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Plantilla base sincronizada con tu estructura de Supabase
  const plantillaBase = [
    { codigo: 'GC001', descripcion: 'HONORARIOS LOURDES GARCIA', monto_usd: 180, categoria: 'GASTO_COMUN' },
    { codigo: 'GC019', descripcion: 'Aceite para ascensor.', monto_usd: 15, categoria: 'GASTO_COMUN' },
    { codigo: 'GC005', descripcion: 'ELECTRICIDAD + Relleno Sanitario', monto_usd: 160, categoria: 'GASTO_COMUN' },
    { codigo: 'GC006', descripcion: 'HIDROCENTRO', monto_usd: 95, categoria: 'GASTO_COMUN' },
    { codigo: 'GC008', descripcion: 'Bombillos normales y Led.', monto_usd: 15, categoria: 'GASTO_COMUN' },
    { codigo: 'GC010', descripcion: 'MANTENIMIENTO ASCENSOR', monto_usd: 40, categoria: 'GASTO_COMUN' },
    { codigo: 'GC011', descripcion: 'Compra cilindro puerta principal.', monto_usd: 20, categoria: 'GASTO_COMUN' },
    { codigo: 'GC003', descripcion: 'Productos de limpieza', monto_usd: 95, categoria: 'GASTO_COMUN' },
    { codigo: 'GNC03', descripcion: 'Administración 150 $', monto_usd: 230, categoria: 'GASTO_COMUN' },
    { codigo: 'GC016', descripcion: 'Otros gastos comunes', monto_usd: 0, categoria: 'GASTO_COMUN' },
    { codigo: 'ING001', descripcion: 'Cuota por alquiler de conserjería', monto_usd: 85, categoria: 'INGRESO_EXTRA' },
    { codigo: 'GNC04', descripcion: 'Impresión de recibos', monto_usd: 2, categoria: 'GASTO_NO_COMUN' },
    { codigo: 'GNC05', descripcion: 'Servicio de Gas', monto_usd: 0, categoria: 'GASTO_NO_COMUN' },
    { codigo: 'GNC01', descripcion: 'Fondo de Reserva 10%', monto_usd: 0, categoria: 'CALCULADO' }
  ];

  useEffect(() => {
    cargarGastosDelPeriodo();
  }, [periodo]);

  async function cargarGastosDelPeriodo() {
    try {
      setLoading(true);
      setMensaje(null);

      const { data: gastosGuardados, error } = await supabase
        .from('gastos_comunes')
        .select('*')
        .eq('periodo', periodo);

      if (error) throw error;

      if (gastosGuardados && gastosGuardados.length > 0) {
        // Normalizar los datos leídos de Supabase
        const mapeados = gastosGuardados.map(g => ({
          ...g,
          monto_usd: Number(g.monto_usd || g.monto || 0),
          descripcion: g.descripcion || g.concepto || ''
        }));
        setItems(mapeados);
      } else {
        setItems(plantillaBase);
      }
    } catch (err) {
      console.error('Error cargando gastos:', err.message);
      setMensaje({ tipo: 'error', texto: err.message });
      setItems(plantillaBase);
    } finally {
      setLoading(false);
    }
  }

  const handleMontoChange = (index, nuevoMonto) => {
    const nuevosItems = [...items];
    nuevosItems[index].monto_usd = Number(nuevoMonto) || 0;
    setItems(nuevosItems);
  };

  const handleDescripcionChange = (index, nuevaDescripcion) => {
    const nuevosItems = [...items];
    nuevosItems[index].descripcion = nuevaDescripcion;
    setItems(nuevosItems);
  };

  const agregarFila = () => {
    setItems([
      ...items,
      { codigo: `EXTRA-${items.length + 1}`, descripcion: '', monto_usd: 0, categoria: 'GASTO_COMUN' }
    ]);
  };

  const eliminarFila = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // --- CÁLCULOS SEGÚN REGLAS DE NEGOCIO ---
  const totalGastosComunesDirectos = items
    .filter(i => i.categoria === 'GASTO_COMUN' && i.codigo !== 'GNC01')
    .reduce((acc, curr) => acc + Number(curr.monto_usd || 0), 0);

  const totalIngresos = items
    .filter(i => i.categoria === 'INGRESO_EXTRA')
    .reduce((acc, curr) => acc + Number(curr.monto_usd || 0), 0);

  // Fondo de Reserva = 10% * (Gastos Totales - Ingresos Extra)
  const baseFondo = Math.max(0, totalGastosComunesDirectos - totalIngresos);
  const fondoReservaCalculado = baseFondo * 0.10;

  // Total Común Neto a Repartir por Alícuota
  const totalNetoComunRepartir = (totalGastosComunesDirectos - totalIngresos) + fondoReservaCalculado;

  // Guardar en Supabase usando 'monto_usd' y 'descripcion'
  async function guardarGastos() {
    try {
      setSaving(true);
      setMensaje(null);

      // Limpiar periodo anterior
      await supabase.from('gastos_comunes').delete().eq('periodo', periodo);

      const registros = items.map(item => {
        const desc = item.descripcion || item.concepto || '';

        if (item.codigo === 'GNC01' || item.categoria === 'CALCULADO') {
          return {
            periodo,
            codigo: item.codigo,
            descripcion: desc,
            monto_usd: fondoReservaCalculado,
            categoria: 'CALCULADO'
          };
        }
        return {
          periodo,
          codigo: item.codigo,
          descripcion: desc,
          monto_usd: Number(item.monto_usd) || 0,
          categoria: item.categoria
        };
      });

      const { error } = await supabase.from('gastos_comunes').insert(registros);
      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: `¡Relación de gastos para el período ${periodo} guardada correctamente!` });
    } catch (err) {
      console.error('Error guardando gastos:', err.message);
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Módulo de Gastos e Ingresos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Carga mensual de conceptos comunes, no comunes e ingresos extra</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período Mensual:</label>
          <input 
            type="month" 
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Gastos Operativos</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">${totalGastosComunesDirectos.toFixed(2)}</span>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs text-emerald-600 font-semibold uppercase block">Ingresos Extra</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">-${totalIngresos.toFixed(2)}</span>
        </div>

        <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <span className="text-xs text-indigo-600 font-semibold uppercase block">Fondo Reserva (10%)</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">+${fondoReservaCalculado.toFixed(2)}</span>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase block">Total Común a Alícuota</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">${totalNetoComunRepartir.toFixed(2)}</span>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <AlertCircle size={18} />
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Tabla de Conceptos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span>Cargando datos del período...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Descripción del Concepto</th>
                  <th className="px-6 py-3.5 text-center">Tipo de Rubro</th>
                  <th className="px-6 py-3.5 text-right w-44">Monto ($)</th>
                  <th className="px-6 py-3.5 text-center w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const esFondo = item.categoria === 'CALCULADO' || item.codigo === 'GNC01';
                  const esIngreso = item.categoria === 'INGRESO_EXTRA';
                  const esNoComun = item.categoria === 'GASTO_NO_COMUN';

                  return (
                    <tr key={idx} className={esFondo ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50/80'}>
                      <td className="px-6 py-3 font-mono text-xs font-bold text-slate-700">{item.codigo}</td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.descripcion || ''}
                          onChange={(e) => handleDescripcionChange(idx, e.target.value)}
                          disabled={esFondo}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-1 text-slate-800"
                        />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          esIngreso 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : esFondo 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : esNoComun
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {esIngreso ? 'Ingreso Extra' : esFondo ? 'Calculado (10%)' : esNoComun ? 'Gasto No Común' : 'Gasto Común'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {esFondo ? (
                          <span className="font-bold text-indigo-900">${fondoReservaCalculado.toFixed(2)}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.monto_usd}
                            onChange={(e) => handleMontoChange(idx, e.target.value)}
                            className="w-32 text-right bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {!esFondo && (
                          <button
                            onClick={() => eliminarFila(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={agregarFila}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/80 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <PlusCircle size={15} /> Agregar Concepto Extra
          </button>

          <button
            onClick={guardarGastos}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Guardar Relación del Mes</span>
          </button>
        </div>
      </div>

    </div>
  );
}