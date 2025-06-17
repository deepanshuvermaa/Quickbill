import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  ...rest
}: ButtonProps) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    // Add size styles
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);
    
    // Add variant styles
    if (variant === 'primary') baseStyle.push(styles.buttonPrimary);
    if (variant === 'secondary') baseStyle.push(styles.buttonSecondary);
    if (variant === 'outline') baseStyle.push(styles.buttonOutline);
    if (variant === 'danger') baseStyle.push(styles.buttonDanger);
    if (variant === 'success') baseStyle.push(styles.buttonSuccess);
    
    // Add full width style
    if (fullWidth) baseStyle.push(styles.buttonFullWidth);
    
    // Add disabled style
    if (disabled || loading) baseStyle.push(styles.buttonDisabled);
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle: TextStyle[] = [styles.buttonText];
    
    // Add size styles
    if (size === 'small') baseStyle.push(styles.buttonTextSmall);
    if (size === 'large') baseStyle.push(styles.buttonTextLarge);
    
    // Add variant styles
    if (variant === 'primary') baseStyle.push(styles.buttonTextPrimary);
    if (variant === 'secondary') baseStyle.push(styles.buttonTextSecondary);
    if (variant === 'outline') baseStyle.push(styles.buttonTextOutline);
    if (variant === 'danger') baseStyle.push(styles.buttonTextDanger);
    if (variant === 'success') baseStyle.push(styles.buttonTextSuccess);
    
    // Add disabled style
    if (disabled || loading) baseStyle.push(styles.buttonTextDisabled);
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.primary : colors.white} 
        />
      ) : (
        <>
          {icon}
          <Text style={[...getTextStyle(), icon ? { marginLeft: 8 } : {}, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  buttonTextPrimary: {
    color: colors.white,
  },
  buttonTextSecondary: {
    color: colors.white,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonTextDanger: {
    color: colors.white,
  },
  buttonTextSuccess: {
    color: colors.white,
  },
  buttonTextDisabled: {
    color: colors.white,
  },
});