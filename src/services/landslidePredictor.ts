import AsyncStorage from '@react-native-async-storage/async-storage';
import { LandslideRiskAssessment, SoilMoistureSensor, InclinometerSensor } from '../types/sensors';
import { EnvironmentalData } from './environmentalData';

const STORAGE_KEYS = {
  LANDSLIDE_ASSESSMENTS: '@landslide_assessments',
  HISTORICAL_DATA: '@historical_landslide_data',
};

class LandslidePredictor {
  private assessments: LandslideRiskAssessment[] = [];

  async loadAssessments(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LANDSLIDE_ASSESSMENTS);
      if (data) {
        this.assessments = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações de risco:', error);
    }
  }

  async saveAssessments(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LANDSLIDE_ASSESSMENTS,
        JSON.stringify(this.assessments)
      );
    } catch (error) {
      console.error('Erro ao salvar avaliações de risco:', error);
    }
  }

  async assessRiskFromEnvironmentalData(
    environmentalData: EnvironmentalData,
    location: { latitude: number; longitude: number; name: string }
  ): Promise<LandslideRiskAssessment> {
    const soilMoisture = parseFloat(environmentalData.soilMoisture);
    const inclination = parseFloat(environmentalData.slopeInclination);
    const rainfall = parseFloat(environmentalData.rainfall);
    const riverLevel = parseFloat(environmentalData.riverLevel);
    
    const riskScore = this.calculateRiskScore(soilMoisture, inclination, rainfall, riverLevel);
    const riskLevel = this.determineRiskLevel(riskScore);

    // Buscar dados históricos para previsão
    const historicalData = await this.getHistoricalData(location);
    const predictions = this.predictFutureRisk(riskScore, historicalData);

    const assessment: LandslideRiskAssessment = {
      id: `assessment_${Date.now()}`,
      location,
      soilMoisture,
      inclination,
      riskLevel,
      riskScore,
      timestamp: environmentalData.timestamp,
      predictions,
    };

    // Salvar avaliação
    this.assessments.push(assessment);
    await this.saveAssessments();
    await this.saveHistoricalData(location, riskScore);

    return assessment;
  }

  private calculateRiskScore(
    soilMoisture: number,
    inclination: number,
    rainfall: number,
    riverLevel: number
  ): number {
    // Fatores de peso para cada parâmetro
    const weights = {
      soilMoisture: 0.3,
      inclination: 0.3,
      rainfall: 0.2,
      riverLevel: 0.2,
    };

    // Normalização dos valores para escala 0-100
    const normalizedSoilMoisture = Math.min(soilMoisture, 100);
    const normalizedInclination = Math.min((inclination / 45) * 100, 100);
    const normalizedRainfall = Math.min((rainfall / 50) * 100, 100);
    const normalizedRiverLevel = Math.min((riverLevel / 3) * 100, 100);

    // Cálculo do score ponderado
    const score =
      normalizedSoilMoisture * weights.soilMoisture +
      normalizedInclination * weights.inclination +
      normalizedRainfall * weights.rainfall +
      normalizedRiverLevel * weights.riverLevel;

    return Math.round(score);
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 30) return 'low';
    if (riskScore < 50) return 'medium';
    if (riskScore < 70) return 'high';
    return 'critical';
  }

  private predictFutureRisk(
    currentScore: number,
    historicalData: number[]
  ): {
    next24h: 'low' | 'medium' | 'high' | 'critical';
    next48h: 'low' | 'medium' | 'high' | 'critical';
    next72h: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Implementação simplificada da previsão
    // Em um cenário real, isso usaria algoritmos mais sofisticados
    const trend = this.calculateTrend(historicalData);
    
    const next24h = this.determineRiskLevel(currentScore + trend * 1);
    const next48h = this.determineRiskLevel(currentScore + trend * 2);
    const next72h = this.determineRiskLevel(currentScore + trend * 3);

    return { next24h, next48h, next72h };
  }

  private calculateTrend(historicalData: number[]): number {
    if (historicalData.length < 2) return 0;

    const recentData = historicalData.slice(-5); // Usar os últimos 5 pontos
    let sum = 0;
    for (let i = 1; i < recentData.length; i++) {
      sum += recentData[i] - recentData[i - 1];
    }
    return sum / (recentData.length - 1);
  }

  private async getHistoricalData(location: { latitude: number; longitude: number }): Promise<number[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORICAL_DATA);
      if (data) {
        const historical = JSON.parse(data);
        const locationKey = `${location.latitude}_${location.longitude}`;
        return historical[locationKey] || [];
      }
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
    }
    return [];
  }

  private async saveHistoricalData(
    location: { latitude: number; longitude: number },
    riskScore: number
  ): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORICAL_DATA);
      const historical = data ? JSON.parse(data) : {};
      const locationKey = `${location.latitude}_${location.longitude}`;
      
      if (!historical[locationKey]) {
        historical[locationKey] = [];
      }
      
      historical[locationKey].push(riskScore);
      
      // Manter apenas os últimos 30 registros
      if (historical[locationKey].length > 30) {
        historical[locationKey] = historical[locationKey].slice(-30);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORICAL_DATA, JSON.stringify(historical));
    } catch (error) {
      console.error('Erro ao salvar dados históricos:', error);
    }
  }

  getAssessments(): LandslideRiskAssessment[] {
    return this.assessments;
  }

  async getAssessmentsByLocation(
    latitude: number,
    longitude: number,
    radius: number = 0.01
  ): Promise<LandslideRiskAssessment[]> {
    await this.loadAssessments();
    
    return this.assessments.filter(assessment => {
      const latDiff = Math.abs(assessment.location.latitude - latitude);
      const lonDiff = Math.abs(assessment.location.longitude - longitude);
      return latDiff <= radius && lonDiff <= radius;
    });
  }

  generateLandslideAlert(assessment: LandslideRiskAssessment): {
    type: 'warning' | 'critical';
    message: string;
    timestamp: string;
  } | null {
    if (assessment.riskLevel === 'critical' || assessment.riskLevel === 'high') {
      return {
        type: assessment.riskLevel === 'critical' ? 'critical' : 'warning',
        message: `Risco ${assessment.riskLevel === 'critical' ? 'CRÍTICO' : 'ALTO'} de deslizamento detectado em ${assessment.location.name}. Umidade do solo: ${assessment.soilMoisture}%, Inclinação: ${assessment.inclination}°`,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }
}

export const landslidePredictor = new LandslidePredictor();