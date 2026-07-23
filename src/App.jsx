import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Noticias from './pages/Noticias'; // <--- Importamos Noticias
import Recibos from './pages/Recibos';
import Gastos from './pages/Gastos';
import Alicuotas from './pages/Alicuotas';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      
      {/* Módulo de Noticias */}
      {currentTab === 'noticias' && <Noticias />}

      {/* Módulo de Recibos */}
      {currentTab === 'recibos' && <Recibos />}
      
      {/* Módulo de Gastos e Ingresos */}
      {currentTab === 'gastos' && <Gastos />}

      {/* Módulo de Inmuebles / Alícuotas */}
      {currentTab === 'alicuotas' && <Alicuotas />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}