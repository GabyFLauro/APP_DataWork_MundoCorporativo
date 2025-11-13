import React, { createContext, useContext, useState, useEffect } from 'react';
import { SensorData, Alert, RiskAssessment } from '../types/sensors';

interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

interface SensorContextData {
  sensors: SensorData[];
  alerts: Alert[];
  riskAssessments: RiskAssessment[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SensorContext = createContext<SensorContextData>({} as SensorContextData);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls here
      // For now, using mock data
      const mockSensors: SensorData[] = [
        {
          id: '1',
          type: 'pluviometer',
          name: 'Pluviômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 25,
            unit: 'mm/h',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 85,
          signalStrength: 90,
        },
        {
          id: '2',
          type: 'river_level',
          name: 'Régua Eletrônica 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 2.5,
            unit: 'm',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 75,
          signalStrength: 85,
        },
        {
          id: '3',
          type: 'anemometer',
          name: 'Anemômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 15,
            unit: 'km/h',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 90,
          signalStrength: 95,
        },
        {
          id: '4',
          type: 'hygrometer',
          name: 'Higrômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 65,
            unit: '%',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 80,
          signalStrength: 88,
        },
        {
          id: '5',
          type: 'barometer',
          name: 'Barômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 1013,
            unit: 'hPa',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 95,
          signalStrength: 92,
        },
        {
          id: '6',
          type: 'temperature',
          name: 'Termômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 25.5,
            unit: '°C',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 88,
          signalStrength: 90,
        },
        {
          id: '7',
          type: 'inclinometer',
          name: 'Inclinômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 5.2,
            unit: '°',
            timestamp: new Date(),
          },
          status: 'warning',
          batteryLevel: 65,
          signalStrength: 75,
        },
        {
          id: '8',
          type: 'accelerometer',
          name: 'Acelerômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 0.15,
            unit: 'g',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 82,
          signalStrength: 85,
        },
        {
          id: '9',
          type: 'tensiometer',
          name: 'Tensiômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 35,
            unit: 'kPa',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 78,
          signalStrength: 82,
        },
        {
          id: '10',
          type: 'soil_moisture',
          name: 'Umidade Solo 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 45,
            unit: '%',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 85,
          signalStrength: 88,
        },
        {
          id: '11',
          type: 'smoke',
          name: 'Sensor Fumaça 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 0.02,
            unit: '% obs/m',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 92,
          signalStrength: 95,
        },
        {
          id: '12',
          type: 'solar_radiation',
          name: 'Piranômetro 1',
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          lastReading: {
            value: 850,
            unit: 'W/m²',
            timestamp: new Date(),
          },
          status: 'active',
          batteryLevel: 88,
          signalStrength: 90,
        }
      ];

      const mockAlerts: Alert[] = [
        {
          id: '1',
          sensorId: '2',
          type: 'warning',
          message: 'Inclinação do solo acima do normal',
          timestamp: new Date(),
          location: { latitude: -23.5505, longitude: -46.6333, name: 'Encosta Sul' },
          status: 'active',
        },
      ];

      const mockRiskAssessments: RiskAssessment[] = [
        // Baixo Risco
        {
          id: '1',
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            name: 'Encosta Sul',
          },
          riskLevel: 'low',
          factors: {
            soilMoisture: 45,
            slopeInclination: 15,
            rainfall: 5,
            riverLevel: 1.2,
          },
          timestamp: new Date('2024-03-20T10:00:00'),
          recommendations: ['Manter monitoramento regular', 'Verificar drenagem'],
        },
        {
          id: '2',
          location: {
            latitude: -23.5605,
            longitude: -46.6433,
            name: 'Encosta Norte',
          },
          riskLevel: 'low',
          factors: {
            soilMoisture: 42,
            slopeInclination: 12,
            rainfall: 3,
            riverLevel: 1.0,
          },
          timestamp: new Date('2024-03-20T11:00:00'),
          recommendations: ['Monitorar nível do rio', 'Verificar vegetação'],
        },
        // Médio Risco
        {
          id: '3',
          location: {
            latitude: -23.5705,
            longitude: -46.6533,
            name: 'Encosta Leste',
          },
          riskLevel: 'medium',
          factors: {
            soilMoisture: 65,
            slopeInclination: 25,
            rainfall: 15,
            riverLevel: 1.8,
          },
          timestamp: new Date('2024-03-20T12:00:00'),
          recommendations: ['Intensificar monitoramento', 'Preparar equipe de resposta'],
        },
        {
          id: '4',
          location: {
            latitude: -23.5805,
            longitude: -46.6633,
            name: 'Encosta Oeste',
          },
          riskLevel: 'medium',
          factors: {
            soilMoisture: 68,
            slopeInclination: 28,
            rainfall: 18,
            riverLevel: 2.0,
          },
          timestamp: new Date('2024-03-20T13:00:00'),
          recommendations: ['Verificar estruturas de contenção', 'Monitorar chuvas'],
        },
        // Alto Risco
        {
          id: '5',
          location: {
            latitude: -23.5905,
            longitude: -46.6733,
            name: 'Encosta Central',
          },
          riskLevel: 'high',
          factors: {
            soilMoisture: 85,
            slopeInclination: 35,
            rainfall: 35,
            riverLevel: 2.5,
          },
          timestamp: new Date('2024-03-20T14:00:00'),
          recommendations: ['Iniciar evacuação preventiva', 'Ativar equipe de emergência'],
        },
        {
          id: '6',
          location: {
            latitude: -23.6005,
            longitude: -46.6833,
            name: 'Encosta Sudeste',
          },
          riskLevel: 'high',
          factors: {
            soilMoisture: 82,
            slopeInclination: 32,
            rainfall: 30,
            riverLevel: 2.3,
          },
          timestamp: new Date('2024-03-20T15:00:00'),
          recommendations: ['Preparar evacuação', 'Reforçar barreiras'],
        },
        // Crítico
        {
          id: '7',
          location: {
            latitude: -23.6105,
            longitude: -46.6933,
            name: 'Encosta Noroeste',
          },
          riskLevel: 'critical',
          factors: {
            soilMoisture: 95,
            slopeInclination: 45,
            rainfall: 65,
            riverLevel: 3.2,
          },
          timestamp: new Date('2024-03-20T16:00:00'),
          recommendations: ['Evacuação imediata', 'Ativar todos os recursos de emergência'],
        },
        {
          id: '8',
          location: {
            latitude: -23.6205,
            longitude: -46.7033,
            name: 'Encosta Nordeste',
          },
          riskLevel: 'critical',
          factors: {
            soilMoisture: 92,
            slopeInclination: 42,
            rainfall: 60,
            riverLevel: 3.0,
          },
          timestamp: new Date('2024-03-20T17:00:00'),
          recommendations: ['Evacuação urgente', 'Mobilizar equipes de resgate'],
        },
      ];

      setSensors(mockSensors);
      setAlerts(mockAlerts);
      setRiskAssessments(mockRiskAssessments);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados dos sensores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, []);

  const refreshData = async () => {
    await fetchSensorData();
  };

  return (
    <SensorContext.Provider
      value={{
        sensors,
        alerts,
        riskAssessments,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensors = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensors must be used within a SensorProvider');
  }
  return context;
}; 