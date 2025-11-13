import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, TextStyle, ViewStyle } from 'react-native';
import { Button, ListItem, Text } from 'react-native-elements';
import styled from 'styled-components/native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import { RootStackParamList } from '../types/navigation';

type AdminDashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    specialty: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'doctor' | 'patient';
}

interface StyledProps {
    status: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed':
            return theme.colors.success;
        case 'cancelled':
            return theme.colors.error;
        default:
            return theme.colors.warning;
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'Confirmada';
        case 'cancelled':
            return 'Cancelada';
        default:
            return 'Pendente';
    }
};

const AdminDashboardScreen: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<AdminDashboardScreenProps['navigation']>();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            // Carrega consultas
            const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
            if (storedAppointments) {
                const allAppointments: Appointment[] = JSON.parse(storedAppointments);
                setAppointments(allAppointments);
            }

            // Carrega usuários
            const storedUsers = await AsyncStorage.getItem('@MedicalApp:users');
            if (storedUsers) {
                const allUsers: User[] = JSON.parse(storedUsers);
                setUsers(allUsers);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    // Carrega os dados quando a tela estiver em foco
    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const handleUpdateStatus = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled') => {
        try {
            const storedAppointments = await AsyncStorage.getItem('@MedicalApp:appointments');
            if (storedAppointments) {
                const allAppointments: Appointment[] = JSON.parse(storedAppointments);
                const updatedAppointments = allAppointments.map(appointment => {
                    if (appointment.id === appointmentId) {
                        return { ...appointment, status: newStatus };
                    }
                    return appointment;
                });
                await AsyncStorage.setItem('@MedicalApp:appointments', JSON.stringify(updatedAppointments));
                loadData(); // Recarrega os dados
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    return (
        <Container>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Title>Painel Administrativo</Title>
                <Button
                    title="Gerenciar Usuários"
                    onPress={() => navigation.navigate('UserManagement')}
                    containerStyle={styles.button as ViewStyle}
                    buttonStyle={styles.buttonStyle}
                />
            </ScrollView>
        </Container>
    );
};

const styles = {
    scrollContent: {
        padding: 20,
    },
    button: {
        marginBottom: 20,
        width: '100%',
    },
    buttonStyle: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
    },
    actionButton: {
        marginTop: 8,
        width: '48%',
    },
    confirmButton: {
        backgroundColor: theme.colors.success,
        paddingVertical: 8,
    },
    cancelButton: {
        backgroundColor: theme.colors.error,
        paddingVertical: 8,
    },
};

const Container = styled.View`
  flex: 1;
  background-color: #000000;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 20px;
  text-align: center;
`;

export default AdminDashboardScreen; 