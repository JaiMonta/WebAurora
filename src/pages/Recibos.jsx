import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Download, RefreshCw } from 'lucide-react';

export default function Recibos() {
  const [periodo, setPeriodo] = useState('2026-07');
  const [tasaBcv, setTasaBcv] = useState(36.50);
  const [unidades, setUnidades] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  async function cargarDatos() {
    try {
      setLoading(true);

      const { data: dataUnidades, error: errUnidades } = await supabase
        .from('unidades')
        .select('*');

      if (errUnidades) throw errUnidades;

      const { data: dataGastos, error: errGastos } = await supabase
        .from('gastos_comunes')
        .select('*')
        .eq('periodo', periodo);

      if (errGastos) throw errGastos;

      const gastosNormalizados = (dataGastos || []).map(g => ({
        ...g,
        codigo: g.codigo || '',
        monto_usd: Number(g.monto_usd || 0),
        descripcion: g.descripcion || 'Sin descripción',
        unidades_reparto: g.unidades_reparto ? Number(g.unidades_reparto) : null
      }));

      setUnidades(dataUnidades || []);
      setGastos(gastosNormalizados);
      
      if (dataUnidades && dataUnidades.length > 0) {
        setUnidadSeleccionada(dataUnidades[0]);
      }
    } catch (err) {
      console.error('Error cargando datos de recibos:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const getCampo = (item, keys) => {
    if (!item) return null;
    for (let key of keys) {
      if (item[key] !== undefined && item[key] !== null) return item[key];
    }
    return null;
  };

  // --- CÁLCULOS DEL RECIBO ---
  const alicuota = Number(getCampo(unidadSeleccionada, ['alicuota_porcentaje', 'alicuota']) || 0);

  // 1. Gastos Comunes Directos
  const gastosComunesLista = gastos.filter(g => g.categoria === 'GASTO_COMUN');
  const totalGastosComunes = gastosComunesLista.reduce((acc, curr) => acc + curr.monto_usd, 0);

  // 2. Ingresos / Deducciones
  const ingresosLista = gastos.filter(g => g.categoria === 'INGRESO_EXTRA');
  const totalIngresos = ingresosLista.reduce((acc, curr) => acc + curr.monto_usd, 0);

  // 3. Gastos NO Comunes (Reparto individual por cuota fija)
  const gastosNoComunesLista = gastos
    .filter(g => g.categoria === 'GASTO_NO_COMUN' && g.codigo !== 'GNC04' && g.codigo !== 'GNC05')
    .map(gnc => {
      const cantUnid = gnc.unidades_reparto || 35;
      const cuotaInd = gnc.monto_usd / cantUnid;
      return {
        ...gnc,
        cantUnid,
        cuotaInd
      };
    });

  const totalGastosNoComunesBase = gastosNoComunesLista.reduce((acc, curr) => acc + curr.monto_usd, 0);
  const totalNoComunesUnidad = gastosNoComunesLista.reduce((acc, curr) => acc + curr.cuotaInd, 0);

  // --- REGLA SOLICITADA ---
  // Subtotal = Gastos Comunes + Gastos No Comunes - Ingresos
  const subTotalBase = totalGastosComunes + totalGastosNoComunesBase - totalIngresos;
  
  // A Pagar Unidad Subtotal
  const cuotaComunAPagar = ((totalGastosComunes - totalIngresos) * alicuota) / 100;
  const subTotalAPagarUnidad = cuotaComunAPagar + totalNoComunesUnidad;

  // Fondo de Reserva = 10% del Subtotal
  const fondoReservaBase = Math.max(0, subTotalBase) * 0.10;
  const fondoReservaAPagar = (fondoReservaBase * alicuota) / 100;

  // 4. Servicios No Comunes Especiales (Gas / Impresión de Recibos)
  const itemGas = gastos.find(g => g.codigo === 'GNC05' || g.descripcion?.toLowerCase().includes('gas'));
  const itemRecibo = gastos.find(g => g.codigo === 'GNC04' || g.descripcion?.toLowerCase().includes('impresión'));

  const montoGasTotal = itemGas ? Number(itemGas.monto_usd || 0) : 0;
  const montoReciboTotal = itemRecibo ? Number(itemRecibo.monto_usd || 0) : 0;

  const cantGas = itemGas?.unidades_reparto || unidades.filter(u => u.apaga_gas === true).length || 22;
  const cantRecibo = itemRecibo?.unidades_reparto || unidades.filter(u => u.apaga_recibo === true).length || 2;

  const cuotaGas = (unidadSeleccionada?.apaga_gas) ? (montoGasTotal / (cantGas || 1)) : 0;
  const cuotaRecibo = (unidadSeleccionada?.apaga_recibo) ? (montoReciboTotal / (cantRecibo || 1)) : 0;

  // 5. TOTAL GENERAL
  const totalGeneralBase = subTotalBase + fondoReservaBase + montoGasTotal + montoReciboTotal;
  const totalGeneralUsd = subTotalAPagarUnidad + fondoReservaAPagar + cuotaGas + cuotaRecibo;
  const totalGeneralVes = totalGeneralUsd * tasaBcv;

  const imprimirPDF = () => {
    window.print();
  };

  const unidadesFiltradas = unidades.filter(u => {
    const cod = String(getCampo(u, ['codigo_unidad', 'numero_inmueble']) || '').toLowerCase();
    const prop = String(getCampo(u, ['propietario_nombre', 'propietario']) || '').toLowerCase();
    const bus = busqueda.toLowerCase();
    return cod.includes(bus) || prop.includes(bus);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, nav, aside, button, input {
            display: none !important;
          }
          .print-area {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 20px !important;
            width: 100% !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      {/* Encabezado */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Emisión de Recibos de Condominio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generación e impresión de avisos de cobro</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Período:</label>
            <input 
              type="month" 
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <label className="text-xs font-bold text-emerald-700 uppercase">Tasa BCV (Bs):</label>
            <input 
              type="number" 
              step="0.01"
              value={tasaBcv}
              onChange={(e) => setTasaBcv(Number(e.target.value))}
              className="w-20 text-right font-bold text-emerald-800 bg-transparent border-b border-emerald-400 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Izquierdo: Lista de Inmuebles */}
        <div className="no-print bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar inmueble..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={18} className="animate-spin" />
                <span>Cargando unidades...</span>
              </div>
            ) : (
              unidadesFiltradas.map((u) => {
                const cod = getCampo(u, ['codigo_unidad', 'numero_inmueble']);
                const prop = getCampo(u, ['propietario_nombre', 'propietario']) || 'No asignado';
                const esSeleccionado = unidadSeleccionada?.id === u.id;
                const alic = Number(getCampo(u, ['alicuota_porcentaje', 'alicuota']) || 0);

                return (
                  <button
                    key={u.id}
                    onClick={() => setUnidadSeleccionada(u)}
                    className={`w-full text-left p-4 transition-all flex items-center justify-between cursor-pointer ${
                      esSeleccionado ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-800 block">{cod}</span>
                      <span className="text-xs text-slate-500 block truncate max-w-[160px]">{prop}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{alic.toFixed(2)}% alícuota</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho: Vista Recibo */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          
          {unidadSeleccionada ? (
            <div>
              <div className="print-area p-6 bg-white text-slate-900 border border-slate-300 rounded-lg text-xs space-y-4">
                
                {/* Encabezado del Documento */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-blue-900 tracking-wider">Residencias Aurora</h2>
                    <p className="text-[11px] font-bold text-slate-600 uppercase">CONDOMINIO</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      RECIBO DE CONDOMINIO <span className="uppercase">{periodo}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">Alícuota: {alicuota.toFixed(2)}%</p>
                    <p className="text-xs text-slate-700 mt-1">
                      Propietario: <span className="font-bold uppercase">{getCampo(unidadSeleccionada, ['propietario_nombre', 'propietario'])}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">Inmueble: <span className="font-bold text-slate-800">{getCampo(unidadSeleccionada, ['codigo_unidad', 'numero_inmueble'])}</span></p>
                  </div>
                </div>

                {/* Tabla de Detalle */}
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-slate-400 bg-slate-100 text-slate-700 uppercase font-bold">
                      <th className="py-1.5 px-2 text-left">GASTO DESCRIPCIÓN</th>
                      <th className="py-1.5 px-2 text-right w-28">MONTO USD.</th>
                      <th className="py-1.5 px-2 text-right w-28">A PAGAR USD.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    
                    {/* Gastos Comunes */}
                    {gastosComunesLista.map((g, i) => {
                      const cuotaItem = (g.monto_usd * alicuota) / 100;
                      return (
                        <tr key={`gc-${i}`}>
                          <td className="py-1 px-2 text-slate-800">
                            {g.codigo ? <span className="font-mono font-bold mr-1 text-slate-500">[{g.codigo}]</span> : null}
                            {g.descripcion}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">{g.monto_usd.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">{cuotaItem.toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {/* Gastos No Comunes */}
                    {gastosNoComunesLista.map((gnc, i) => (
                      <tr key={`gnc-${i}`}>
                        <td className="py-1 px-2 text-slate-800">
                          {gnc.codigo ? <span className="font-mono font-bold mr-1 text-slate-500">[{gnc.codigo}]</span> : null}
                          {gnc.descripcion} (ENTRE {gnc.cantUnid} UNIDADES)
                        </td>
                        <td className="py-1 px-2 text-right font-mono">{gnc.monto_usd.toFixed(2)}</td>
                        <td className="py-1 px-2 text-right font-mono font-semibold">{gnc.cuotaInd.toFixed(2)}</td>
                      </tr>
                    ))}

                    {/* Deducciones / Ingresos */}
                    {ingresosLista.map((ing, i) => {
                      const cuotaIngreso = (ing.monto_usd * alicuota) / 100;
                      return (
                        <tr key={`ing-${i}`} className="text-emerald-700">
                          <td className="py-1 px-2 font-medium">
                            Menos {ing.descripcion}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">-{ing.monto_usd.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">-{cuotaIngreso.toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {/* SUB-TOTAL OPERATIVO */}
                    <tr className="font-bold bg-slate-50 border-t-2 border-slate-300">
                      <td className="py-1.5 px-2 uppercase">SUB-TOTAL</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subTotalBase.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-900">{subTotalAPagarUnidad.toFixed(2)}</td>
                    </tr>

                    {/* Fondo de Reserva 10% del Subtotal */}
                    <tr>
                      <td className="py-1 px-2 text-slate-800">Fondo de reserva 10%</td>
                      <td className="py-1 px-2 text-right font-mono">{fondoReservaBase.toFixed(2)}</td>
                      <td className="py-1 px-2 text-right font-mono font-semibold">{fondoReservaAPagar.toFixed(2)}</td>
                    </tr>

                    {/* Servicios especiales si aplican */}
                    {cuotaGas > 0 && (
                      <tr>
                        <td className="py-1 px-2 text-slate-800">Servicio de Gas Residencial ({cantGas} UNID)</td>
                        <td className="py-1 px-2 text-right font-mono">{montoGasTotal.toFixed(2)}</td>
                        <td className="py-1 px-2 text-right font-mono font-semibold">{cuotaGas.toFixed(2)}</td>
                      </tr>
                    )}

                    {cuotaRecibo > 0 && (
                      <tr>
                        <td className="py-1 px-2 text-slate-800">Impresión de Recibos ({cantRecibo} UNID)</td>
                        <td className="py-1 px-2 text-right font-mono">{montoReciboTotal.toFixed(2)}</td>
                        <td className="py-1 px-2 text-right font-mono font-semibold">{cuotaRecibo.toFixed(2)}</td>
                      </tr>
                    )}

                    {/* TOTAL A CANCELAR */}
                    <tr className="font-bold text-sm bg-slate-100 border-t-2 border-b-2 border-slate-800">
                      <td className="py-2 px-2 uppercase">TOTAL A CANCELAR</td>
                      <td className="py-2 px-2 text-right font-mono">${totalGeneralBase.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-indigo-900">${totalGeneralUsd.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Pie de Recibo */}
                <div className="pt-2 border-t border-slate-300 text-[10px] space-y-1.5 text-slate-700">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{getCampo(unidadSeleccionada, ['codigo_unidad', 'numero_inmueble'])}</span>
                    <span>Deuda pendiente: 0,00 USD</span>
                    <span>Mora 5% mensual por atraso de 0 mes(es): 0,00</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center leading-relaxed">
                    <p className="font-bold text-slate-800">INFORMACIÓN DE PAGO:</p>
                    <p>
                      Pago Móvil (Venezuela) <strong>04243407687</strong> | C.I. <strong>8790431</strong> | Cta. Ahorro B. VENEZUELA <strong>01020215930100065216</strong>
                    </p>
                    <p>Eudomar Gil - <strong>gileudomar@gmail.com</strong> (Tasa Oficial BCV: Bs. {tasaBcv.toFixed(2)} / Total Bs. {totalGeneralVes.toFixed(2)})</p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Selecciona una unidad para emitir el recibo.</div>
          )}

          {/* Botón Imprimir */}
          <div className="no-print mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={imprimirPDF}
              disabled={!unidadSeleccionada}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={16} />
              <span>Guardar como PDF / Imprimir</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}