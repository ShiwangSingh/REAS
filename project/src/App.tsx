import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import NavigatePage from "./pages/NavigatePage";
import AlertsPage from "./pages/AlertsPage";
import LiveAlertsPage from "./pages/LiveAlertsPage";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import RoadAnalysisPage from "./pages/RoadAnalysisPage";
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/auth/AuthGuard";
import { useEffect } from "react";
import { socket } from "./lib/socket";
import { api } from "./lib/api";
import { useAlertStore, useUserStore, useStatsStore } from "./stores";

const queryClient = new QueryClient();

const App = () => {
  const { fetchInitialData, initializeSocketListeners } = useAlertStore();
  const { fetchLeaderboard } = useUserStore();
  const { fetchStats } = useStatsStore();

  useEffect(() => {
    // Check API Health on load
    api.get('/health')
      .then((res) => console.log('Backend connected:', res.data))
      .catch((err) => console.error('Backend connection failed:', err));

    // Fetch Initial Data
    fetchInitialData();
    fetchLeaderboard();
    fetchStats();
    initializeSocketListeners();

    // Listen to global socket connections
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_alert');
      socket.off('alert_updated');
      socket.off('alert_deleted');
    };
  }, [fetchInitialData, initializeSocketListeners]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthGuard><LandingPage /></AuthGuard>} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/navigate" element={<NavigatePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/alerts/live" element={<LiveAlertsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/road-analysis" element={<RoadAnalysisPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
            <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
            <Route path="/report" element={<AuthGuard><ReportPage /></AuthGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
