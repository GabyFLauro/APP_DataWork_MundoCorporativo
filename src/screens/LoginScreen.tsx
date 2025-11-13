import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Input, Text } from 'react-native-elements';
import styled from 'styled-components/native';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';
import { RootStackParamList } from '../types/navigation';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC = () => {
    const { signIn } = useAuth();
    const navigation = useNavigation<LoginScreenProps['navigation']>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await signIn({ email, password });
            navigation.navigate('Sensors');
        } catch (error) {
            setError('Email ou senha inválidos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <View style={styles.formContainer}>
                <Text h3 style={styles.title}>Login</Text>

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

                {error ? <ErrorText>{error}</ErrorText> : null}

                <Button
                    title="Entrar"
                    onPress={handleLogin}
                    loading={loading}
                    containerStyle={styles.button}
                />

                <Button
                    title="Cadastre-se"
                    onPress={() => navigation.navigate('Register')}
                    containerStyle={styles.registerButton}
                    buttonStyle={styles.registerButtonStyle}
                />
            </View>

            <View style={styles.credentialsContainer}>
                <Text style={styles.hint}>
                    Use as credenciais de exemplo:
                </Text>
                <Text style={styles.credentials}>
                    Admin: admin@example.com / 123456{'\n'}
                    Usuário comum: fabio@email.com / 123456
                </Text>
            </View>
        </Container>
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
    registerButton: {
        marginTop: 10,
        width: '100%',
    },
    registerButtonStyle: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: 12,
    },
    credentialsContainer: {
        padding: 20,
    },
    hint: {
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 16,
    },
    credentials: {
        marginTop: 10,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 14,
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 16,
        textAlign: 'center',
    },
});

const Container = styled.View`
  flex: 1;
  background-color: #000000;
`;

const ErrorText = styled.Text`
  color: ${theme.colors.error};
  text-align: center;
  margin-bottom: 10px;
`;

export default LoginScreen; 