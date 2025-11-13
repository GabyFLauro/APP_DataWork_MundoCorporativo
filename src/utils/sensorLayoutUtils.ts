import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const getSensorGraphLayout = () => {
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 414;
  
  return {
    marginLeft: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
    chartWidth: width - (isSmallScreen ? 60 : isMediumScreen ? 80 : 100),
    paddingHorizontal: isSmallScreen ? 8 : 16,
  };
};