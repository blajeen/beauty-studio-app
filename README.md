# Beauty Studio App

Plataforma white-label de atendimento, agendamento e gestão para estúdios de beleza —
estética facial e corporal, manicure, nail art, sobrancelhas, cílios e maquiagem.

Cada instalação pertence a **um único estúdio**. Não é marketplace: a cliente sente
que está usando o aplicativo oficial daquele lugar, não uma vitrine de concorrentes.

A instalação de demonstração é o **Lumi Beauty Studio** — dois endereços, oito
profissionais, catálogo completo, portfólio, clientes com histórico, pacotes,
assinatura mensal e um casamento em produção.

---

## Começar

```bash
npm install
npm run setup      # prisma generate + db push + seed
npm run dev        # http://localhost:3000
```

`npm run setup` cria o banco SQLite (`prisma/dev.db`) e popula os dados
demonstrativos. Para recomeçar do zero a qualquer momento: `npm run db:reset`.

### Acessos de demonstração

Senha para todos: `lumi1234`

| Perfil | E-mail | Onde cai |
| --- | --- | --- |
| Dona do estúdio | `dona@lumi.studio` | `/admin` |
| Gestão | `gestao@lumi.studio` | `/admin` |
| Profissional — unhas | `ana@lumi.studio` | `/pro` |
| Profissional — sobrancelhas | `julia@lumi.studio` | `/pro` |
| Profissional — noivas | `sofia@lumi.studio` | `/pro` |
| Cliente com histórico | `maria@cliente.com` | `/minha-conta` |
| Cliente noiva | `juliana@cliente.com` | `/minha-conta` |
| Gestor do produto | `produto@lumi.studio` | `/studio` |

---

## O que existe

### Cliente
Catálogo por categoria, perfis e portfólio das profissionais, galeria com filtros,
pacotes, Beauty Club, fluxo de noivas. Agendamento com múltiplos caminhos, histórico
com ficha técnica, inspirações, remarcação e cancelamento.

### Profissional
Tela "Hoje" com a próxima cliente já contextualizada (último procedimento, técnica,
cor, referências enviadas), agenda própria em dia e semana, clientes atendidas,
registro de atendimento com ficha por especialidade, fotos com controle de
visibilidade, portfólio e bloqueios de agenda.

### Dona / gestão
Dashboard com ocupação, distribuição por categoria, carga por profissional, ranking
de serviços e clientes para reativar. Agenda em dia/semana/lista com filtros por
unidade, profissional, categoria e status. Fichas de cliente, equipe, catálogo e
preços, pacotes e assinaturas, eventos e unidades.

### Gestor do produto
Configuração da marca (nome, monograma, paleta, tipografia, contato, módulos,
políticas e regras de agendamento), textos do site, pré-visualização do rascunho no
site real, publicação e trilha de auditoria.

---

## Arquitetura

```
prisma/
  schema.prisma      Modelo de dados completo
  seed.ts            Lumi Beauty Studio — dados demonstrativos
src/
  app/
    (site)/          Experiência pública + área da cliente
    (auth)/          Entrar e criar conta
    pro/             Área da profissional
    admin/           Gestão do estúdio
    studio/          Configuração do produto (white-label)
  components/
    ui/              Design system (primitivas, estados, overlays, mídia)
    cards.tsx        Cartões de domínio
    nav/             Cabeçalho, barra inferior e casca das áreas internas
  lib/
    brand/           Contrato white-label, tokens e leitura publicado/rascunho
    scheduling/      Motor de disponibilidade, planejamento e reserva atômica
    data/            Consultas de leitura por domínio
    auth/            Sessão, RBAC e auditoria
scripts/
  smoke.ts           Verificação de rotas e permissões
  screenshots.ts     Captura de telas para revisão visual
tests/
  scheduling.test.ts Testes do motor de agenda
```

### Stack

Next.js 15 (App Router, Server Components e Server Actions), React 19, TypeScript
estrito, Tailwind CSS v4, Prisma e SQLite. Sessão própria com JWT em cookie
`httpOnly` + registro em banco (permite revogação). Sem dependência de serviço
externo — a aplicação sobe com `npm install` e roda.

---

## Motor de agendamento

Um algoritmo atende todos os caminhos:

| Caminho | Entrada |
| --- | --- |
| Serviço → profissional → horário | `/agendar?servico=<slug>` |
| Profissional → serviço → horário | `/agendar?profissional=<id>` |
| Primeiro disponível | botão na etapa de horário |
| Pacote → serviços → horário | `/agendar?pacote=<slug>` |
| Evento → serviços → cronograma | `/agendar?ocasiao=1` |
| Remarcação | `/agendar?remarcar=<id>` |

**Conceitos.** `duration` é o tempo que a cliente vê e ocupa a cadeira;
`bufferAfter` é a higienização que ocupa a profissional e some da interface. Uma
*cadeia* é a sequência de serviços de uma mesma reserva, possivelmente com
profissionais diferentes — cada serviço pode deslizar alguns minutos para acomodar
buffers e trocas, o que produz roteiros como 14:00 / 14:45 / 15:15.

**Cronograma reverso.** Em eventos a cliente informa o horário em que precisa estar
pronta; o sistema soma a duração dos serviços mais o preparo e devolve o horário de
início — e só oferece encaixes que terminam a tempo.

**Prevenção de conflito.** A grade pode ficar velha entre a leitura e o toque em
confirmar. Por isso a verificação final acontece dentro da transação: horário,
bloqueios e outros itens da reserva são rechecados, e se alguém reservou primeiro a
reserva inteira falha — nunca grava metade. A interface envia apenas o que a cliente
escolheu; preço, duração e profissional são recalculados no servidor.

