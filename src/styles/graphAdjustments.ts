export const graphAdjustments = {
  // Para mover gráficos para a direita
  moveRight: {
    marginLeft: 28,
    paddingLeft: 16,
    alignSelf: 'flex-end',
  },
  
  // Para containers de gráficos
  graphContainer: {
    marginLeft: 32,
    marginRight: 8,
    justifyContent: 'flex-end',
  },
  
  // Para títulos de gráficos
  rightAlignedTitle: {
    textAlign: 'right' as const,
    marginRight: 20,
  },
};