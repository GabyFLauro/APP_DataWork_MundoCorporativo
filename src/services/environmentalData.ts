import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ENVIRONMENTAL_DATA: '@environmental_data',
};

export interface EnvironmentalData {
  soilMoisture: string;
  slopeInclination: string;
  rainfall: string;
  riverLevel: string;
  temperature: string;
  humidity: string;
  windSpeed: string;
  notes: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

class EnvironmentalDataService {
  private data: EnvironmentalData[] = [];

  async loadData(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.ENVIRONMENTAL_DATA);
      if (storedData) {
        this.data = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados ambientais:', error);
    }
  }

  async saveData(data: EnvironmentalData): Promise<void> {
    try {
      // Add timestamp if not provided
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }

      this.data.push(data);
      
      // Keep only the last 100 records
      if (this.data.length > 100) {
        this.data = this.data.slice(-100);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.ENVIRONMENTAL_DATA,
        JSON.stringify(this.data)
      );
    } catch (error) {
      console.error('Erro ao salvar dados ambientais:', error);
      throw error;
    }
  }

  async getLatestData(): Promise<EnvironmentalData | null> {
    await this.loadData();
    return this.data.length > 0 ? this.data[this.data.length - 1] : null;
  }

  async getAllData(): Promise<EnvironmentalData[]> {
    await this.loadData();
    return this.data;
  }
}

export const environmentalDataService = new EnvironmentalDataService(); 