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
  Building
} from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [tasaBcv, setTasaBcv] = useState(36.50); // Valor referencial editáble o vía API

  // Resumen Financiero Simulado (se conectará con la tabla de Supabase)
  const resumen = {
    ingresosUSD: 2450.00,
    gastosUSD: 1820.50,
    utilidadUSD: 629.50,
    cobradoPorcentaje: 78,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resumen Financiero & Estado General</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visión consolidada de ingresos, gastos y utilidad de ResidAurora</p>
        </div>

        {/* Tasa BCV Indicator */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <DollarSign size={16} />
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Tasa BCV Referencial</span>
            <span className="font-bold text-slate-800 text-sm">{tasaBcv.toFixed(2)} Bs/$</span>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas Clave (Estilo Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ingresos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos del Mes</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">${resumen.ingresosUSD.toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-1">
            ≈ {(resumen.ingresosUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Operativos</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">${resumen.gastosUSD.toFixed(2)}</div>
          <div className="text-xs text-slate-400 mt-1">
            ≈ {(resumen.gastosUSD * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
          </div>
        </div>

        {/* Utilidad / Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance / Utilidad</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">${resumen.utilidadUSD.toFixed(2)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight size={14} /> Saldo positivo
          </div>
        </div>

        {/* % Cobranza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nivel de Cobranza</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Building size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{resumen.cobradoPorcentaje}%</div>
          {/* Barra de progreso */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div 
              className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${resumen.cobradoPorcentaje}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Tabla Resumen de Gastos e Ingresos del Mes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Últimos Movimientos Registrados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detalle de facturas, servicios y cobros de condominio</p>
          </div>
          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Ver todos los movimientos &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Concepto / Servicio</th>
                <th className="px-6 py-3.5">Categoría</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5 text-right">Monto ($)</th>
                <th className="px-6 py-3.5 text-right">Monto (Bs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">Servicio de Electricidad Elecenter</td>
                <td className="px-6 py-4 text-xs"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Servicios</span></td>
                <td className="px-6 py-4 text-xs"><span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-medium">Gasto</span></td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">$320.00</td>
                <td className="px-6 py-4 text-right text-slate-500">{(320 * tasaBcv).toLocaleString('es-VE')} Bs.</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">Cobro de Condominio Apto 101</td>
                <td className="px-6 py-4 text-xs"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Cuotas Ordinarias</span></td>
                <td className="px-6 py-4 text-xs"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">Ingreso</span></td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">+$85.00</td>
                <td className="px-6 py-4 text-right text-slate-500">{(85 * tasaBcv).toLocaleString('es-VE')} Bs.</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">Mantenimiento de Ascensores</td>
                <td className="px-6 py-4 text-xs"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Mantenimiento</span></td>
                <td className="px-6 py-4 text-xs"><span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-medium">Gasto</span></td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">$450.00</td>
                <td className="px-6 py-4 text-right text-slate-500">{(450 * tasaBcv).toLocaleString('es-VE')} Bs.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}