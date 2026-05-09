import { create } from 'zustand';
import { Alert, AlertType, MapStyle, Route, TravelMode, User as UserType, LeaderboardEntry, KPIData } from '@/types';
import { MOCK_ALERTS } from '@/data/mockData';
import api from '@/lib/api';
import socket from '@/lib/socket';

interface MapStore {
  center: [number, number];
  zoom: number;
  style: MapStyle;
  activeRoute: Route | null;
  alternativeRoutes: Route[];
  travelMode: TravelMode;
  activeLayers: string[];
  userLocation: [number, number] | null;
  mapType: 'street' | 'satellite';
  isNavigating: boolean;
  currentStepIndex: number;
  currentCity: string | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: MapStyle) => void;
  setActiveRoute: (route: Route | null) => void;
  setAlternativeRoutes: (routes: Route[]) => void;
  setTravelMode: (mode: TravelMode) => void;
  toggleLayer: (layer: string) => void;
  setUserLocation: (loc: [number, number] | null) => void;
  setMapType: (type: 'street' | 'satellite') => void;
  setIsNavigating: (navigating: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  setCurrentCity: (city: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: [77.2090, 28.6139], // Delhi
  zoom: 11,
  style: 'dark',
  activeRoute: null,
  alternativeRoutes: [],
  travelMode: 'car',
  activeLayers: ['traffic', 'alerts'],
  userLocation: null,
  mapType: 'street',
  isNavigating: false,
  currentStepIndex: 0,
  currentCity: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setStyle: (style) => set({ style }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),
  setTravelMode: (mode) => set({ travelMode: mode }),
  toggleLayer: (layer) =>
    set((s) => ({
      activeLayers: s.activeLayers.includes(layer)
        ? s.activeLayers.filter((l) => l !== layer)
        : [...s.activeLayers, layer],
    })),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setMapType: (type) => set({ mapType: type }),
  setIsNavigating: (isNavigating) => set({ isNavigating }),
  setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),
  setCurrentCity: (currentCity) => set({ currentCity }),
}));

interface AlertStore {
  alerts: Alert[];
  routeAlerts: Alert[];
  approachingAlert: Alert | null;
  alertFilters: AlertType[];
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setFilters: (filters: AlertType[]) => void;
  toggleFilter: (filter: AlertType) => void;
  setApproachingAlert: (alert: Alert | null) => void;
  setRouteAlerts: (alerts: Alert[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  fetchInitialData: () => Promise<void>;
  initializeSocketListeners: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: MOCK_ALERTS,
  routeAlerts: [],
  approachingAlert: null,
  alertFilters: [],
  unreadCount: 0,
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts], unreadCount: s.unreadCount + 1 })),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  setFilters: (filters) => set({ alertFilters: filters }),
  toggleFilter: (filter) =>
    set((s) => ({
      alertFilters: s.alertFilters.includes(filter)
        ? s.alertFilters.filter((f) => f !== filter)
        : [...s.alertFilters, filter],
    })),
  setApproachingAlert: (alert) => set({ approachingAlert: alert }),
  setRouteAlerts: (alerts) => set({ routeAlerts: alerts }),
  setAlerts: (newAlerts) => set((s) => ({ alerts: [...newAlerts, ...s.alerts] })),

  fetchInitialData: async () => {
    try {
      const response = await api.get('/alerts');
      set((s) => ({ 
        alerts: [...response.data, ...s.alerts], 
        unreadCount: response.data.length + s.unreadCount 
      }));
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    }
  },

  initializeSocketListeners: () => {
    socket.on('new_alert', (newAlert: Alert) => {
      get().addAlert(newAlert);
    });

    socket.on('alert_updated', (updatedAlert: Alert) => {
      set((s) => ({
        alerts: s.alerts.map(a => a.id === updatedAlert.id ? updatedAlert : a)
      }));
    });

    socket.on('alert_deleted', (deletedId: string) => {
      get().dismissAlert(deletedId);
    });
  }
}));

interface UserStore {
  user: UserType | null;
  isAuthenticated: boolean;
  leaderboard: LeaderboardEntry[];
  login: (email: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  sendOTP: (data: { phone?: string; email?: string }) => Promise<void>;
  verifyOTP: (data: { phone?: string; email?: string; otp: string }) => Promise<void>;
  logout: () => void;
  fetchLeaderboard: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: JSON.parse(localStorage.getItem('reas-user') || 'null'),
  isAuthenticated: !!localStorage.getItem('reas-token'),
  leaderboard: [],
  login: async (email: string) => {
    try {
      const response = await api.post('/users/login', { email });
      const { user, token } = response.data;
      localStorage.setItem('reas-user', JSON.stringify(user));
      localStorage.setItem('reas-token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },
  loginWithGoogle: async (credential: string) => {
    try {
      const response = await api.post('/users/google-auth', { credential });
      const { user, token } = response.data;
      localStorage.setItem('reas-user', JSON.stringify(user));
      localStorage.setItem('reas-token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Google Login failed', error);
      throw error;
    }
  },
  sendOTP: async (data: { phone?: string; email?: string }) => {
    try {
      await api.post('/users/send-otp', data);
    } catch (error) {
      console.error('Failed to send OTP', error);
      throw error;
    }
  },
  verifyOTP: async (data: { phone?: string; email?: string; otp: string }) => {
    try {
      const response = await api.post('/users/verify-otp', data);
      const { user, token } = response.data;
      localStorage.setItem('reas-user', JSON.stringify(user));
      localStorage.setItem('reas-token', token);
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('OTP verification failed', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('reas-user');
    localStorage.removeItem('reas-token');
    set({ user: null, isAuthenticated: false });
  },
  fetchLeaderboard: async () => {
    try {
      const response = await api.get('/users/leaderboard');
      set({ leaderboard: response.data });
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    }
  },
}));

interface StatsStore {
  stats: KPIData | null;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: null,
  fetchStats: async () => {
    try {
      const response = await api.get('/stats');
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  }
}));
