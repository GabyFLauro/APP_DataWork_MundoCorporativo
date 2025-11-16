import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import theme from '../styles/theme';
import DataWorkScreen from '../screens/DataWorkScreen';
import CentralDashboardScreen from '../screens/CentralDashboardScreen';
import SidebarQuickCreate from './SidebarQuickCreate';
import InboxScreen from '../screens/InboxScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import FocusTrackerScreen from '../screens/FocusTrackerScreen';
import GoalsScreen from '../screens/GoalsScreen';
import WellbeingScreen from '../screens/WellbeingScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GlobalTimerIndicator from '../components/GlobalTimerIndicator';

const Drawer = createDrawerNavigator();

export const SimpleNavigator: React.FC = () => {
  const Stack = createNativeStackNavigator();

  const DrawerNavigatorComponent = () => (
    <Drawer.Navigator
      drawerContent={(props: any) => <SidebarQuickCreate {...props} />}
      screenOptions={({ navigation, route }: any) => ({
        headerShown: true,
        drawerStyle: { backgroundColor: theme.colors.card, width: 300 },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerLeft: () =>
          route.name !== 'CentralDashboard' ? (
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('CentralDashboard')}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          ) : undefined,
      })}
    >
      <Drawer.Screen name="CentralDashboard" component={CentralDashboardScreen} options={{ title: 'Painel', drawerIcon: ({ color, size }: any) => <Ionicons name="speedometer-outline" size={size} color={color} /> }} />
  <Drawer.Screen name="DataWork" component={DataWorkScreen} options={{ title: 'Tarefas', drawerIcon: ({ color, size }: any) => <Ionicons name="list-outline" size={size} color={color} /> }} />
  {/* Wellbeing removed from drawer — accessible from CentralDashboard only */}
  <Drawer.Screen name="Inbox" component={InboxScreen} options={{ title: 'Caixa de Entrada', drawerIcon: ({ color, size }: any) => <Ionicons name="mail-outline" size={size} color={color} /> }} />
  <Drawer.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projetos', drawerIcon: ({ color, size }: any) => <Ionicons name="people-outline" size={size} color={color} /> }} />
    </Drawer.Navigator>
  );

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainDrawer" component={DrawerNavigatorComponent} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ headerShown: true, title: 'Detalhes', headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text }} />
          <Stack.Screen name="Wellbeing" component={WellbeingScreen} options={{ headerShown: true, title: 'Bem-Estar', headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text }} />
          <Stack.Screen name="FocusTracker" component={FocusTrackerScreen} options={{ headerShown: true, title: 'Focus Tracker', headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text }} />
          <Stack.Screen name="Goals" component={GoalsScreen} options={{ headerShown: true, title: 'Metas', headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.text }} />
        </Stack.Navigator>
        <GlobalTimerIndicator />
      </View>
    </NavigationContainer>
  );
};

export default SimpleNavigator;

const styles = StyleSheet.create({
  headerBtn: { paddingHorizontal: 12 },
});
