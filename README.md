QuizMaster

Plataforma web de quizzes voltada para estudos e preparação para provas. O projeto permite responder questões, acompanhar o desempenho, utilizar diferentes temas visuais e consultar conquistas e estatísticas.

Sobre o projeto

O QuizMaster foi desenvolvido com foco em uma experiência simples e interativa de estudos. A plataforma reúne questões de diferentes temas e níveis de dificuldade, permitindo que o usuário acompanhe seu progresso durante os estudos.

Entre os principais recursos estão:

Sistema de quizzes com diferentes níveis de dificuldade

Modo de estudos com configuração personalizada

Feedback após responder às questões

Estatísticas de desempenho

Sistema de conquistas

Diferentes temas visuais

Interface responsiva

Suporte a PWA

Recursos de acessibilidade

Novidades
Setembro de 2025

Adicionadas 25 novas questões, totalizando mais de 55 questões disponíveis.

Criada uma nova categoria de dificuldade: Muito Difícil.

Expansão do conteúdo para mais de 20 temas.

Criado o Modo Estudos, com seleção de dificuldade e tema.

Adicionado cronômetro durante os estudos.

Adicionadas estatísticas em tempo real.

Criado um relatório com o resultado ao finalizar uma sessão de estudos.

Reorganizada a barra de navegação.

Adicionados badges para destacar algumas funcionalidades.

Melhorada a navegação em dispositivos móveis.

Ajustadas as animações e transições da interface.

Tecnologias
Frontend

Next.js 15

React 19

TypeScript 5

Tailwind CSS 3

Framer Motion

Radix UI

Estado e dados

React Context

LocalStorage

Zod

Ferramentas

ESLint

Prettier

Husky

Commitlint

Estrutura do projeto
tcc-now/
├── app/
│   ├── (auth)/
│   ├── api/
│   ├── dashboard/
│   ├── game/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── game/
│   └── layout/
│
├── contexts/
├── hooks/
├── lib/
├── public/
├── styles/
├── types/
└── README.md

Temas

A aplicação possui sete temas visuais:

Cyberpunk

Space

Ocean

Forest

Desert

Volcano

Aurora

Os temas podem ser utilizados para personalizar a aparência da aplicação durante a utilização da plataforma.

Sistema de conquistas

As conquistas são divididas em diferentes categorias:

Quiz — relacionadas à realização de quizzes

Streak — relacionadas à frequência de estudos

Social — relacionadas a interações sociais

Mastery — relacionadas ao domínio dos conteúdos

Speed — relacionadas ao tempo de resposta

Help — relacionadas a ações de ajuda

Demo — relacionadas ao modo de demonstração

As conquistas possuem quatro níveis de raridade:

Common

Rare

Epic

Legendary

Modo Estudos

O Modo Estudos foi criado para permitir sessões de estudo mais direcionadas.

O usuário pode definir:

Tema das questões

Nível de dificuldade

Quantidade de questões

Tempo de estudo

Durante a sessão, a aplicação apresenta informações sobre o desempenho. Ao finalizar, é exibido um relatório com os resultados obtidos.

Como executar o projeto
Requisitos

Antes de iniciar, é necessário ter instalado:

Node.js 18 ou superior

npm, yarn ou pnpm

Instalação

Clone o repositório:

git clone https://github.com/seu-usuario/quizmaster.git


Entre na pasta:

cd quizmaster


Instale as dependências:

npm install

Ambiente de desenvolvimento

Execute:

npm run dev


A aplicação estará disponível em:

http://localhost:3000

Scripts
npm run dev          # Inicia o ambiente de desenvolvimento
npm run build        # Gera o build de produção
npm run start        # Inicia o servidor de produção
npm run lint         # Executa o ESLint
npm run type-check   # Verifica os tipos do TypeScript

Testes

Caso os scripts de teste estejam configurados no projeto:

npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

Configuração

Crie um arquivo .env.local na raiz do projeto:

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

GOOGLE_SITE_VERIFICATION=your-verification-code

NEXT_PUBLIC_GA_ID=your-ga-id
NEXT_PUBLIC_GTM_ID=your-gtm-id


As variáveis de Analytics são opcionais.

Configurações da aplicação

As principais configurações ficam em:

lib/config.ts


Exemplo:

export const APP_CONFIG = {
  name: "QuizMaster",
  version: "1.0.0",
};

PWA

O projeto possui configuração para funcionamento como Progressive Web App.

Entre os recursos previstos estão:

Manifesto da aplicação

Ícones para diferentes dispositivos

Metadados para instalação

Suporte à instalação como aplicativo

Customização
Temas

As configurações dos temas ficam em:

lib/config.ts


Exemplo:

export const THEME_COLORS = {
  cyberpunk: {
    background: "bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900",
    primary: "text-cyan-400",
  },
};

Componentes

Os componentes seguem uma estrutura baseada em componentes reutilizáveis, com:

Props tipadas

Variantes

Componentes de UI reutilizáveis

Recursos de acessibilidade

Animações e transições

Testes

A estrutura de testes segue a organização:

__tests__/
├── components/
├── hooks/
├── utils/
└── integration/


Os testes podem ser separados entre componentes, hooks, funções utilitárias e integrações.

Performance

Entre as otimizações utilizadas no projeto estão:

Lazy loading

Otimização de imagens

Code splitting

Tree shaking

Minificação de CSS e JavaScript

Otimização do bundle

Segurança

O projeto utiliza recursos como:

Validação de dados com Zod

Sanitização de entradas

Headers de segurança

Content Security Policy

HTTPS em produção

Controle de requisições da API

Internacionalização

Atualmente, o idioma principal da aplicação é:

Português (Brasil)

Existe estrutura preparada para futuras traduções:

locales/
├── pt-BR/
│   ├── common.json
│   ├── game.json
│   └── achievements.json
│
└── en/
    ├── common.json
    ├── game.json
    └── achievements.json

Roadmap
Versão 1.1

 Sistema completo de usuários

 Integração com banco de dados

 Sistema de ranking

 Modo multiplayer

Versão 1.2

 Aplicativo mobile

 Geração de questões com inteligência artificial

 Sistema de tutoriais

 Integração com LMS

Versão 2.0

 Recursos de realidade aumentada

 Novos recursos de gamificação

 Analytics avançado

 API pública

Contribuição

Para contribuir com o projeto:

Faça um fork do repositório.

Crie uma branch para sua alteração:

git checkout -b feature/minha-feature


Faça as alterações.

Realize o commit:

git commit -m "feat: adiciona nova funcionalidade"


Envie a branch:

git push origin feature/minha-feature


Abra um Pull Request.

Padrão de commits

O projeto utiliza Conventional Commits:

feat: adiciona nova funcionalidade
fix: corrige problema
docs: atualiza documentação
style: ajusta formatação
refactor: reorganiza código
test: adiciona testes
chore: atualiza dependências

Licença

Este projeto está licenciado sob a licença MIT.

Consulte o arquivo LICENSE para mais informações.

Contato

Email: contato@quizmaster.com

Discord: QuizMaster Community

Documentação: docs.quizmaster.com

Issues: GitHub Issues

Desenvolvido pela equipe QuizMaster.
