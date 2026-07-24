import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  RefreshCw,
  Percent,
  Lock
} from 'lucide-react';

export default function Alicuotas() {
  const { isAdmin, toggleAdminRole } = useAuth();
  const [unidades, setUnidades] = useState([]);
  const [saldosPendientesMapa, setSaldosPendientesMapa] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    cargarUnidadesYSaldos();
  }, []);

  async function cargarUnidadesYSaldos() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data: dataUnidades, error: errUnidades } = await supabase
        .from('unidades')
        .select('*');

      if (errUnidades) throw errUnidades;

      // Calcular suma total de pagos pendientes por unidad desde la tabla cobranzas
      const { data: dataCobranzas, error: errCobranzas } = await supabase
        .from('cobranzas')
        .select('*');

      const mapa = {};
      if (!errCobranzas && dataCobranzas) {
        dataCobranzas.forEach(c => {
          if (c.estado !== 'aprobado') {
            const cod = String(c.id_inmueble || '').toUpperCase().trim();
            mapa[cod] = (mapa[cod] || 0) + Number(c.monto_usd || 0);
          }
        });
      }

      setSaldosPendientesMapa(mapa);
      setUnidades(dataUnidades || []);
    } catch (err) {
      console.error('Error al cargar unidades y saldos:', err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getCampo = (item, keys) => {
    for (let key of keys) {
      if (item[key] !== undefined && item[key] !== null) return item[key];
    }
    return null;
  };

  const obtenerPesoOrden = (codigo) => {
    const cod = String(codigo || '').toUpperCase().trim();
    let tipoPeso = 99;
    if (cod.startsWith('APTO.')) tipoPeso = 1;
    else if (cod.startsWith('PH.')) tipoPeso = 2;
    else if (cod.startsWith('OFIC.')) tipoPeso = 3;
    else if (cod.startsWith('LOCAL')) tipoPeso = 4;

    const numeroMatch = cod.match(/\d+/);
    const numero = numeroMatch ? parseInt(numeroMatch[0], 10) : 0;
    return { tipoPeso, numero };
  };

  const totalAlicuotas = unidades.reduce((acc, item) => {
    const val = getCampo(item, ['alicuota_porcentaje', 'alicuota', 'porcentaje']);
    return acc + Number(val || 0);
  }, 0);

  const unidadesFiltradas = unidades.filter((item) => {
    const codigo = String(getCampo(item, ['codigo_unidad', 'numero_inmueble', 'unidad']) || '').toUpperCase().trim();
    const propietario = String(getCampo(item, ['propietario_nombre', 'propietario']) || '').toLowerCase();
    const textoBuscado = busqueda.toLowerCase().trim();

    const coincideTexto = codigo.toLowerCase().includes(textoBuscado) || propietario.includes(textoBuscado);
    if (!coincideTexto) return false;

    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'apto') return codigo.startsWith('APTO.');
    if (filtroTipo === 'ph') return codigo.startsWith('PH.');
    if (filtroTipo === 'ofic') return codigo.startsWith('OFIC.');
    if (filtroTipo === 'local') return codigo.startsWith('LOCAL');

    return true;
  });

  const unidadesOrdenadas = [...unidadesFiltradas].sort((a, b) => {
    const codA = getCampo(a, ['codigo_unidad', 'numero_inmueble', 'unidad']);
    const codB = getCampo(b, ['codigo_unidad', 'numero_inmueble', 'unidad']);

    const pesoA = obtenerPesoOrden(codA);
    const pesoB = obtenerPesoOrden(codB);

    if (pesoA.tipoPeso !== pesoB.tipoPeso) {
      return pesoA.tipoPeso - pesoB.tipoPeso;
    }
    return pesoA.numero - pesoB.numero;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Inmuebles y Distribución de Alícuotas</h1>
            {!isAdmin && (
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Lock size={12} />
                Saldos solo Admin
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total registrados: <span className="font-semibold text-slate-700">{unidades.length}</span> inmuebles (Aptos, Locales y Oficinas)
          </p>
        </div>

        {/* Control del 100% */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-medium w-full sm:w-auto justify-between sm:justify-start ${
          Math.abs(totalAlicuotas - 100) < 0.5 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className={`p-2 rounded-lg ${
            Math.abs(totalAlicuotas - 100) < 0.5 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {Math.abs(totalAlicuotas - 100) < 0.5 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div>
            <span className="block text-slate-500 font-normal">Suma Total Alícuotas</span>
            <span className="text-base font-bold">{totalAlicuotas.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          <strong>Error en Supabase:</strong> {errorMsg}
        </div>
      )}

      {/* Filtros con Scroll Horizontal Móvil */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código o propietario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs font-medium w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'apto', label: 'Aptos' },
            { id: 'ph', label: 'PH' },
            { id: 'ofic', label: 'Oficinas' },
            { id: 'local', label: 'Locales' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filtroTipo === tab.id 
                  ? 'bg-white text-slate-800 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Unidades Responsiva (Tabla Escritorio / Cards Móvil) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2 text-xs">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span>Cargando inmuebles...</span>
          </div>
        ) : unidadesOrdenadas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700 text-sm">No se encontraron inmuebles para esta categoría.</p>
          </div>
        ) : (
          <div>
            {/* 1. Vista Tabla Escritorio (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Código de Unidad</th>
                    <th className="px-6 py-3.5">Propietario / Residente</th>
                    <th className="px-6 py-3.5 text-center">Alícuota (%)</th>
                    <th className="px-6 py-3.5 text-right">Saldo Pendiente ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unidadesOrdenadas.map((item, idx) => {
                    const codigo = getCampo(item, ['codigo_unidad', 'numero_inmueble', 'unidad']) || `UNIDAD-${idx + 1}`;
                    const propietario = getCampo(item, ['propietario_nombre', 'propietario']) || 'No asignado';
                    const alicuotaVal = Number(getCampo(item, ['alicuota_porcentaje', 'alicuota']) || 0);

                    const codNorm = String(codigo).toUpperCase().trim();
                    const saldoCalculado = saldosPendientesMapa[codNorm] !== undefined 
                      ? saldosPendientesMapa[codNorm] 
                      : Number(getCampo(item, ['saldo_pendiente_usd', 'saldo']) || 0);

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                            <Building2 size={18} />
                          </div>
                          <span className="font-mono text-slate-900 font-bold tracking-wide">{codigo}</span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <User size={15} className="text-slate-400 shrink-0" />
                            <span>{propietario}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-lg text-xs">
                            <Percent size={12} className="text-slate-400" />
                            {alicuotaVal.toFixed(2)}%
                          </span>
                        </td>

                        {/* El campo Saldo se restringe a administradores */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isAdmin ? (
                            <span className={`font-black text-sm ${saldoCalculado > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ${saldoCalculado.toFixed(2)} USD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Lock size={12} className="text-slate-400" />
                              Solo Admin
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Vista Cards Móvil (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {unidadesOrdenadas.map((item, idx) => {
                const codigo = getCampo(item, ['codigo_unidad', 'numero_inmueble', 'unidad']) || `UNIDAD-${idx + 1}`;
                const propietario = getCampo(item, ['propietario_nombre', 'propietario']) || 'No asignado';
                const alicuotaVal = Number(getCampo(item, ['alicuota_porcentaje', 'alicuota']) || 0);

                const codNorm = String(codigo).toUpperCase().trim();
                const saldoCalculado = saldosPendientesMapa[codNorm] !== undefined 
                  ? saldosPendientesMapa[codNorm] 
                  : Number(getCampo(item, ['saldo_pendiente_usd', 'saldo']) || 0);

                return (
                  <div key={item.id || idx} className="p-4 space-y-2 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Building2 size={16} />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900">{codigo}</span>
                      </div>

                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {alicuotaVal.toFixed(2)}% alícuota
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span className="font-medium text-slate-800">{propietario}</span>
                      </div>

                      {/* El campo Saldo en móvil también se restringe a administradores */}
                      {isAdmin ? (
                        <span className={`font-black text-xs ${saldoCalculado > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {saldoCalculado > 0 ? `Saldo: $${saldoCalculado.toFixed(2)} USD` : 'Solvente ($0.00)'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          <Lock size={10} /> Saldo Admin
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}