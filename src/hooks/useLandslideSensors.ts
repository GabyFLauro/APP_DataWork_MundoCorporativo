import { useState, useEffect } from 'react';
import { landslidePredictor } from '../services/landslidePredictor';
import { LandslideRiskAssessment, SoilMoistureSensor, InclinometerSensor } from '../types/sensors';

export const useLandslideSensors = () => {
  const [soilMoistureSensors, setSoilMoistureSensors] = useState<SoilMoistureSensor[]>([]);
  const [inclinometerSensors, setInclinometerSensors] = useState<InclinometerSensor[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<LandslideRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data para demonstração
  const mockSoilMoistureSensors: SoilMoistureSensor[] = [
    {
      id: 'soil_001',
      name: 'Sensor Umidade Solo - Zona A',
      type: 'soil_moisture',
      status: 'active',
      location: { latitude: -23.5505, longitude: -46.6333 },
      lastReading: {
        value: 75,
        unit: '%',
        timestamp: new Date().toISOString(),
      },
      batteryLevel: 85,
      thresholds: {
        dry: 30,
        normal: 60,
        saturated: 80,
      },
    },
    {
      id: 'soil_002',
      name: 'Sensor Umidade Solo - Zona B',
      type: 'soil_moisture',
      status: 'warning',
      location: { latitude: -23.5515, longitude: -46.6343 },
      lastReading: {
        value: 85,
        unit: '%',
        timestamp: new Date().toISOString(),
      },
      batteryLevel: 92,
      thresholds: {
        dry: 30,
        normal: 60,
        saturated: 80,
      },
    },
  ];

  const mockInclinometerSensors: InclinometerSensor[] = [
    {
      id: 'incl_001',
      name: 'Inclinômetro - Encosta Norte',
      type: 'inclinometer',
      status: 'active',
      location: { latitude: -23.5505, longitude: -46.6333 },
      lastReading: {
        value: 15,
        unit: 'degrees',
        timestamp: new Date().toISOString(),
      },
      batteryLevel: 78,
      thresholds: {
        stable: 10,
        warning: 20,
        critical: 30,
      },
    },
    {
      id: 'incl_002',
      name: 'Inclinômetro - Encosta Sul',
      type: 'inclinometer',
      status: 'critical',
      location: { latitude: -23.5515, longitude: -46.6343 },
      lastReading: {
        value: 32,
        unit: 'degrees',
        timestamp: new Date().toISOString(),
      },
      batteryLevel: 65,
      thresholds: {
        stable: 10,
        warning: 20,
        critical: 30,
      },
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      await landslidePredictor.loadAssessments();
      
      setSoilMoistureSensors(mockSoilMoistureSensors);
      setInclinometerSensors(mockInclinometerSensors);
      setRiskAssessments(landslidePredictor.getAssessments());

      // Gerar avaliações automáticas se não existirem
      if (landslidePredictor.getAssessments().length === 0) {
        await generateInitialAssessments();
      }
    } catch (error) {
      console.error('Erro ao carregar dados de sensores:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialAssessments = async () => {
    for (let i = 0; i < mockSoilMoistureSensors.length; i++) {
      const soilSensor = mockSoilMoistureSensors[i];
      const inclSensor = mockInclinometerSensors[i];
      
      if (soilSensor && inclSensor) {
        await landslidePredictor.assessLandslideRisk(
          soilSensor,
          inclSensor,
          {
            latitude: soilSensor.location.latitude,
            longitude: soilSensor.location.longitude,
            address: `Área de Risco ${i + 1}`,
          }
        );
      }
    }
    setRiskAssessments(landslidePredictor.getAssessments());
  };

  const assessRisk = async (
    soilSensorId: string,
    inclinometerSensorId: string,
    location: { latitude: number; longitude: number; address: string }
  ) => {
    const soilSensor = soilMoistureSensors.find(s => s.id === soilSensorId);
    const inclSensor = inclinometerSensors.find(s => s.id === inclinometerSensorId);

    if (soilSensor && inclSensor) {
      const assessment = await landslidePredictor.assessLandslideRisk(
        soilSensor,
        inclSensor,
        location
      );
      setRiskAssessments(landslidePredictor.getAssessments());
      return assessment;
    }
    return null as any;
  };

  return {
    soilMoistureSensors,
    inclinometerSensors,
    riskAssessments,
    loading,
    loadData,
    assessRisk,
    generateInitialAssessments,
  };
};