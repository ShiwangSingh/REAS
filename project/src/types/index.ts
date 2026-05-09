export type AlertSeverity = 'critical' | 'high' | 'medium' | 'info';

export type AlertType =
  | 'cctv'
  | 'speed_breaker'
  | 'construction'
  | 'accident'
  | 'pothole'
  | 'waterlogging'
  | 'fog'
  | 'toll'
  | 'fuel'
  | 'police'
  | 'other';

export type TravelMode = 'car' | 'bike' | 'walk' | 'auto';
export type MapStyle = 'dark' | 'light' | 'satellite' | 'terrain';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    road: string;
    city: string;
  };
  reportedAt: string;
  reportedBy?: string;
  upvotes: number;
  verified: boolean;
  photoUrls?: string[];
  distance?: number;
}

export interface Route {
  id: string;
  name: string;
  distance: number;
  duration: number;
  alertCount: number;
  coordinates: [number, number][];
  steps?: {
    instruction: string;
    distance: number;
    duration: number;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  vehicleType: TravelMode;
  karmaPoints: number;
  reportsCount: number;
}

export interface UserPreferences {
  alertTypes: Record<AlertType, boolean>;
  warningDistance: number;
  voiceAlerts: boolean;
  voiceLanguage: string;
  vibrationAlerts: boolean;
  defaultTravelMode: TravelMode;
  avoidTolls: boolean;
  avoidHighways: boolean;
  routePreference: 'fastest' | 'shortest' | 'least_alerts';
  mapStyle: MapStyle;
  units: 'km' | 'miles';
  language: string;
  highContrast: boolean;
  textSize: 'small' | 'medium' | 'large';
}

export interface KPIData {
  activeAlerts: number;
  reportsSubmitted: number;
  verifiedPercent: number;
  roadsCovered: number;
  trends: {
    activeAlerts: number;
    reportsSubmitted: number;
    verifiedPercent: number;
    roadsCovered: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  reportsCount: number;
  karmaScore: number;
  verified: boolean;
}
