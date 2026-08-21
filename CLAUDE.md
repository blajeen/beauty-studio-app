# Beauty Studio App — notas para quem for mexer no código

Produto white-label de agendamento e gestão para estúdios de beleza. Leia o
`README.md` primeiro; aqui ficam as decisões que não são óbvias no código.

## Comandos

```bash
npm run dev          # desenvolvimento
npm run setup        # generate + db push + seed (primeira vez)
npm run db:reset     # recomeça o banco com dados demonstrativos
npm run typecheck    # obrigatório antes de considerar algo pronto
npm test             # motor de agenda
npm run smoke        # rotas e permissões (servidor no ar em :3200)
npm run shots        # capturas para revisão visual
```

## Regras que valem para tudo

**Uma instalação = um estúdio.** Nada de marketplace, comparação, ranking externo ou
busca por profissionais de outros negócios.

**Nenhuma marca escrita em componente.** Nome, cores, tipografia, textos, contato e
módulos vêm de `src/lib/brand`. Se você digitou "Lumi" fora de `prisma/seed.ts` ou
dos valores padrão em `brand/config.ts`, está errado.

**Preços em centavos.** Sempre `Int`. Formate com `formatCurrency` / `formatPrice`.
Nenhuma aritmética com float.

**O cliente nunca envia preço ou duração.** As Server Actions recebem só a escolha
(serviço, profissional, horário) e recalculam tudo no servidor. Isso vale
especialmente para `confirmBooking`.

**Permissão passa por `can()`.** A matriz está em `src/lib/auth/guards.ts`. Não
espalhe verificação de `role` pelas telas.

**Erro técnico não chega à cliente.** Toda falha vira mensagem humana com uma saída.
Os estados prontos estão em `src/components/ui/states.tsx`.

## Motor de agenda (`src/lib/scheduling`)

- `engine.ts` — algoritmo: contexto, verificação de disponibilidade, montagem da
  cadeia, grade do dia, primeiro disponível, calendário.
- `planner.ts` — traduz a escolha da cliente em requisições, ordena os serviços
  (o que molha primeiro, o rosto por último) e calcula o cronograma reverso.
- `booking.ts` — criação, remarcação, cancelamento e conclusão, com recheque de
  conflito dentro da transação.

Ao mexer aqui, rode `npm test`. Os testes cobrem expediente, pausa de almoço,
antecedência mínima, encadeamento com profissionais diferentes, buffer entre
serviços da mesma pessoa, bloqueio, reserva no passado e double booking.

O contexto é carregado **uma vez** para todo o intervalo consultado. Se você
adicionar uma consulta dentro de um laço de dias, criou um N+1.

## Fichas técnicas

Cada serviço aponta para um perfil de ficha (`Service.recordSchema`) e a
profissional vê **apenas** os campos daquela especialidade. Os perfis estão em
`RECORD_SCHEMAS` (`src/lib/constants.ts`). Nunca transforme isso num formulário
único com todos os campos — é o que a especificação pede explicitamente para evitar.

## Fotos

Três visibilidades (`PRIVATE`, `CLIENT_VISIBLE`, `PUBLIC_PORTFOLIO`). Publicar exige
`Customer.consentPhotos`; a verificação está em `addProcedurePhoto` e a interface
desabilita a opção. Retirar o consentimento em `/minha-conta/perfil` rebaixa as fotos
públicas imediatamente. Não crie caminho que publique sem passar por essa checagem.

## Texto em português

O produto é escrito em pt-BR e fala com a cliente, não com o sistema. Duas
armadilhas frequentes:

- **Gênero.** Nomes de serviço são masculinos e femininos ("o design", "a
  manutenção"). Não escreva `Último {serviço}` — use uma frase que não dependa do
  gênero, como "Atendimento anterior · {serviço}".
- **Números.** A fonte de títulos é um Garamond, com algarismos minúsculos por
  padrão. O CSS já força `lining-nums` em `h1/h2/h3/.font-display`; se você
  introduzir outra família para números, confira como o "1" e o "3" saem.

## Design

Tipografia serifada editorial nos títulos, sans na interface, espaçamento generoso,
poucos elementos decorativos. A sofisticação vem de hierarquia e respiro, não de
ornamento. Evite excesso de rosa, dourado, glitter e banner promocional.

Mobile-first de verdade: a cliente e a profissional usam o app no celular. Toda tela
nova precisa funcionar em 414px antes de funcionar em 1440px.

## Migrações

O projeto usa `prisma db push` (sem histórico de migração) porque o banco de
desenvolvimento é descartável. Se for para produção com dados reais, troque para
`prisma migrate dev` antes do primeiro deploy.
