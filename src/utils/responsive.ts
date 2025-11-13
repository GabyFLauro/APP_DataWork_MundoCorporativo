import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const responsive = {
  isSmallScreen: width < 375,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  
  getButtonSpacing: () => {
    if (width < 375) return 8;
    if (width < 414) return 12;
    return 16;
  },
  
  getHorizontalPadding: () => {
    if (width < 375) return 12;
    if (width < 414) return 16;
    return 20;
  },
  
  getButtonHeight: () => {
    return width < 375 ? 44 : 48;
  },
};