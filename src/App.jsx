import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alicuotas from './pages/Alicuotas';
import Gastos from './pages/Gastos';
import Recibos from './pages/Recibos'; // <--- 1. Importación agregada

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      
      {/* 2. Módulo de Recibos Integrado */}
      {currentTab === 'recibos' && <Recibos />}
      
      {/* 3. Módulo de Gastos e Ingresos Integrado */}
      {currentTab === 'gastos' && <Gastos />}

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