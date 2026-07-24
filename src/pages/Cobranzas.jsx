import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Building2, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Check, 
  X, 
  Wallet,
  TrendingUp,
  User,
  ArrowRightLeft,
  ShieldAlert,
  Lock,
  Calculator,
  Receipt,
  CheckCheck,
  Layers,
  AlertTriangle,
  History
} from 'lucide-react';

const UNIDADES_DEFAULT = [
  { id: '1', codigo_unidad: 'APTO. 101', propietario_nombre: 'María Rodríguez', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '2', codigo_unidad: 'APTO. 102', propietario_nombre: 'José Antonio Pérez', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '3', codigo_unidad: 'APTO. 103', propietario_nombre: 'Carmen Luisa García', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: true },
  { id: '4', codigo_unidad: 'APTO. 104', propietario_nombre: 'Roberto Fernández', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '5', codigo_unidad: 'APTO. 201', propietario_nombre: 'Elena Gómez', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '6', codigo_unidad: 'APTO. 202', propietario_nombre: 'Luis Eduardo Morales', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '7', codigo_unidad: 'APTO. 203', propietario_nombre: 'Ana Isabel Torres', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '8', codigo_unidad: 'APTO. 204', propietario_nombre: 'Carlos Mendoza', alicuota_porcentaje: 2.85, apaga_gas: true, apaga_recibo: false },
  { id: '9', codigo_unidad: 'PH. 01', propietario_nombre: 'Alejandro Silva', alicuota_porcentaje: 4.50, apaga_gas: true, apaga_recibo: true },
  { id: '10', codigo_unidad: 'PH. 02', propietario_nombre: 'Patricia Villalobos', alicuota_porcentaje: 4.50, apaga_gas: true, apaga_recibo: false },
];

