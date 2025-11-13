export type SensorType = 'temperature' | 'humidity' | 'pressure' | 'soil_moisture' | 'inclinometer';

export interface SensorData {
  id: string;
  type: SensorType;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  lastReading: {
    value: number;
    unit: string;
    timestamp: Date;
  };
  status: 'active' | 'inactive' | 'warning' | 'critical';
  batteryLevel: number;
  signalStrength: number;
}

export interface Alert {
  id: string;
  sensorId: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'resolved';
}

export interface SoilMoistureSensor extends SensorStatus {
  type: 'soil_moisture';
  lastReading: {
    value: number;
    unit: '%';
    timestamp: string;
  };
  thresholds: {
    dry: number;
    normal: number;
    saturated: number;
  };
}

export interface InclinometerSensor extends SensorStatus {
  type: 'inclinometer';
  lastReading: {
    value: number;
    unit: 'degrees';
    timestamp: string;
  };
  thresholds: {
    stable: number;
    warning: number;
    critical: number;
  };
}

export interface LandslideRiskAssessment {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  soilMoisture: number;
  inclination: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  timestamp: string;
  predictions: {
    next24h: 'low' | 'medium' | 'high' | 'critical';
    next48h: 'low' | 'medium' | 'high' | 'critical';
    next72h: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
} 