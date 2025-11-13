export const textSizes = {
  // Tamanhos para labels de sensores
  sensorLabel: {
    small: 10,
    medium: 12,
    normal: 14,
  },
  
  // Tamanhos para valores
  sensorValue: {
    small: 12,
    medium: 14,
    normal: 16,
  },
};

// Use assim:
<Text style={{ fontSize: textSizes.sensorLabel.small }}>
  Umidade
</Text>