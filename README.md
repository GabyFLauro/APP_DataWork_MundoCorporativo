# GS 2 - Advanced Programming & Mobile Dev

# Luana Alves de Santana RM: 98546

# Gabriella Francisco de Lauro RM: 99280

---

# DataWork - Aplicativo de Produtividade Corporativa

## 📱 Sobre o Projeto

**DataWork** é um aplicativo mobile completo de gestão de produtividade para o ambiente corporativo, desenvolvido com React Native e Expo. O aplicativo integra múltiplas funcionalidades essenciais para organização pessoal e profissional, incluindo:

- ✅ **Gestão de Tarefas** - Organize suas atividades diárias
- 🎯 **Controle de Metas** - Defina e acompanhe seus objetivos
- ⏱️ **Timer de Foco (Pomodoro)** - Técnica de concentração com cronômetro
- 🧘 **Monitoramento de Bem-estar** - Acompanhe sua saúde mental e produtividade
- 📅 **Agendamento de Consultas Médicas** - Sistema completo de marcação e gestão de consultas
- 👤 **Sistema de Autenticação** - Login, registro e gestão de usuários
- 📊 **Dashboard Central** - Visualize todas as suas métricas em um só lugar

---

## 🏗️ Arquitetura e Funcionalidades

### 1. **Sistema de Autenticação**
- Registro de novos usuários com validação de campos
- Login com credenciais armazenadas localmente (AsyncStorage)
- Gerenciamento de sessão persistente
- Logout seguro

### 2. **Gestão de Tarefas (DataWork)**
- Criação, edição e exclusão de tarefas
- Definição de prioridade (Alta, Média, Baixa)
- Status de tarefas (Pendente, Em Progresso, Concluído)
- Atribuição de categorias
- Sistema de filtros e busca
- Armazenamento local com AsyncStorage

### 3. **Metas (Goals)**
- Criação de metas com título e descrição
- Acompanhamento de progresso
- Marcação de conclusão
- Histórico de metas alcançadas

### 4. **Timer de Foco (Focus Tracker)**
- Implementação da técnica Pomodoro
- Configuração personalizável de tempo (padrão: 25 minutos)
- Timer continua funcionando mesmo com o app em background
- Persistência de estado - retoma sessão após fechar o app
- Histórico de sessões de foco
- Métricas diárias de tempo focado
- Notificação ao fim da sessão

### 5. **Bem-estar (Wellbeing)**
- Registro diário de estado emocional
- Histórico de registros
- Visualização de tendências

### 6. **Agendamento de Consultas Médicas**
- Listagem de horários disponíveis
- Marcação de consultas
- Gerenciamento de compromissos agendados
- Visualização de histórico

### 7. **Dashboard Central**
- Visão geral de todas as métricas
- Contadores de tarefas, metas e tempo de foco
- Acesso rápido a todas as funcionalidades
- Listagem das últimas tarefas criadas

---

## 🚀 Tecnologias Utilizadas

- **React Native** (0.76.7) - Framework para desenvolvimento mobile
- **Expo** (~52.0.41) - Plataforma de desenvolvimento
- **TypeScript** (5.3.3) - Tipagem estática
- **React Navigation** (7.x) - Navegação e roteamento
  - Stack Navigator
  - Drawer Navigator
