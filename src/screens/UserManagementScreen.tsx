import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, ListItem, Avatar, Icon, Button } from 'react-native-elements';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  image?: string;
}

const UserManagementScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'patient') return 'Usuário Comum';
    return role;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      // Trate o erro conforme necessário
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    Alert.alert(
      'Excluir Usuário',
      'Tem certeza que deseja excluir este usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await authService.deleteRegisteredUser(userId);
            fetchUsers();
          },
        },
      ]
    );
  };

  const openEditModal = (user: User) => {
    setEditUserId(user.id);
    setEditEmail(user.email);
    setEditPassword('');
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editUserId) return;
    await authService.editRegisteredUser(editUserId, editEmail, editPassword);
    setEditModalVisible(false);
    setEditUserId(null);
    setEditEmail('');
    setEditPassword('');
    fetchUsers();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Usuários Cadastrados</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ListItem bottomDivider containerStyle={styles.listItem}>
            <Avatar
              rounded
              source={item.image ? { uri: item.image } : undefined}
              title={item.name[0]}
              containerStyle={styles.avatar}
            />
            <ListItem.Content>
              <ListItem.Title style={styles.name}>{item.name}</ListItem.Title>
              <ListItem.Subtitle style={styles.email}>{item.email}</ListItem.Subtitle>
              <ListItem.Subtitle style={styles.role}>{getRoleLabel(item.role)}</ListItem.Subtitle>
            </ListItem.Content>
            {item.id !== currentUser?.id && (
              <>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ marginRight: 10 }}>
                  <Icon name="edit" color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Icon name="delete" color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
          </ListItem>
        )}
      />
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="Novo Email"
              placeholderTextColor="#8E8E93"
              value={editEmail}
              onChangeText={setEditEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Nova Senha"
              placeholderTextColor="#8E8E93"
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button
                title="Cancelar"
                onPress={() => setEditModalVisible(false)}
                buttonStyle={{ backgroundColor: '#8E8E93', paddingHorizontal: 20 }}
              />
              <Button
                title="Salvar"
                onPress={handleEditSave}
                buttonStyle={{ backgroundColor: '#007AFF', paddingHorizontal: 20 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  title: {
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  listItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    marginBottom: 8,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
  },
  email: {
    color: '#8E8E93',
  },
  role: {
    color: '#007AFF',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
});

export default UserManagementScreen; 