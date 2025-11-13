import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskAssessment } from '../types/sensors';
import { Ionicons } from '@expo/vector-icons';

interface RiskAssessmentCardProps {
  assessment: RiskAssessment;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  assessment,
}) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
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

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'checkmark-circle';
      case 'medium':
        return 'alert-circle';
      case 'high':
        return 'warning';
      case 'critical':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.riskInfo}>
          <Ionicons
            name={getRiskIcon(assessment.riskLevel)}
            size={24}
            color={getRiskColor(assessment.riskLevel)}
          />
          <Text
            style={[
              styles.riskLevel,
              { color: getRiskColor(assessment.riskLevel) },
            ]}
          >
            {getRiskText(assessment.riskLevel)}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(assessment.timestamp).toLocaleString()}
        </Text>
      </View>

      <View style={styles.factorsContainer}>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Umidade do Solo</Text>
          <Text style={styles.factorValue}>{assessment.factors.soilMoisture}%</Text>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Inclinação</Text>
          <Text style={styles.factorValue}>
            {assessment.factors.slopeInclination}°
          </Text>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Precipitação</Text>
          <Text style={styles.factorValue}>
            {assessment.factors.rainfall} mm/h
          </Text>
        </View>
        <View style={styles.factor}>
          <Text style={styles.factorLabel}>Nível do Rio</Text>
          <Text style={styles.factorValue}>
            {assessment.factors.riverLevel} m
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#8E8E93" />
        <Text style={styles.locationText}>
          Lat: {assessment.location.latitude.toFixed(4)}, Long:{' '}
          {assessment.location.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  factor: {
    width: '50%',
    marginBottom: 12,
  },
  factorLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  factorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
}); 