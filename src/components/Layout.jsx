import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Newspaper, 
  Receipt, 
  CreditCard,
  DollarSign, 
  Home, 
  LogOut, 
  User,
  Shield,
  Lock,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { user, signOut, isAdmin, toggleAdminRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'noticias', name: 'Noticias', icon: Newspaper },
    { id: 'recibos', name: 'Mis Recibos', icon: Receipt },
    { id: 'cobranzas', name: 'Cobranzas', icon: CreditCard, adminOnly: true },
    { id: 'gastos', name: 'Gastos e Ingresos', icon: DollarSign },
    { id: 'alicuotas', name: 'Inmuebles', icon: Home },
  ];

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const currentTabName = navItems.find(i => i.id === currentTab)?.name || 'Residencias Aurora';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* Navbar Superior Móvil (Visible solo en pantallas pequeñas < md) */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-500/20">
            RA
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-white tracking-wide">Residencias Aurora</h1>
            <p className="text-[10px] text-slate-400 font-medium capitalize">{currentTabName}</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Overlay Móvil (Fondo oscuro difuminado al abrir menú) */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar (Escritorio fijo / Drawer Móvil desplegable) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shadow-2xl md:shadow-xl border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Parte Superior: Marca y Menú */}
        <div>
          {/* Logo / Encabezado (Oculto en móvil header ya que tiene su propio topbar) */}
          <div className="px-3 py-4 border-b border-slate-800/80 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/20">
                RA
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide">Residencias Aurora</h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gestión de Condominio</p>
              </div>
            </div>

            {/* Cerrar menú en móvil */}
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 md:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                  
                  {item.adminOnly && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      <Lock size={10} />
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Parte Inferior: Perfil del Usuario, Rol y Cierre de Sesión */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          
          {/* Selector/Insignia de Rol */}
          <div className="px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className={isAdmin ? 'text-amber-400' : 'text-slate-400'} />
              <span className="text-slate-300 font-semibold">
                Rol: <strong className={isAdmin ? 'text-amber-300' : 'text-slate-400'}>{isAdmin ? 'Administrador' : 'Residente'}</strong>
              </span>
            </div>
            
            <button
              onClick={toggleAdminRole}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              {isAdmin ? 'Ver como Residente' : 'Ver como Admin'}
            </button>
          </div>

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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>

      {/* Área del Contenido Principal (con padding adaptativo a móviles) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
        {children}
      </main>

    </div>
  );
}