---

## White-label

Nenhum componente conhece o nome, as cores ou os textos do estúdio. A configuração
vive na tabela `Setting`, vira CSS custom properties injetadas em `<html>` e é
consumida pelo design system inteiro.

O painel `/studio` grava **rascunho**, permite **pré-visualizar** o site real com ele
e só então **publicar**. Módulos inteiros — pacotes, Beauty Club, eventos, portfólio,
inspirações, lista de espera, avaliações, múltiplas unidades — ligam e desligam por
configuração, removendo telas, links e seções.

Para vender a base a outro estúdio: duplicar a instalação apontando para um banco
novo, ajustar marca e conteúdo pelo painel, cadastrar unidades, equipe e catálogo
pela área da gestão, pré-visualizar e publicar. Sem fork.

---

## Permissões

`OWNER`, `MANAGER`, `PROFESSIONAL`, `CUSTOMER`, `PRODUCT_MANAGER`.

A matriz única fica em `src/lib/auth/guards.ts` — nenhuma tela decide sozinha. A
profissional vê a própria agenda e as clientes que atendeu; não acessa a agenda das
colegas, preços, financeiro nem configuração. Ações sensíveis ficam registradas em
auditoria, visível em `/studio/auditoria`.

---

## Privacidade das fotos

Três estados: `PRIVATE` (só o estúdio), `CLIENT_VISIBLE` (a cliente vê no histórico)
e `PUBLIC_PORTFOLIO` (aparece no portfólio). Publicar exige consentimento registrado
na ficha da cliente — a interface bloqueia a opção quando ele não existe. Se a
cliente retirar a autorização no próprio perfil, as fotos saem do portfólio na hora.

---

## Verificação

```bash
npm run typecheck   # TypeScript estrito (aplicação + ferramentas)
npm test            # motor de agenda: conflito, buffers, escala, cronograma reverso
npm run smoke       # rotas e permissões (precisa do servidor no ar)
npm run e2e         # agendamento ponta a ponta pelo navegador
npm run shots       # capturas de tela em .shots (revisão visual)
```

O `e2e` percorre o caminho completo da cliente: entra, escolhe dois serviços de
categorias diferentes, confere o roteiro, confirma, encontra a reserva em "meus
horários", abre o detalhe e cancela — e ainda valida o atalho de primeiro horário
disponível e o cronograma reverso de eventos.

`smoke`, `e2e` e `shots` esperam a aplicação em `http://localhost:3200` — ajuste com
a variável `BASE`. Os dois últimos usam o navegador já instalado na máquina; se o
modo direto falhar (é comum com o Edge no Windows), abra o navegador com
`--remote-debugging-port=9222` e rode com `BROWSER_URL=http://127.0.0.1:9222`.

---

## Pagamento

O MVP não processa pagamentos. O acerto acontece no estúdio, conforme as regras do
estabelecimento. A plataforma cuida de agendamento, pacote, plano, utilização e
status.

---

## Fases seguintes

**Fase 2** — push, WhatsApp API, notificação automática da lista de espera, CRM e
campanhas de reativação, portfólio público expandido, eventos com múltiplas
participantes agendadas de uma vez.

**Fase 3** — aplicativo nativo, domínio próprio por estúdio, automações, inteligência
de agenda (previsão de demanda e recomendação de retorno), gestão avançada de
eventos.

---

## Configuração

Copie `.env.example` para `.env`. São três variáveis: `DATABASE_URL`, `AUTH_SECRET`
e `NEXT_PUBLIC_APP_URL`.

O **provider do Prisma segue a string de conexão**. O Prisma exige um provider
literal no schema e não aceita variável de ambiente, então `scripts/db-provider.mjs`
ajusta a linha antes de gerar o client — `file:` vira SQLite, `postgresql://` vira
PostgreSQL. Ele roda dentro do `build`, do `setup` e dos comandos de banco, é
idempotente e não precisa ser chamado à mão.

Em produção, gere um `AUTH_SECRET` próprio e sirva sob HTTPS — o cookie de sessão
passa a `secure` automaticamente fora de desenvolvimento.

---

## Deploy na Vercel

SQLite não funciona em serverless: o sistema de arquivos é efêmero e somente
leitura. A hospedagem precisa de um PostgreSQL gerenciado — Neon, Supabase ou
Vercel Postgres. O código não muda.

**1. Banco.** Crie um PostgreSQL e copie a string de conexão **com pool**
(`pgbouncer=true&connection_limit=1`). Sem pool, funções serverless esgotam o limite
de conexões.

**2. Repositório.** Suba o projeto para o GitHub e importe em vercel.com/new. O
Next.js é detectado sozinho; o build já é `npm run build`.

**3. Variáveis de ambiente** no painel da Vercel:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | string do PostgreSQL, com pool |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | endereço do deploy |

**4. Criar as tabelas e os dados.** Na sua máquina, apontando para o banco de
produção:

```bash
DATABASE_URL="<string do postgres>" npm run db:deploy
```

Isso cria o schema e popula o Lumi Beauty Studio. Para subir uma instalação limpa,
rode só `prisma db push` e cadastre o estúdio pelas telas de `/studio` e `/admin`.

**Antes de atender cliente de verdade:** troque `prisma db push` por
`prisma migrate`. O projeto não versiona migrações porque o banco de
desenvolvimento é descartável — com dados reais isso deixa de ser aceitável.


