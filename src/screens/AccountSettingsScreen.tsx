import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import theme from '../styles/theme';

export const AccountSettingsScreen = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getAccountTypeText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'festo':
        return 'Festo';
      case 'client':
        return 'Empresa Cliente';
      default:
        return role;
    }
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar atualização de email
      Alert.alert('Sucesso', 'Email atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await authService.updateCurrentUserPassword(currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível atualizar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações da Conta</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <Text style={styles.userInfo}>Nome: {user?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alterar Email</Text>
        <Input
          placeholder="Novo Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={styles.input}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.muted}
        />
        <Button
          title="Atualizar Email"
          onPress={handleUpdateEmail}
          loading={loading}
          containerStyle={styles.button}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alterar Senha</Text>
        <Input
          placeholder="Senha Atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          containerStyle={styles.input}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.muted}
        />
        <Input
          placeholder="Nova Senha"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          containerStyle={styles.input}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.muted}
        />
        <Input
          placeholder="Confirmar Nova Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          containerStyle={styles.input}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.muted}
        />
        <Button
          title="Atualizar Senha"
          onPress={handleUpdatePassword}
          loading={loading}
          containerStyle={styles.button}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    marginBottom: 12,
  },
  inputText: {
    color: theme.colors.text,
  },
  button: {
    marginTop: 8,
  },
}); 