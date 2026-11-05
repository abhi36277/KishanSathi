import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileTabBar from './components/MobileTabBar';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import ActionPlanPage from './pages/ActionPlanPage';
import DiseaseIdentificationPage from './pages/DiseaseIdentificationPage';
import MarketPricesPage from './pages/MarketPricesPage';
import CropLifecyclePage from './pages/CropLifecyclePage';
import PestRadarPage from './pages/PestRadarPage';
import WeatherPage from './pages/WeatherPage';
import AiAssistantPage from './pages/AiAssistantPage';
import CropManagementPage from './pages/CropManagementPage';
import CropComparisonPage from './pages/CropComparisonPage';
import ExpenseLedgerPage from './pages/ExpenseLedgerPage';
import FieldMonitorPage from './pages/FieldMonitorPage';
import SchemesPage from './pages/SchemesPage';
import TransportPoolPage from './pages/TransportPoolPage';
import CommunityPage from './pages/CommunityPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/action-plan" element={<ActionPlanPage />} />
              <Route path="/disease-identification" element={<DiseaseIdentificationPage />} />
              <Route path="/market-prices" element={<MarketPricesPage />} />
              <Route path="/crop-lifecycle" element={<CropLifecyclePage />} />
              <Route path="/pest-radar" element={<PestRadarPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/ai-chat" element={<AiAssistantPage />} />
              <Route path="/crops" element={<CropManagementPage />} />
              <Route path="/crop-decider" element={<CropComparisonPage />} />
              <Route path="/expenses" element={<ExpenseLedgerPage />} />
              <Route path="/field-monitor" element={<FieldMonitorPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/transport" element={<TransportPoolPage />} />
              <Route path="/community" element={<CommunityPage />} />
            </Routes>
          </main>
          <MobileTabBar />
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
