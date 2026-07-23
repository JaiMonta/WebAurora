import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Newspaper, 
  Receipt, 
  DollarSign, 
  Home, 
  LogOut, 
  User 
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'noticias', name: 'Noticias', icon: Newspaper },
    { id: 'recibos', name: 'Mis Recibos', icon: Receipt },
    { id: 'gastos', name: 'Gastos e Ingresos', icon: DollarSign },
    { id: 'alicuotas', name: 'Inmuebles', icon: Home },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Sidebar con Fondo Gris Oscuro / Slate */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shadow-xl border-r border-slate-800">
        
        {/* Parte Superior: Marca y Menú */}
        <div>
          {/* Logo / Encabezado */}
          <div className="px-3 py-4 border-b border-slate-800/80 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/20">
              RA
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-wide">Residencias Aurora</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gestión de Condominio</p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Parte Inferior: Perfil del Usuario y Cierre de Sesión */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {/* Tarjeta de Datos del Usuario */}
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-[10px] text-slate-400 truncate" title={user?.email}>
                {user?.email || 'usuario@condominio.com'}
              </p>
            </div>
          </div>

          {/* Botón de Salir / Logout */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>

      {/* Área del Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        {children}
      </main>

    </div>
  );
}