export default function Cobranzas() {
  const { isAdmin, toggleAdminRole } = useAuth();
  
  // Período seleccionado
  const [periodo, setPeriodo] = useState('2026-07');
  
  // Datos principales
  const [historicoCobranzas, setHistoricoCobranzas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [gastosPorPeriodo, setGastosPorPeriodo] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Tasa BCV y metadatos
  const [tasaBcv, setTasaBcv] = useState(36.50);
  const [obteniendoTasa, setObteniendoTasa] = useState(false);
  const [tasaFuente, setTasaFuente] = useState('BCV Oficial (bcv.org.ve)');
  const [fechaTasaBcv, setFechaTasaBcv] = useState(new Date().toLocaleDateString('es-VE'));

  // Filtros y Búsqueda
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comprobanteModalUrl, setComprobanteModalUrl] = useState(null);

  // Estado del Formulario
  const [nuevoPago, setNuevoPago] = useState({
    id_inmueble: '',
    periodo_pago: '2026-07',
    monto_usd: '',
    monto_bs: '',
    tasa_cambio: 36.50,
    metodo_pago: 'pago_movil',
    referencia: '',
    comprobante_url: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  useEffect(() => {
    cargarDatosGenerales();
    obtenerTasaBcvDelDia();
  }, []);

  async function obtenerTasaBcvDelDia() {
    try {
      setObteniendoTasa(true);
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        const valorTasa = Number(data.promedio || data.venta || data.compra);
        if (valorTasa && !isNaN(valorTasa) && valorTasa > 0) {
          const tasaFormateada = Number(valorTasa.toFixed(2));
          setTasaBcv(tasaFormateada);
          setTasaFuente('Banco Central de Venezuela (bcv.org.ve)');
          if (data.fechaActualizacion) {
            setFechaTasaBcv(new Date(data.fechaActualizacion).toLocaleDateString('es-VE'));
          }
          return tasaFormateada;
        }
      }

      const res2 = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv');
      if (res2.ok) {
        const data2 = await res2.json();
        const valor2 = Number(data2?.monedas?.usd?.promedio || data2?.bcv?.promedio);
        if (valor2 && !isNaN(valor2) && valor2 > 0) {
          const tasaFormateada2 = Number(valor2.toFixed(2));
          setTasaBcv(tasaFormateada2);
          setTasaFuente('Banco Central de Venezuela (bcv.org.ve)');
          return tasaFormateada2;
        }
      }
    } catch (err) {
      console.warn('No se pudo obtener la tasa BCV del día:', err.message);
    } finally {
      setObteniendoTasa(false);
    }
  }

  async function cargarDatosGenerales() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data: dataUnidades } = await supabase.from('unidades').select('*');
      const listaUnidades = (dataUnidades && dataUnidades.length > 0) ? dataUnidades : UNIDADES_DEFAULT;
      setUnidades(listaUnidades);

      const { data: dataGastos } = await supabase.from('gastos_comunes').select('*');
      const mapaGastos = {};
      if (dataGastos) {
        dataGastos.forEach(g => {
          const p = g.periodo || '2026-07';
          if (!mapaGastos[p]) mapaGastos[p] = [];
          mapaGastos[p].push(g);
        });
      }
      setGastosPorPeriodo(mapaGastos);

      const { data: dataCobranzas, error: errCobranzas } = await supabase
        .from('cobranzas')
        .select('*')
        .order('created_at', { ascending: true });

      if (!errCobranzas && dataCobranzas) {
        setHistoricoCobranzas(dataCobranzas);
      } else {
        setHistoricoCobranzas([]);
      }

    } catch (err) {
      console.error('Error cargando cobranzas:', err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  const calcularReciboUnidad = (unidad, periodoCalcular, tasa) => {
    if (!unidad) return { totalUsd: 45.00, totalBs: 45.00 * tasa };

    const getCampo = (item, keys) => {
      for (let k of keys) {
        if (item[k] !== undefined && item[k] !== null) return item[k];
      }
      return null;
    };

    const alicuota = Number(getCampo(unidad, ['alicuota_porcentaje', 'alicuota', 'porcentaje']) || 2.857);
    const listaGastos = gastosPorPeriodo[periodoCalcular] || [];

    if (listaGastos.length === 0) {
      const baseEstimadaUSD = 45.00 * (alicuota / 2.857);
      return {
        totalUsd: Number(baseEstimadaUSD.toFixed(2)),
        totalBs: Number((baseEstimadaUSD * tasa).toFixed(2))
      };
    }

    const comunes = listaGastos.filter(g => g.categoria === 'GASTO_COMUN');
    const totalComunes = comunes.reduce((acc, curr) => acc + Number(curr.monto_usd || 0), 0);

    const ingresos = listaGastos.filter(g => g.categoria === 'INGRESO_EXTRA');
    const totalIngresos = ingresos.reduce((acc, curr) => acc + Number(curr.monto_usd || 0), 0);

    const noComunes = listaGastos.filter(g => g.categoria === 'GASTO_NO_COMUN' && g.codigo !== 'GNC04' && g.codigo !== 'GNC05');
    const noComunesUnidad = noComunes.reduce((acc, curr) => {
      const cant = Number(curr.unidades_reparto || 35);
      return acc + (Number(curr.monto_usd || 0) / cant);
    }, 0);

    const subtotalComunBase = totalComunes - totalIngresos;
    const cuotaComunUnidad = (subtotalComunBase * alicuota) / 100;
    
    const fondoReservaBase = Math.max(0, totalComunes - totalIngresos) * 0.10;
    const fondoReservaUnidad = (fondoReservaBase * alicuota) / 100;

    const itemGas = listaGastos.find(g => g.codigo === 'GNC05' || g.descripcion?.toLowerCase().includes('gas'));
    const itemRecibo = listaGastos.find(g => g.codigo === 'GNC04' || g.descripcion?.toLowerCase().includes('impresión'));

    const cuotaGas = (unidad.apaga_gas && itemGas) ? (Number(itemGas.monto_usd || 0) / Number(itemGas.unidades_reparto || 22)) : 0;
    const cuotaRecibo = (unidad.apaga_recibo && itemRecibo) ? (Number(itemRecibo.monto_usd || 0) / Number(itemRecibo.unidades_reparto || 2)) : 0;

    const totalUsd = Math.max(0, cuotaComunUnidad + noComunesUnidad + fondoReservaUnidad + cuotaGas + cuotaRecibo);
    const totalBs = totalUsd * tasa;

    return {
      totalUsd: Number(totalUsd.toFixed(2)),
      totalBs: Number(totalBs.toFixed(2))
    };
  };

  async function handleGenerarCobranzasMes() {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const registrosAInsertar = [];

      unidades.forEach(u => {
        const codUnidad = u.codigo_unidad || u.numero_inmueble || u.unidad || `ID-${u.id}`;
        const existe = historicoCobranzas.some(c => 
          String(c.id_inmueble).toUpperCase().trim() === String(codUnidad).toUpperCase().trim() &&
          c.periodo === periodo
        );

        if (!existe) {
          const calc = calcularReciboUnidad(u, periodo, tasaBcv);
          registrosAInsertar.push({
            id_inmueble: codUnidad,
            periodo: periodo,
            monto_usd: calc.totalUsd,
            monto_bs: calc.totalBs,
            tasa_cambio: tasaBcv,
            metodo_pago: 'sin_reportar',
            referencia: 'S/R',
            comprobante_url: '',
            estado: 'pendiente',
            fecha_pago: `${periodo}-01`,
            observaciones: `Recibo de condominio generado para el período ${periodo}`
          });
        }
      });

      if (registrosAInsertar.length === 0) {
        setSuccessMsg(`Los recibos del período ${periodo} ya fueron ingresados previamente.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        return;
      }

      const { data, error } = await supabase
        .from('cobranzas')
        .insert(registrosAInsertar)
        .select();

      if (error) {
        console.warn('Detalle al insertar en Supabase, anexando localmente:', error.message);
        const simulados = registrosAInsertar.map((r, i) => ({ ...r, id: `local-${periodo}-${i}` }));
        setHistoricoCobranzas(prev => [...prev, ...simulados]);
      } else if (data) {
        setHistoricoCobranzas(prev => [...prev, ...data]);
      }

      setSuccessMsg(`¡Se ingresaron los cobros de ${registrosAInsertar.length} inmuebles para ${periodo}!`);
      setTimeout(() => setSuccessMsg(null), 4000);

    } catch (err) {
      console.error('Error al generar cobranzas:', err.message);
      setErrorMsg('No se pudieron ingresar las cobranzas: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const unidadesConsolidadas = useMemo(() => {
    return unidades.map(u => {
      const codUnidad = u.codigo_unidad || u.numero_inmueble || u.unidad || `ID-${u.id}`;
      const propNombre = u.propietario_nombre || u.propietario || 'Propietario';

      const cobrosUnidad = historicoCobranzas.filter(c => 
        String(c.id_inmueble).toUpperCase().trim() === String(codUnidad).toUpperCase().trim()
      );

      const cobroMesActual = cobrosUnidad.find(c => c.periodo === periodo);
      const calcMesActual = calcularReciboUnidad(u, periodo, tasaBcv);

      const montoMesUSD = cobroMesActual ? Number(cobroMesActual.monto_usd) : calcMesActual.totalUsd;
      const montoMesBs = cobroMesActual ? Number(cobroMesActual.monto_bs) : calcMesActual.totalBs;
      const estadoMesActual = cobroMesActual ? cobroMesActual.estado : 'pendiente';

      const periodosImpagos = cobrosUnidad.filter(c => c.estado !== 'aprobado');
      
      let deudaAcumuladaUSD = periodosImpagos.reduce((acc, c) => acc + Number(c.monto_usd || 0), 0);
      let deudaAcumuladaBs = periodosImpagos.reduce((acc, c) => acc + Number(c.monto_bs || 0), 0);

      if (!cobroMesActual) {
        deudaAcumuladaUSD += calcMesActual.totalUsd;
        deudaAcumuladaBs += calcMesActual.totalBs;
      }

      const listaMesesImpagos = periodosImpagos.map(c => c.periodo);
      if (!cobroMesActual && !listaMesesImpagos.includes(periodo)) {
        listaMesesImpagos.push(periodo);
      }

      return {
        id_inmueble: codUnidad,
        propietario: propNombre,
        unidadObj: u,
        cobroMesActual: cobroMesActual || {
          id: `temp-${periodo}-${codUnidad}`,
          id_inmueble: codUnidad,
          periodo: periodo,
          monto_usd: calcMesActual.totalUsd,
          monto_bs: calcMesActual.totalBs,
          tasa_cambio: tasaBcv,
          metodo_pago: 'sin_reportar',
          referencia: 'S/R',
          estado: 'pendiente',
          esAuto: true
        },
        montoMesUSD,
        montoMesBs,
        estadoMesActual,
        deudaAcumuladaUSD: Number(deudaAcumuladaUSD.toFixed(2)),
        deudaAcumuladaBs: Number(deudaAcumuladaBs.toFixed(2)),
        mesesImpagosCount: listaMesesImpagos.length,
        listaMesesImpagos,
        esSolventeTotal: deudaAcumuladaUSD <= 0
      };
    });
  }, [unidades, historicoCobranzas, periodo, gastosPorPeriodo, tasaBcv]);

  const handleSeleccionarInmuebleModal = (codUnidad) => {
    const unidadConsolidada = unidadesConsolidadas.find(u => u.id_inmueble === codUnidad);
    if (!unidadConsolidada) return;

    const montoUSD = unidadConsolidada.deudaAcumuladaUSD > 0 
      ? unidadConsolidada.deudaAcumuladaUSD 
      : unidadConsolidada.montoMesUSD;

    const montoBs = (montoUSD * (nuevoPago.tasa_cambio || tasaBcv)).toFixed(2);

    setNuevoPago(prev => ({
      ...prev,
      id_inmueble: codUnidad,
      periodo_pago: unidadConsolidada.listaMesesImpagos.length > 0 ? unidadConsolidada.listaMesesImpagos[0] : periodo,
      monto_usd: montoUSD.toFixed(2),
      monto_bs: montoBs
    }));
  };

  const handleMontoUsdChange = (val) => {
    const usd = val;
    const rate = Number(nuevoPago.tasa_cambio || tasaBcv);
    const bs = usd !== '' && !isNaN(usd) ? (Number(usd) * rate).toFixed(2) : '';
    setNuevoPago(prev => ({ ...prev, monto_usd: usd, monto_bs: bs }));
  };

  const handleMontoBsChange = (val) => {
    const bs = val;
    const rate = Number(nuevoPago.tasa_cambio || tasaBcv);
    const usd = bs !== '' && !isNaN(bs) && rate > 0 ? (Number(bs) / rate).toFixed(2) : '';
    setNuevoPago(prev => ({ ...prev, monto_bs: bs, monto_usd: usd }));
  };

  async function handleRegistrarPago(e) {
    e.preventDefault();
    if (!nuevoPago.id_inmueble) {
      setErrorMsg('Por favor selecciona un inmueble.');
      return;
    }
    if (!nuevoPago.monto_usd || Number(nuevoPago.monto_usd) <= 0) {
      setErrorMsg('Por favor ingresa un monto válido.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const targetPeriodo = nuevoPago.periodo_pago === 'TODO' ? periodo : nuevoPago.periodo_pago;

      const existeAprobado = historicoCobranzas.some(c => 
        String(c.id_inmueble).toUpperCase().trim() === String(nuevoPago.id_inmueble).toUpperCase().trim() &&
        c.periodo === targetPeriodo &&
        c.estado === 'aprobado'
      );

      if (existeAprobado && nuevoPago.periodo_pago !== 'TODO') {
        setErrorMsg(`El pago para el período ${targetPeriodo} ya se encuentra APROBADO y es inmutable.`);
        setSubmitting(false);
        return;
      }

      const registro = {
        id_inmueble: nuevoPago.id_inmueble,
        periodo: targetPeriodo,
        monto_usd: Number(nuevoPago.monto_usd),
        monto_bs: Number(nuevoPago.monto_bs || 0),
        tasa_cambio: Number(nuevoPago.tasa_cambio || tasaBcv),
        metodo_pago: nuevoPago.metodo_pago,
        referencia: nuevoPago.referencia.trim() || 'PM-' + Math.floor(Math.random() * 900000 + 100000),
        comprobante_url: nuevoPago.comprobante_url.trim(),
        estado: 'pendiente',
        fecha_pago: nuevoPago.fecha_pago,
        observaciones: nuevoPago.observaciones.trim() || `Pago reportado para ${targetPeriodo}`
      };

      if (nuevoPago.periodo_pago === 'TODO') {
        const uConsolidada = unidadesConsolidadas.find(u => u.id_inmueble === nuevoPago.id_inmueble);
        if (uConsolidada && uConsolidada.listaMesesImpagos.length > 0) {
          const registrosMultiples = uConsolidada.listaMesesImpagos.map(p => {
            const calcP = calcularReciboUnidad(uConsolidada.unidadObj, p, tasaBcv);
            return {
              ...registro,
              periodo: p,
              monto_usd: calcP.totalUsd,
              monto_bs: calcP.totalBs,
              observaciones: `Abono de Deuda Acumulada para el período ${p}`
            };
          });

          await supabase.from('cobranzas').upsert(registrosMultiples, { onConflict: 'id_inmueble,periodo' });
          setHistoricoCobranzas(prev => [...prev.filter(c => c.id_inmueble !== nuevoPago.id_inmueble), ...registrosMultiples]);
        }
      } else {
        const { data, error } = await supabase
          .from('cobranzas')
          .upsert([registro], { onConflict: 'id_inmueble,periodo' })
          .select();

        if (error) {
          setHistoricoCobranzas(prev => [...prev.filter(c => !(c.id_inmueble === registro.id_inmueble && c.periodo === registro.periodo)), registro]);
        } else if (data) {
          setHistoricoCobranzas(prev => [...prev.filter(c => !(c.id_inmueble === registro.id_inmueble && c.periodo === registro.periodo)), data[0]]);
        }
      }

      setSuccessMsg(`¡Pago registrado con éxito para ${nuevoPago.id_inmueble}!`);
      setModalAbierto(false);
      resetFormulario();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error al registrar pago:', err.message);
      setErrorMsg('Error al registrar pago: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCambiarEstado(unidadCons, nuevoEstado) {
    try {
      setErrorMsg(null);
      const cobroTarget = unidadCons.cobroMesActual;

      if (cobroTarget.estado === 'aprobado' && nuevoEstado !== 'aprobado') {
        setErrorMsg('Los pagos APROBADOS son inmutables y no se pueden alterar.');
        return;
      }

      const registro = {
        id_inmueble: unidadCons.id_inmueble,
        periodo: periodo,
        monto_usd: unidadCons.montoMesUSD,
        monto_bs: unidadCons.montoMesBs,
        tasa_cambio: tasaBcv,
        metodo_pago: cobroTarget.metodo_pago !== 'sin_reportar' ? cobroTarget.metodo_pago : 'transferencia_bs',
        referencia: cobroTarget.referencia !== 'S/R' ? cobroTarget.referencia : 'APROB-ADMIN',
        comprobante_url: cobroTarget.comprobante_url || '',
        estado: nuevoEstado,
        fecha_pago: new Date().toISOString().split('T')[0],
        observaciones: `Estado actualizado a ${nuevoEstado} por la administración.`
      };

      const { data } = await supabase
        .from('cobranzas')
        .upsert([registro], { onConflict: 'id_inmueble,periodo' })
        .select();

      setHistoricoCobranzas(prev => [
        ...prev.filter(c => !(c.id_inmueble === unidadCons.id_inmueble && c.periodo === periodo)),
        (data && data[0]) ? data[0] : registro
      ]);

      setSuccessMsg(`Cobro de ${unidadCons.id_inmueble} (${periodo}) marcado como "${nuevoEstado.toUpperCase()}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error cambiando estado:', err.message);
      setErrorMsg('No se pudo cambiar el estado: ' + err.message);
    }
  }

  function resetFormulario() {
    const primera = unidadesConsolidadas.length > 0 ? unidadesConsolidadas[0] : null;
    const cod = primera ? primera.id_inmueble : '';
    const montoUSD = primera ? (primera.deudaAcumuladaUSD > 0 ? primera.deudaAcumuladaUSD : primera.montoMesUSD) : 45.00;

    setNuevoPago({
      id_inmueble: cod,
      periodo_pago: primera && primera.listaMesesImpagos.length > 0 ? primera.listaMesesImpagos[0] : periodo,
      monto_usd: montoUSD.toFixed(2),
      monto_bs: (montoUSD * tasaBcv).toFixed(2),
      tasa_cambio: tasaBcv,
      metodo_pago: 'pago_movil',
      referencia: '',
      comprobante_url: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      observaciones: ''
    });
  }

  const metricas = useMemo(() => {
    const totalInmuebles = unidadesConsolidadas.length;
    const morosidadTotalUSD = unidadesConsolidadas.reduce((acc, u) => acc + u.deudaAcumuladaUSD, 0);
    const morosidadTotalBs = unidadesConsolidadas.reduce((acc, u) => acc + u.deudaAcumuladaBs, 0);

    const solventesCount = unidadesConsolidadas.filter(u => u.esSolventeTotal).length;
    const morososCount = totalInmuebles - solventesCount;

    const facturadoMesUSD = unidadesConsolidadas.reduce((acc, u) => acc + u.montoMesUSD, 0);
    const cobradoMesUSD = unidadesConsolidadas
      .filter(u => u.estadoMesActual === 'aprobado')
      .reduce((acc, u) => acc + u.montoMesUSD, 0);

    const porcCobranzaMes = facturadoMesUSD > 0 ? ((cobradoMesUSD / facturadoMesUSD) * 100).toFixed(1) : 0;

    return {
      totalInmuebles,
      morosidadTotalUSD,
      morosidadTotalBs,
      solventesCount,
      morososCount,
      facturadoMesUSD,
      cobradoMesUSD,
      porcCobranzaMes
    };
  }, [unidadesConsolidadas]);

  const unidadesFiltradas = useMemo(() => {
    return unidadesConsolidadas.filter(u => {
      if (filtroEstado === 'pendiente' && u.estadoMesActual !== 'pendiente') return false;
      if (filtroEstado === 'aprobado' && u.estadoMesActual !== 'aprobado') return false;
      if (filtroEstado === 'rechazado' && u.estadoMesActual !== 'rechazado') return false;
      if (filtroEstado === 'morosos' && u.deudaAcumuladaUSD <= 0) return false;

      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase().trim();
        const inm = u.id_inmueble.toLowerCase();
        const prop = u.propietario.toLowerCase();
        return inm.includes(q) || prop.includes(q);
      }

      return true;
    });
  }, [unidadesConsolidadas, filtroEstado, busqueda]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-2 sm:px-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={36} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Acceso Restringido</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              <Lock size={14} />
              Exclusivo para Administradores
            </div>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            El <strong>Módulo de Cobranzas y Deudas</strong> está disponible únicamente para administradores del condominio.
          </p>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={toggleAdminRole}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              <span>Activar Modo Administrador (Prueba)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getMetodoLabel = (metodo) => {
    switch (metodo) {
      case 'pago_movil': return 'Pago Móvil';
      case 'transferencia_bs': return 'Transferencia Bs';
      case 'transferencia_usd': return 'Transferencia USD';
      case 'efectivo_usd': return 'Efectivo ($ USD)';
      case 'zelle': return 'Zelle ($)';
      case 'sin_reportar': return 'Sin Reportar';
      default: return metodo || 'S/R';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Alertas */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl shadow-sm">
          <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-500 hover:text-rose-700">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Encabezado Principal Responsivo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Módulo de Cobranzas</h1>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock size={12} />
              ADMIN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión de recibos y deudas acumuladas por inmueble
          </p>
        </div>

        {/* Acciones del Encabezado (Tasa BCV del Día, Período, Generar, Registrar) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
          
          {/* Insignia Tasa BCV Oficial en vivo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>BCV del Día: <strong className="text-emerald-950 font-black text-sm">{tasaBcv.toFixed(2)} Bs/$</strong></span>
            </div>
            <button
              onClick={obtenerTasaBcvDelDia}
              className="p-1 hover:bg-emerald-100 rounded cursor-pointer transition-colors text-emerald-700 ml-1"
              title="Sincronizar tasa oficial en vivo desde bcv.org.ve"
            >
              <RefreshCw size={14} className={obteniendoTasa ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Selector de Período Mensual */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto justify-center">
            <Calendar size={16} className="text-indigo-600 ml-1" />
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
              <option value="2026-05">Mayo 2026</option>
              <option value="2026-08">Agosto 2026</option>
            </select>
          </div>

          {/* Botón: Generar Cobros del Mes */}
          <button
            onClick={handleGenerarCobranzasMes}
            disabled={submitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Layers size={16} />
            <span>Ingresar Cobros</span>
          </button>

          {/* CTA Registrar Pago */}
          <button
            onClick={() => {
              resetFormulario();
              setModalAbierto(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Abonar Pago</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Responsivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Deuda Total Acumulada */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deuda Total Acumulada</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            ${metricas.morosidadTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Bs. {metricas.morosidadTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="w-full bg-rose-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full w-full"></div>
          </div>
        </div>

        {/* Facturado Mes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturado en {periodo}</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calculator size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            ${metricas.facturadoMesUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Cobrado: ${metricas.cobradoMesUSD.toFixed(2)} ({metricas.porcCobranzaMes}%)
          </div>
          <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${metricas.porcCobranzaMes}%` }}></div>
          </div>
        </div>

        {/* Inmuebles Solventes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inmuebles Al Día</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {metricas.solventesCount} <span className="text-xs font-normal text-slate-500">inmuebles</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Sin saldos pend. adeudados
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${metricas.totalInmuebles > 0 ? (metricas.solventesCount / metricas.totalInmuebles) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Inmuebles Morosos */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inmuebles Morosos</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <History size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {metricas.morososCount} <span className="text-xs font-normal text-slate-500">inmuebles</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Con 1 o más meses impagos
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${metricas.totalInmuebles > 0 ? (metricas.morososCount / metricas.totalInmuebles) * 100 : 0}%` }}></div>
          </div>
        </div>

      </div>

      {/* Control: Filtros y Búsqueda */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Pestañas de Estado con Scroll Horizontal en Móvil */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos', count: metricas.totalInmuebles },
            { id: 'morosos', label: 'Con Deuda', count: metricas.morososCount },
            { id: 'pendiente', label: 'Pendiente Mes', count: unidadesConsolidadas.filter(u => u.estadoMesActual === 'pendiente').length },
            { id: 'aprobado', label: 'Solvente Mes', count: unidadesConsolidadas.filter(u => u.estadoMesActual === 'aprobado').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroEstado === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                filtroEstado === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Input Búsqueda */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar inmueble o propietario..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

      </div>

      {/* --- VISTA DE TABLA Y CARDS RESPONSIVAS --- */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <p className="text-xs sm:text-sm font-medium">Consolidando deuda e información del mes...</p>
          </div>
        ) : unidadesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-100 rounded-full text-slate-400">
              <Receipt size={32} />
            </div>
            <p className="text-base font-bold text-slate-700">Sin registros para este filtro</p>
          </div>
        ) : (
          <div>
            {/* 1. Vista de Escritorio / Tablet (Tabla Tradicional >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Inmueble / Propietario</th>
                    <th className="py-3.5 px-4">Recibo {periodo}</th>
                    <th className="py-3.5 px-4 bg-amber-50/50 text-amber-900 border-x border-amber-100">
                      Deuda Total Acumulada
                    </th>
                    <th className="py-3.5 px-4">Método & Ref ({periodo})</th>
                    <th className="py-3.5 px-4 text-center">Estado ({periodo})</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {unidadesFiltradas.map((item) => (
                    <tr key={item.id_inmueble} className="hover:bg-slate-50/80 transition-colors">
                      
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 size={15} className="text-indigo-600" />
                          <span>{item.id_inmueble}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User size={12} />
                          <span>{item.propietario}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-800 text-sm">
                          ${item.montoMesUSD.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bs. {item.montoMesBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap bg-amber-50/30 border-x border-amber-100">
                        {item.deudaAcumuladaUSD > 0 ? (
                          <div>
                            <span className="font-black text-rose-600 text-sm block">
                              ${item.deudaAcumuladaUSD.toFixed(2)} USD
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                              <Clock size={10} />
                              Debe {item.mesesImpagosCount} {item.mesesImpagosCount === 1 ? 'mes' : 'meses'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-1">
                              <CheckCheck size={14} className="text-emerald-600" />
                              $0.00 (Solvente)
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700">
                          {getMetodoLabel(item.cobroMesActual.metodo_pago)}
                        </div>
                        {item.cobroMesActual.referencia && item.cobroMesActual.referencia !== 'S/R' && (
                          <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                            Ref: {item.cobroMesActual.referencia}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {item.estadoMesActual === 'aprobado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Lock size={12} className="text-emerald-600" />
                            Solvente
                          </span>
                        ) : item.estadoMesActual === 'rechazado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle size={14} className="text-rose-600" />
                            Rechazado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock size={14} className="text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.cobroMesActual.comprobante_url && (
                            <button onClick={() => setComprobanteModalUrl(item.cobroMesActual.comprobante_url)} className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCambiarEstado(item, 'aprobado')}
                            disabled={item.estadoMesActual === 'aprobado'}
                            className={`p-1.5 rounded-lg ${item.estadoMesActual === 'aprobado' ? 'bg-emerald-100 text-emerald-400 opacity-50 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(item, 'rechazado')}
                            disabled={item.estadoMesActual === 'aprobado'}
                            className={`p-1.5 rounded-lg ${item.estadoMesActual === 'aprobado' ? 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Vista de Tarjetas Móviles Táctiles (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {unidadesFiltradas.map((item) => (
                <div key={item.id_inmueble} className="p-4 space-y-3 bg-white">
                  
                  {/* Encabezado Card: Inmueble & Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{item.id_inmueble}</h4>
                        <p className="text-xs text-slate-500 font-medium">{item.propietario}</p>
                      </div>
                    </div>

                    {item.estadoMesActual === 'aprobado' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Lock size={10} /> Solvente
                      </span>
                    ) : item.estadoMesActual === 'rechazado' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <XCircle size={10} /> Rechazado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock size={10} /> Pendiente
                      </span>
                    )}
                  </div>

                  {/* Fila de Valores: Recibo Mes vs Deuda Acumulada */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Recibo {periodo}</span>
                      <span className="font-extrabold text-slate-800 text-sm block">${item.montoMesUSD.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500">Bs. {item.montoMesBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="border-l border-slate-200 pl-2">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Deuda Total</span>
                      {item.deudaAcumuladaUSD > 0 ? (
                        <div>
                          <span className="font-black text-rose-600 text-sm block">${item.deudaAcumuladaUSD.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded inline-block">
                            Debe {item.mesesImpagosCount} mes(es)
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-700 text-xs block mt-1">Al día ($0.00)</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones Móviles con botones táctiles grandes */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{getMetodoLabel(item.cobroMesActual.metodo_pago)}</span>
                      {item.cobroMesActual.referencia && item.cobroMesActual.referencia !== 'S/R' && (
                        <span className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">Ref: {item.cobroMesActual.referencia}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.cobroMesActual.comprobante_url && (
                        <button
                          onClick={() => setComprobanteModalUrl(item.cobroMesActual.comprobante_url)}
                          className="p-2 bg-slate-100 text-slate-700 rounded-xl"
                          title="Ver Comprobante"
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => handleCambiarEstado(item, 'aprobado')}
                        disabled={item.estadoMesActual === 'aprobado'}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 ${
                          item.estadoMesActual === 'aprobado'
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-emerald-600 text-white shadow-sm active:scale-95'
                        }`}
                      >
                        <Check size={14} />
                        <span>Aprobar</span>
                      </button>

                      <button
                        onClick={() => handleCambiarEstado(item, 'rechazado')}
                        disabled={item.estadoMesActual === 'aprobado'}
                        className={`p-2 rounded-xl ${
                          item.estadoMesActual === 'aprobado'
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Responsivo: Registrar / Abonar Pago */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Registrar / Abonar Pago</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Abonar saldo a la deuda acumulada o al recibo del mes</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-3.5 sm:space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Inmueble <span className="text-rose-500">*</span>
                </label>
                <select
                  value={nuevoPago.id_inmueble}
                  onChange={e => handleSeleccionarInmuebleModal(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Selecciona un Inmueble --</option>
                  {unidadesConsolidadas.map(u => (
                    <option key={u.id_inmueble} value={u.id_inmueble}>
                      {u.id_inmueble} - {u.propietario} {u.deudaAcumuladaUSD > 0 ? `(Adeuda: $${u.deudaAcumuladaUSD.toFixed(2)})` : '(Solvente)'}
                    </option>
                  ))}
                </select>
              </div>

              {nuevoPago.id_inmueble && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <Clock size={14} className="text-amber-700" />
                      Deuda Acumulada:
                    </span>
                    <span className="font-black text-rose-700 text-sm">
                      ${(unidadesConsolidadas.find(u => u.id_inmueble === nuevoPago.id_inmueble)?.deudaAcumuladaUSD || 0).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="pt-1 border-t border-amber-200/60">
                    <select
                      value={nuevoPago.periodo_pago}
                      onChange={e => {
                        const val = e.target.value;
                        const uCons = unidadesConsolidadas.find(u => u.id_inmueble === nuevoPago.id_inmueble);
                        let montoUSD = uCons ? uCons.montoMesUSD : 45.00;
                        if (val === 'TODO' && uCons) montoUSD = uCons.deudaAcumuladaUSD;
                        setNuevoPago(prev => ({
                          ...prev,
                          periodo_pago: val,
                          monto_usd: montoUSD.toFixed(2),
                          monto_bs: (montoUSD * (prev.tasa_cambio || tasaBcv)).toFixed(2)
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:outline-none"
                    >
                      <option value="TODO">Pagar Toda la Deuda Acumulada</option>
                      <option value={periodo}>Solamente el Recibo de {periodo}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tasa BCV Oficial en vivo desde bcv.org.ve */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-extrabold">
                    <ArrowRightLeft size={16} className="text-indigo-600" />
                    <span>Tasa BCV del Día</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      bcv.org.ve
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-700 mt-0.5">({fechaTasaBcv})</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPago.tasa_cambio}
                    onChange={e => {
                      const rate = Number(e.target.value);
                      setNuevoPago(prev => ({
                        ...prev,
                        tasa_cambio: rate,
                        monto_bs: prev.monto_usd ? (Number(prev.monto_usd) * rate).toFixed(2) : prev.monto_bs
                      }));
                    }}
                    className="w-24 px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-center text-indigo-950"
                  />
                  <span className="text-xs font-bold text-indigo-900">Bs/$</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const nuevaTasa = await obtenerTasaBcvDelDia();
                      if (nuevaTasa) {
                        setNuevoPago(prev => ({
                          ...prev,
                          tasa_cambio: nuevaTasa,
                          monto_bs: prev.monto_usd ? (Number(prev.monto_usd) * nuevaTasa).toFixed(2) : prev.monto_bs
                        }));
                      }
                    }}
                    className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer"
                  >
                    <RefreshCw size={14} className={obteniendoTasa ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Montos USD y Bs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPago.monto_usd}
                    onChange={e => handleMontoUsdChange(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPago.monto_bs}
                    onChange={e => handleMontoBsChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Método y Referencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pago *</label>
                  <select
                    value={nuevoPago.metodo_pago}
                    onChange={e => setNuevoPago({ ...nuevoPago, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="pago_movil">Pago Móvil (Bs)</option>
                    <option value="transferencia_bs">Transferencia Bancaria (Bs)</option>
                    <option value="transferencia_usd">Transferencia USD ($)</option>
                    <option value="zelle">Zelle ($ USD)</option>
                    <option value="efectivo_usd">Efectivo ($ USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº Referencia</label>
                  <input
                    type="text"
                    value={nuevoPago.referencia}
                    onChange={e => setNuevoPago({ ...nuevoPago, referencia: e.target.value })}
                    placeholder="Ej. 982341"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Fecha y Comprobante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Pago *</label>
                  <input
                    type="date"
                    value={nuevoPago.fecha_pago}
                    onChange={e => setNuevoPago({ ...nuevoPago, fecha_pago: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Comprobante</label>
                  <input
                    type="url"
                    value={nuevoPago.comprobante_url}
                    onChange={e => setNuevoPago({ ...nuevoPago, comprobante_url: e.target.value })}
                    placeholder="Enlace a capture de foto"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{submitting ? 'Procesando...' : 'Confirmar y Abonar'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Visor Comprobante */}
      {comprobanteModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Comprobante Adjunto
              </h3>
              <button onClick={() => setComprobanteModalUrl(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-100 rounded-2xl overflow-hidden min-h-48 flex items-center justify-center border border-slate-200">
              {comprobanteModalUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || comprobanteModalUrl.includes('unsplash') ? (
                <img src={comprobanteModalUrl} alt="Comprobante" className="max-h-80 w-auto object-contain mx-auto" />
              ) : (
                <div className="p-6 text-center space-y-3">
                  <p className="text-xs text-slate-600 font-medium">El comprobante es un enlace externo:</p>
                  <a href={comprobanteModalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                    <span>Abrir enlace</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            <div className="text-right">
              <button onClick={() => setComprobanteModalUrl(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