- **Styled Components** (6.1.17) - Estilização de componentes
- **AsyncStorage** (2.1.2) - Armazenamento local persistente
- **React Native Gesture Handler** - Gestos e interações
- **React Native Reanimated** - Animações
- **React Native Chart Kit** - Gráficos e visualizações
- **Expo Image Picker** - Seleção de imagens
- **React Native DateTimePicker** - Seleção de data/hora

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
- **npm** ou **yarn** (gerenciador de pacotes)
- **Expo CLI** (será instalado automaticamente)
- **Git** - [Download](https://git-scm.com/)

### Para testar no dispositivo físico:
- **Expo Go** instalado no seu smartphone
  - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

### Para testar em emuladores (opcional):
- **Android Studio** (para emulador Android)
- **Xcode** (para simulador iOS - apenas macOS)

---

## ⚙️ Configuração do Ambiente

### 1. Clone o repositório

```bash
git clone https://github.com/GabyFLauro/APP_DataWork_MundoCorporativo.git
cd APP_DataWork_MundoCorporativo
```

### 2. Instale as dependências

```bash
npm install
```

ou se preferir usar yarn:

```bash
yarn install
```

### 3. Verifique a instalação

Certifique-se de que todas as dependências foram instaladas corretamente. Se houver algum aviso sobre dependências peer, execute:

```bash
npm install --legacy-peer-deps
```

---

## 🎮 Como Rodar o Projeto

### Iniciar o servidor de desenvolvimento

```bash
npm start
```

ou

```bash
npx expo start
```

Este comando iniciará o **Metro Bundler** do Expo e abrirá uma interface no terminal com um QR Code.

### Opções de execução:

#### 📱 **No dispositivo físico (recomendado)**

1. Instale o app **Expo Go** no seu smartphone
2. Após executar `npm start`, um QR Code aparecerá no terminal
3. **Android**: Abra o Expo Go e escaneie o QR Code
4. **iOS**: Abra a câmera nativa do iPhone e escaneie o QR Code

#### 🤖 **No emulador Android**

```bash
npm run android
```

ou pressione `a` no terminal do Metro Bundler.

**Nota:** Certifique-se de ter o Android Studio instalado e um emulador Android configurado.

#### 🍎 **No simulador iOS (apenas macOS)**

```bash
npm run ios
```

ou pressione `i` no terminal do Metro Bundler.

**Nota:** Requer Xcode instalado (disponível apenas em macOS).

#### 🌐 **No navegador web**

```bash
npm run web
```

ou pressione `w` no terminal do Metro Bundler.

**Nota:** Algumas funcionalidades móveis podem ter comportamento limitado na web.

---

## 📱 Como Usar o Aplicativo

### 1. **Primeira Execução - Registro**
   - Na tela inicial, toque em "Criar Conta"
   - Preencha: Nome, Email, Senha e Telefone
   - Clique em "Cadastrar"

### 2. **Login**
   - Use o email e senha cadastrados
   - O sistema mantém a sessão ativa

### 3. **Navegação**
   - Use o **menu drawer** (hambúrguer no topo) para acessar todas as telas
   - O **Dashboard Central** é a tela principal com visão geral

### 4. **Gestão de Tarefas**
   - Acesse "DataWork" no menu
   - Clique no botão "+" para adicionar nova tarefa
   - Preencha título, descrição, prioridade e categoria
   - Edite ou exclua tarefas deslizando para o lado

### 5. **Timer de Foco**
   - Acesse "Focus Tracker" no menu
   - Configure o tempo desejado (padrão: 25 min)
   - Pressione "Iniciar Foco"
   - O timer continua mesmo se você fechar o app
   - Ao retornar, o tempo será atualizado corretamente
   - Pressione "Parar" para encerrar a sessão

### 6. **Metas**
   - Acesse "Goals" no menu
   - Crie novas metas com título e descrição
   - Marque como concluída quando atingir o objetivo

### 7. **Bem-estar**
   - Registre diariamente como está se sentindo
   - Visualize o histórico de registros

### 8. **Consultas Médicas**
   - Acesse "Inbox" no menu
   - Veja horários disponíveis
   - Agende sua consulta

---

## 💾 Armazenamento de Dados

O aplicativo utiliza **AsyncStorage** do React Native para persistência local de dados:

- **Autenticação**: Usuário logado e token
- **Tarefas**: Lista completa de tarefas
- **Metas**: Metas criadas e seu status
- **Sessões de Foco**: Histórico de todas as sessões
- **Estado do Timer**: Tempo restante e se está ativo (permite retomar após fechar o app)
- **Bem-estar**: Registros de humor/estado

### Chaves de Armazenamento:
```typescript
@MedicalApp:user              // Usuário logado
@MedicalApp:token             // Token de autenticação
datawork_tasks_v1             // Tarefas
datawork_goals_v1             // Metas
datawork_focus_sessions_v1    // Sessões de foco
datawork_focus_timer_state_v1 // Estado atual do timer
datawork_wellbeing_v1         // Registros de bem-estar
```

---

## 🐛 Solução de Problemas

### O aplicativo não inicia

1. Limpe o cache do Expo:
```bash
npx expo start -c
```

2. Reinstale as dependências:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Erro de dependências

```bash
npm install --legacy-peer-deps
```

### Problemas com o AsyncStorage

Certifique-se de que o pacote está instalado corretamente:
```bash
npx expo install @react-native-async-storage/async-storage
```

### Erro ao escanear QR Code

- Certifique-se de que o smartphone e o computador estão na **mesma rede Wi-Fi**
- Desative VPNs ou firewalls que possam bloquear a conexão
- Tente usar o modo Tunnel: pressione `s` no terminal do Expo e escolha "Tunnel"

### Timer de foco não persiste

Verifique se o aplicativo tem permissões para executar em segundo plano. Isso é controlado pelas configurações do sistema operacional do dispositivo.

---

## 📝 Scripts Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm run android    # Executa no emulador Android
npm run ios        # Executa no simulador iOS
npm run web        # Executa no navegador
```

---








