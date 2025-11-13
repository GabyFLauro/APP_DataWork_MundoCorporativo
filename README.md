# Global Solution 01 - Advanced Programming & Mobile Dev - 3ECA_FIAP_2025 

Integrante:

Luana Alves de Santana RM: 98546


Gabriella Francisco de Lauro RM: 99280



________________________________________________________________


# Visão Geral do Projeto:

Este é um aplicativo mobile desenvolvido em React Native com Expo que tem como objetivo principal monitorar e prever riscos de deslizamentos de terra através de sensores IoT e análise de dados ambientais. O projeto representa uma solução tecnológica inovadora para prevenção de desastres naturais.

________________________________________________________________


# Funcionalidades Principais


🔍 Monitoramento em Tempo Real:

Coleta dados de sensores de umidade do solo

Monitora inclinação do terreno através de inclinômetros

Apresenta informações ambientais em tempo real

Visualização de dados através de gráficos interativos


📊 Análise de Risco Inteligente:

Algoritmo de Cálculo de Risco: Combina dados de umidade do solo (peso 60%) e inclinação (peso 40%) para gerar um score de risco de 0-100

Classificação de Níveis:

Baixo (0-39)|
Médio (40-59)|
Alto (60-79)|
Crítico (80-100)|

Previsões Futuras: Análise de tendências para prever riscos em 24h, 48h e 72h

🗺️ Geolocalização e Mapeamento:

Avaliações baseadas em coordenadas geográficas

Busca de assessments por localização com raio configurável

Histórico de dados por região específica

👥 Sistema Multi-usuário:

Administradores: Acesso completo ao sistema e gerenciamento de usuários

Usuários: Interface simplificada para consulta de dados

Autenticação segura com diferentes níveis de acesso

________________________________________________________________


# Arquitetura Técnica


Estrutura de Dados:

// Armazenamento local com AsyncStorage

// Dados históricos organizados por coordenadas geográficas

// Máximo de 30 registros por localização para otimização

Algoritmo de Predição:

Utiliza dados históricos para análise de tendências

Aplicação de pesos específicos para diferentes variáveis ambientais

Normalização de valores para escala 0-100

Projeções temporais baseadas em padrões identificados

Gerenciamento de Estado

Navegação estruturada com React Navigation

Tipagem forte com TypeScript

Componentes reutilizáveis e modulares

Prevenção de Desastres:

Alertas antecipados para comunidades em áreas de risco

Monitoramento contínuo de encostas e morros

Suporte à tomada de decisões para evacuações

Planejamento Urbano:

Análise de viabilidade para construções em terrenos inclinados

Mapeamento de zonas de risco em cidades

Dados para políticas públicas de prevenção

Pesquisa Científica:

Coleta de dados ambientais para estudos acadêmicos

Validação de modelos de predição de deslizamentos

Histórico de dados para análises longitudinais

Tecnologias Utilizadas:

React Native + Expo: Framework principal para desenvolvimento mobile

TypeScript: Tipagem estática para maior robustez do código

AsyncStorage: Persistência local de dados

React Navigation: Sistema de navegação entre telas

Componentes Customizados: Interface otimizada para visualização de dados de sensores
Impacto Social

Este aplicativo representa uma ferramenta crucial para salvar vidas e proteger propriedades através da prevenção de deslizamentos. Combina tecnologia IoT, análise de dados e interface mobile para criar um sistema completo de monitoramento ambiental, democratizando o acesso a informações críticas sobre riscos geológicos.

________________________________________________________________


# 🧪 Guia Completo para Testar o APP de Monitoramento de Deslizamentos


📋 Pré-requisitos:

1. Instalar Node.js
   
Verificar se Node.js está instalado

node --version

npm --version

2. Instalar Expo CLI

npm install -g @expo/cli

3. Instalar dependências
   
npm install

4. Executar o Projeto
   
Iniciar o servidor de desenvolvimento

npx expo start


5. Abrir no navegador web
 
 Pressionar 'w' no terminal após o comando anterior OU executar diretamente:

npx expo start --web

6. Testar em Dispositivo Mobile (Opcional)

Configurar Extensão Mobile View (VSCode)

6.1 Instalar extensão

Abrir VSCode

Ir em Extensions (Ctrl+Shift+X)

Pesquisar "Mobile View"

Instalar a extensão

6.2 Usar Mobile View

Clicar no ícone de celular na barra lateral do VSCode

Selecionar modelo de celular desejado

Copiar URL do navegador (ex: http://localhost:19006)

Colar na extensão Mobile View







