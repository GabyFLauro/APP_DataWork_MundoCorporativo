import React from 'react';
import { View, StyleSheet } from 'react-native'; // Removido Dimensions, adicionado StyleSheet
import { LineChart } from 'react-native-chart-kit';
// import { sensorGraphStyles } from '../styles/sensorGraphStyles'; // Mantido caso você queira usar styles externos, mas não é usado aqui.

// Removida a linha: const { width } = Dimensions.get('window');

interface SensorChartProps {
  data: any; // Ajuste para a interface de dados do seu gráfico (se definida)
  title: string; // Título do gráfico (embora não usado diretamente no retorno JSX neste snippet, é uma boa prática manter)
  width: number; // Largura recebida como prop
  height?: number; // Altura opcional, com um valor padrão
}

const SensorChart: React.FC<SensorChartProps> = ({ data, title, width, height = 220 }) => {
  const chartConfig = {
    // Cores ajustadas para um tema escuro, se aplicável, ou mantenha suas cores originais
    backgroundColor: '#1C1C1E', // Exemplo de fundo escuro
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Azul para a linha do gráfico
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Branco para as labels
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    yAxisInterval: 1, // Adicionado para melhor controle do eixo Y
  };

  return (
    <View style={styles.chartWrapper}> {/* Usando um estilo definido no StyleSheet */}
      <LineChart
        data={data}
        width={width} // AGORA USA A LARGURA PASSADA VIA PROP
        height={height} // Usa a altura passada via prop ou o padrão
        chartConfig={chartConfig}
        bezier
        style={{
          borderRadius: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    // Este wrapper pode ser usado para adicionar padding interno ao gráfico
    // ou simplesmente para ser o contêiner do LineChart.
    // Evite definir larguras fixas aqui.
  },
  // Se você tiver outros estilos para o SensorChart, defina-os aqui.
});

export default SensorChart;