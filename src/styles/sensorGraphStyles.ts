import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const sensorGraphStyles = StyleSheet.create({
  graphContainer: {
    marginLeft: 40,
    marginRight: 10,
    paddingLeft: 16,
    paddingRight: 8,
    width: width - 40,
  },
  
  graphWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 24,
  },
  
  chartContainer: {
    marginLeft: 25,
    marginRight: 15,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  sensorDetailCard: {
    marginLeft: 28,
    marginRight: 8,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  
  graphTitle: {
    textAlign: 'right',
    marginRight: 16,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginRight: 16,
  },
});