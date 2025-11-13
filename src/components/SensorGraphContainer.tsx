import React from 'react';
import { View, Text, ScrollView, StyleSheet, ViewProps } from 'react-native'; // Adicionado StyleSheet e ViewProps
import { sensorGraphStyles } from '../styles/sensorGraphStyles'; // Mantido, mas leia o aviso abaixo!

interface SensorGraphContainerProps extends ViewProps { // Estende ViewProps para aceitar 'onLayout' e outras props padrão
  title: string;
  children: React.ReactNode;
  showLegend?: boolean;
}

const SensorGraphContainer: React.FC<SensorGraphContainerProps> = ({ 
  title, 
  children, 
  showLegend = false,
  ...rest // Captura todas as outras props (incluindo 'onLayout')
}) => {
  return (
    // A View principal do container. Passa todas as props restantes (incluindo 'onLayout') para ela.
    // O 'onLayout' aqui medirá a largura do 'graphContainer' APÓS a aplicação de seus próprios paddings/margins.
    <View style={sensorGraphStyles.graphContainer} {...rest}>
      <Text style={sensorGraphStyles.graphTitle}>{title}</Text>
      
      {/* O chartContainer e graphWrapper devem ser flexíveis e não ter larguras fixas */}
      <View style={sensorGraphStyles.chartContainer}>
        <View style={sensorGraphStyles.graphWrapper}>
          {children} {/* O SensorChart será renderizado aqui */}
        </View>
        
        {showLegend && (
          <View style={sensorGraphStyles.legendContainer}>
            {/* Adicione aqui os componentes de legenda */}
          </View>
        )}
      </View>
    </View>
  );
};

export default SensorGraphContainer;
