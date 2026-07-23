import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard & Financiero', icon: LayoutDashboard },
    { id: 'recibos', label: 'Mis Recibos / Estado', icon: Receipt },
    { id: 'gastos', label: 'Gastos e Ingresos', icon: TrendingUp },
    { id: 'alicuotas', label: 'Inmuebles y Alícuotas', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Botón menú móvil */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-400">
          <Building2 size={24} />
          <span>ResidAurora</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Lateral */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-5 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Logo y Encabezado */}
          <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Residenias Aurora</h1>
              <p className="text-xs text-slate-400">Portal del Condominio</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Usuario y Logout */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <UserCheck size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Propietario / Admin</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}