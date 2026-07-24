import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Building,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [tasaBcv, setTasaBcv] = useState(36.50);

  useEffect(() => {
    fetchTasaBcv();
  }, []);

  async function fetchTasaBcv() {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        const val = Number(data.promedio || data.venta || data.compra);
        if (val && !isNaN(val) && val > 0) {
          setTasaBcv(Number(val.toFixed(2)));
        }
      }
    } catch (e) {
      console.warn('Error obteniendo tasa en Dashboard:', e);
    }
  }

  const resumen = {
    ingresosUSD: 2450.00,
    gastosUSD: 1820.50,
    utilidadUSD: 629.50,
    cobradoPorcentaje: 78,
  };

  const movimientosMock = [
    { id: 1, concepto: 'Servicio de Electricidad Elecenter', categoria: 'Servicios', tipo: 'gasto', montoUsd: 320.00 },
    { id: 2, concepto: 'Cobro de Condominio Apto 101', categoria: 'Cuotas Ordinarias', tipo: 'ingreso', montoUsd: 85.00 },
    { id: 3, concepto: 'Mantenimiento de Ascensores', categoria: 'Mantenimiento', tipo: 'gasto', montoUsd: 450.00 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Superior Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Resumen Financiero & Estado General</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Visión consolidada de ingresos, gastos y utilidad de ResidAurora</p>
        </div>

        {/* Tasa BCV Indicator */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="text-emerald-800 block text-[10px] font-bold">Tasa BCV del Día</span>
              <span className="font-black text-emerald-950 text-sm">{tasaBcv.toFixed(2)} Bs/$</span>
            </div>
          </div>
          <button onClick={fetchTasaBcv} className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 4 Tarjetas KPI Responsivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Ingresos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos del Mes</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">${resumen.ingresosUSD.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            ≈ {(resumen.ingresosUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Operativos</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">${resumen.gastosUSD.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            ≈ {(resumen.gastosUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
          </div>
        </div>

        {/* Utilidad / Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance / Utilidad</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">${resumen.utilidadUSD.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight size={14} /> Saldo positivo
          </div>
        </div>

        {/* % Cobranza */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nivel de Cobranza</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Building size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{resumen.cobradoPorcentaje}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${resumen.cobradoPorcentaje}%` }}></div>
          </div>
        </div>

      </div>

      {/* Tabla y Cards Responsivas de Movimientos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Últimos Movimientos Registrados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detalle de facturas, servicios y cobros de condominio</p>
          </div>
        </div>

        {/* 1. Vista Tabla Escritorio (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Concepto / Servicio</th>
                <th className="px-6 py-3.5">Categoría</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5 text-right">Monto ($)</th>
                <th className="px-6 py-3.5 text-right">Monto (Bs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientosMock.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{m.concepto}</td>
                  <td className="px-6 py-4 text-xs"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{m.categoria}</span></td>
                  <td className="px-6 py-4 text-xs">
                    {m.tipo === 'gasto' ? (
                      <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold">Gasto</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-bold">Ingreso</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {m.tipo === 'ingreso' ? '+' : ''}${m.montoUsd.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-medium">
                    {(m.montoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. Vista Cards Móvil (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {movimientosMock.map(m => (
            <div key={m.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-xs text-slate-800">{m.concepto}</h4>
                {m.tipo === 'gasto' ? (
                  <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Gasto</span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Ingreso</span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{m.categoria}</span>
                <div className="text-right">
                  <span className={`font-bold block ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {m.tipo === 'ingreso' ? '+' : ''}${m.montoUsd.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Bs. {(m.montoUsd * tasaBcv).toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}