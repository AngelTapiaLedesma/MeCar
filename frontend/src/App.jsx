import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientsProvider } from "./context/ClientsContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Vehicles from "./pages/Vehicles";
import History from "./pages/History";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <ClientsProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </ClientsProvider>
    </BrowserRouter>
  );
}

export default App;