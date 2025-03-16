# SuperERP - Sistema de Gestão para Supermercados

Um sistema de gerenciamento completo para supermercados, com interface moderna e responsiva desenvolvida em React e Material UI. Arquitetura multi-tenant para suportar múltiplas empresas/lojas na mesma plataforma.

## Funcionalidades

- **Sistema Multi-Tenant**: Gerenciamento de múltiplas empresas na mesma plataforma
- **Sistema de Autenticação**: Login seguro com suporte a diferentes tenants
- **Cadastro de Novas Empresas**: Funcionalidade de self-service para novos clientes
- **Validação de Documentos**: Verificação de CNPJ e outros documentos
- **Dashboard Interativo**: Visualização rápida das principais métricas do negócio
- **Tema Claro/Escuro**: Personalização da experiência do usuário
- **Interface Responsiva**: Adaptação perfeita a diferentes dispositivos
- **Menu Retrátil**: Melhor aproveitamento do espaço da tela
- **Gráficos Interativos**: Visualização clara dos dados de vendas e estoque
- **Design Moderno**: Interface limpa e intuitiva utilizando Material UI

## Tecnologias Utilizadas

- **React**: Biblioteca JavaScript para construção de interfaces
- **TypeScript**: Superset tipado de JavaScript
- **Material UI**: Biblioteca de componentes React
- **React Router**: Gerenciamento de rotas no frontend
- **Recharts**: Biblioteca para criação de gráficos
- **Context API**: Gerenciamento de estado para autenticação
- **Axios**: Cliente HTTP para chamadas à API
- **JWT**: Autenticação baseada em tokens

## Pré-requisitos

- Node.js (versão 18.0.0 ou superior)
- npm ou yarn
- Acesso à API do SuperERP (backend)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/erp-supermercado-front.git
cd erp-supermercado-front
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
# ou
yarn start
```

4. Acesse o aplicativo em seu navegador:
```
http://localhost:3000
```

## Estrutura do Projeto

```
src/
├── assets/           # Imagens e recursos estáticos
├── components/       # Componentes reutilizáveis
│   ├── layout/       # Componentes de layout (Sidebar, Header)
│   └── ui/           # Componentes de interface (Botões, Cards, etc)
├── context/          # Contextos React (Tema, Autenticação)
├── hooks/            # Hooks personalizados
├── pages/            # Páginas da aplicação
│   ├── auth/         # Páginas de autenticação (Login, Registro)
│   └── dashboard/    # Páginas do dashboard
├── services/         # Serviços e API
│   ├── api.ts        # Configuração do Axios e endpoints
├── theme/            # Configuração de tema
└── utils/            # Funções utilitárias
    ├── documentUtils.ts  # Formatação e validação de documentos
```

## Arquitetura Multi-tenant

O SuperERP utiliza uma arquitetura multi-tenant, onde:

- Cada empresa (supermercado) é um **tenant** separado
- Os usuários pertencem a um tenant específico
- O acesso aos recursos é isolado por tenant
- O backend identifica automaticamente o tenant do usuário pelo email

### Fluxo de Autenticação

1. **Login Simplificado**: Usuário fornece apenas email e senha
2. **Identificação Automática do Tenant**: O backend identifica a qual tenant o usuário pertence
3. **Retorno do Tenant ID**: O backend retorna o tenant_id junto com o token JWT
4. **Armazenamento de Dados**: Frontend armazena o token JWT e o tenant_id para uso em requisições futuras
5. **Requisições Autenticadas**: O tenant_id é incluído automaticamente nos cabeçalhos das requisições subsequentes

## Uso

Para testar o sistema, você pode:

1. **Registrar uma nova empresa**: Acesse a página de registro e crie um novo tenant
2. **Login simplificado**: Use apenas seu email e senha para acessar o sistema
3. **Identificação automática**: O sistema identifica automaticamente a qual empresa (tenant) você pertence

## Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contato

Seu Nome - seu-email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/erp-supermercado-front](https://github.com/seu-usuario/erp-supermercado-front) 