import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';

// Chaves de armazenamento
const STORAGE_KEYS = {
    USER: '@MedicalApp:user',
    TOKEN: '@MedicalApp:token',
    REGISTERED_USERS: '@MedicalApp:registeredUsers',
};

// Médicos mockados que podem fazer login
const mockDoctors: any[] = [];

// Admin mockado
const mockAdmin: User & { password: string } = {
    id: 'admin',
    name: 'Administrador',
    email: 'admin@example.com',
    role: 'admin' as const,
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
    password: '123456'
};

// Usuário comum mockado
const mockUser: User & { password: string } = {
    id: 'user',
    name: 'Fábio',
    email: 'fabio@email.com',
    role: 'patient' as const,
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    password: '123456'
};

// Lista de usuários cadastrados (pacientes)
let registeredUsers: (User & { password: string })[] = [];

export const authService = {
    async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
        // Verifica se é o admin
        if (credentials.email === mockAdmin.email && credentials.password === '123456') {
            return {
                user: mockAdmin,
                token: 'admin-token',
            };
        }

        // Verifica se é o usuário comum
        if (credentials.email === mockUser.email && credentials.password === '123456') {
            return {
                user: mockUser,
                token: 'user-token',
            };
        }

        // Verifica se é um usuário registrado
        const found = registeredUsers.find(u => u.email === credentials.email && u.password === credentials.password);
        if (found) {
            // Retorna o usuário registrado como "Usuário Comum"
            const { password, ...user } = found;
            return {
                user: { ...user, role: 'patient' },
                token: 'user-token',
            };
        }

        throw new Error('Email ou senha inválidos');
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        // Cria um novo usuário comum
        const newUser: User & { password: string } = {
            id: Date.now().toString(),
            name: data.name,
            email: data.email,
            role: 'patient',
            image: '',
            password: data.password,
        };
        registeredUsers.push(newUser);
        await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
        const { password, ...user } = newUser;
        return {
            user,
            token: 'user-token',
        };
    },

    async signOut(): Promise<void> {
        // Limpa os dados do usuário do AsyncStorage
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    },

    async getStoredUser(): Promise<User | null> {
        try {
            const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            if (userJson) {
                return JSON.parse(userJson);
            }
            return null;
        } catch (error) {
            console.error('Erro ao obter usuário armazenado:', error);
            return null;
        }
    },

    // Funções para o admin
    async getAllUsers(): Promise<User[]> {
        // Retorna apenas admin, Fábio e os cadastrados
        return [
            mockAdmin,
            mockUser,
            ...registeredUsers.map(({ password, ...user }) => user)
        ];
    },

    async getAllDoctors(): Promise<User[]> {
        return mockDoctors;
    },

    async getPatients(): Promise<User[]> {
        return registeredUsers;
    },

    // Função para carregar usuários registrados ao iniciar o app
    async loadRegisteredUsers(): Promise<void> {
        try {
            const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
            if (usersJson) {
                registeredUsers = JSON.parse(usersJson);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários registrados:', error);
        }
    },

    async deleteRegisteredUser(userId: string): Promise<void> {
        registeredUsers = registeredUsers.filter(u => u.id !== userId);
        await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    },

    async editRegisteredUser(userId: string, newEmail: string, newPassword: string): Promise<void> {
        registeredUsers = registeredUsers.map(u =>
            u.id === userId
                ? { ...u, email: newEmail, password: newPassword ? newPassword : u.password }
                : u
        );
        await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    },

    async updateCurrentUserPassword(currentPassword: string, newPassword: string): Promise<void> {
        const storedUser = await this.getStoredUser();
        if (!storedUser) {
            throw new Error('Usuário não encontrado');
        }

        // Verifica se é o admin
        if (storedUser.email === mockAdmin.email) {
            if (currentPassword !== '123456') {
                throw new Error('Senha atual incorreta');
            }
            // Atualiza a senha do admin mockado
            mockAdmin.password = newPassword;
            return;
        }

        // Verifica se é o usuário comum
        if (storedUser.email === mockUser.email) {
            if (currentPassword !== '123456') {
                throw new Error('Senha atual incorreta');
            }
            // Atualiza a senha do usuário comum mockado
            mockUser.password = newPassword;
            return;
        }

        // Verifica se é um usuário registrado
        const userIndex = registeredUsers.findIndex(u => u.id === storedUser.id);
        if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
        }

        if (registeredUsers[userIndex].password !== currentPassword) {
            throw new Error('Senha atual incorreta');
        }

        // Atualiza a senha do usuário registrado
        registeredUsers[userIndex].password = newPassword;
        await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    },
}; 