import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'react-native-elements';
import { responsive } from '../utils/responsive';

interface ResponsiveButtonGroupProps {
  buttons: Array<{
    title: string;
    onPress: () => void;
    type?: 'solid' | 'outline';
    disabled?: boolean;
  }>;
}

const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({ buttons }) => {
  const buttonSpacing = responsive.getButtonSpacing();
  const buttonHeight = responsive.getButtonHeight();

  return (
    <View style={[styles.container, { gap: buttonSpacing }]}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          title={button.title}
          onPress={button.onPress}
          type={button.type || 'solid'}
          disabled={button.disabled}
          buttonStyle={[
            styles.button,
            { 
              height: buttonHeight,
              marginBottom: buttonSpacing,
            }
          ]}
          containerStyle={styles.buttonContainer}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsive.getHorizontalPadding(),
    paddingVertical: 16,
  },
  buttonContainer: {
    marginVertical: 4,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default ResponsiveButtonGroup;