import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Input, Text } from 'react-native-elements';
import styled from 'styled-components/native';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import { RootStackParamList } from '../types/navigation';

type RegisterScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

const RegisterScreen: React.FC = () => {
    const { register } = useAuth();
    const navigation = useNavigation<RegisterScreenProps['navigation']>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        setLoading(true);
        try {
            await register({
                name,
                email,
                password,
            });
            Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
            navigation.navigate('Login');
        } catch (err) {
            setError('Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <Text h3 style={styles.title}>Cadastro</Text>

                <Input
                    placeholder="Nome"
                    value={name}
                    onChangeText={setName}
                    containerStyle={styles.input}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#8E8E93"
                />

                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    containerStyle={styles.input}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#8E8E93"
                />

                <Input
                    placeholder="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    containerStyle={styles.input}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#8E8E93"
                />

                <Input
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    containerStyle={styles.input}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#8E8E93"
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Button
                    title="Cadastrar"
                    onPress={handleRegister}
                    loading={loading}
                    containerStyle={styles.button}
                />

                <Button
                    title="Voltar"
                    onPress={() => navigation.navigate('Login')}
                    containerStyle={styles.backButton}
                    buttonStyle={styles.backButtonStyle}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    formContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        marginBottom: 15,
        width: '100%',
    },
    inputText: {
        color: '#FFFFFF',
    },
    button: {
        marginTop: 10,
        width: '100%',
    },
    backButton: {
        marginTop: 10,
        width: '100%',
    },
    backButtonStyle: {
        backgroundColor: '#2C2C2E',
    },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default RegisterScreen;