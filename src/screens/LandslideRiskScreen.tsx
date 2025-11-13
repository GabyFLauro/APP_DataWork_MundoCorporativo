import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { landslidePredictor } from '../services/landslidePredictor';
import { LandslideRiskAssessment } from '../types/sensors';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';

export const LandslideRiskScreen: React.FC = () => {
  const [assessments, setAssessments] = useState<LandslideRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      await landslidePredictor.loadAssessments();
      setAssessments(landslidePredictor.getAssessments());
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as avaliações de risco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const getRiskLevelCount = (level: string) => {
    return assessments.filter((assessment) => assessment.riskLevel === level).length;
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FFC107';
      case 'high':
        return '#FF9800';
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'low':
        return 'Baixo Risco';
      case 'medium':
        return 'Risco Médio';
      case 'high':
        return 'Alto Risco';
      case 'critical':
        return 'Risco Crítico';
      default:
        return 'Risco Desconhecido';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadAssessments} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Monitoramento de Riscos</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#1C1C1E' }]}>
          <Text style={[styles.statValue, { color: getRiskLevelColor('low') }]}>
            {getRiskLevelCount('low')}
          </Text>
          <Text style={styles.statLabel}>Baixo Risco</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1C1C1E' }]}>
          <Text style={[styles.statValue, { color: getRiskLevelColor('medium') }]}>
            {getRiskLevelCount('medium')}
          </Text>
          <Text style={styles.statLabel}>Médio Risco</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1C1C1E' }]}>
          <Text style={[styles.statValue, { color: getRiskLevelColor('high') }]}>
            {getRiskLevelCount('high') + getRiskLevelCount('critical')}
          </Text>
          <Text style={styles.statLabel}>Alto Risco</Text>
        </View>
      </View>

      <View style={styles.assessmentsContainer}>
        <Text style={styles.sectionTitle}>Avaliações Recentes</Text>
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <RiskAssessmentCard
              key={assessment.id}
              assessment={assessment}
            />
          ))
        ) : (
          <Text style={styles.noDataText}>Nenhuma avaliação disponível</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  assessmentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
  },
}); 