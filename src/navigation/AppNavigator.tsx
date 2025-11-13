import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DataWorkScreen from '../screens/DataWorkScreen';
import FocusTrackerScreen from '../screens/FocusTrackerScreen';
import GoalsScreen from '../screens/GoalsScreen';
import WellbeingScreen from '../screens/WellbeingScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const LogoutScreen = () => {
  const { signOut } = useAuth();
  React.useEffect(() => {
    signOut();
  }, []);
  return <View />;
};

const DrawerNavigator = () => {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: '#1C1C1E',
          width: 240,
        },
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        drawerLabelStyle: {
          color: '#FFFFFF',
        },
        drawerActiveBackgroundColor: '#2C2C2E',
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#8E8E93',
      }}
    >
      <Drawer.Screen
        name="DataWork"
        component={DataWorkScreen}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FocusTracker"
        component={FocusTrackerScreen}
        options={{
          title: 'Focus Tracker',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: 'Metas',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Wellbeing"
        component={WellbeingScreen}
        options={{
          title: 'Bem-Estar',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{
          title: 'Configurações',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          title: 'Sair',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color="#FF3B30" />
          ),
          drawerLabelStyle: {
            color: '#FF3B30',
          },
        }}
      />
    </Drawer.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {!user ? (
                    // Rotas públicas
                    <>
                        <Stack.Screen 
                            name="Login" 
                            component={LoginScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen 
                            name="Register" 
                            component={RegisterScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                    </>
                ) : (
                    // Rotas protegidas
                    <>
                        <Stack.Screen
                            name="DrawerNavigator"
                            component={DrawerNavigator}
                            options={{ headerShown: false }}
                        />
            {/* Apenas o DrawerNavigator nas rotas protegidas para este app simplificado */}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}; 