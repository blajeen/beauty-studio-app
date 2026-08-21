# Briefing de imagens

Gerado por `npm run brief` a partir do banco. **66 imagens.**

Todas vão para `public/media/`. O nome do arquivo é o contrato: o seed e a
configuração passam a apontar para `/media/<arquivo>`.

## Direção de arte

Editorial e sóbria, como catálogo de marca de beleza — não como banco de
imagens de salão. Luz natural difusa, paleta quente e neutra (bege, cacau,
terracota suave, off-white), fundo limpo, profundidade rasa. Sem texto na
imagem, sem marca d'água, sem colagem, sem saturação alta, sem glitter, sem
moldura decorativa. Enquadramento com respiro: parte da composição precisa
sobreviver a recortes de 1:1, 3:4 e 4:3.

## Atenção

18 das 66 imagens têm mão ou unha em primeiro plano — é onde modelos
generativos falham (dedo a mais, unha deformada, junta impossível). Confira
uma a uma em tamanho real e descarte o que não passar. Nas demais o risco é
baixo.

## Proporções

| Slot | Proporção | Tamanho | Uso |
| --- | --- | --- | --- |
| `category` | 1:1 | 1600×1600 | recortada em 3:4 e 4:3 na grade da Home |
| `service` | 4:3 | 1600×1200 | cartão de serviço no catálogo |
| `avatar` | 1:1 | 800×800 | exibida em círculo, rosto centralizado |
| `cover` | 3:4 | 1200×1600 | capa do perfil e cartão da equipe |
| `portfolio` | 1:1 | 1400×1400 | galeria e lightbox |
| `package` | 4:3 | 1600×1200 | cartão de pacote |
| `branch` | 16:9 | 1920×1080 | cartão de unidade |
| `inspiration` | 1:1 | 1000×1000 | quadro de inspirações da cliente |
| `hero` | 4:3 | 1920×1440 | hero da Home |
| `editorial` | 3:2 | 2400×1600 | faixa de página inteira |

## Peças

| # | Arquivo | Slot | Assunto | Mão/unha | Campo |
| --- | --- | --- | --- | --- | --- |
| 1 | `categoria-unhas.jpg` | category | Unhas — Manicure, gel, alongamento e nail art | ⚠ sim | `ServiceCategory("unhas").coverImage` |
| 2 | `categoria-sobrancelhas.jpg` | category | Sobrancelhas — Design, henna e laminação | — | `ServiceCategory("sobrancelhas").coverImage` |
| 3 | `categoria-cilios.jpg` | category | Cílios — Extensão, volume e lash lifting | — | `ServiceCategory("cilios").coverImage` |
| 4 | `categoria-maquiagem.jpg` | category | Maquiagem — Social, festa, fotos e noivas | — | `ServiceCategory("maquiagem").coverImage` |
| 5 | `categoria-estetica-facial.jpg` | category | Estética facial — Limpeza, peeling e hidratação | — | `ServiceCategory("estetica-facial").coverImage` |
| 6 | `categoria-estetica-corporal.jpg` | category | Estética corporal — Massagem, drenagem e spa | — | `ServiceCategory("estetica-corporal").coverImage` |
| 7 | `servico-manicure-tradicional.jpg` | service | Manicure tradicional (Unhas) — Cutícula, lixamento e esmaltação em esmalte comum. | ⚠ sim | `Service("manicure-tradicional").imageUrl` |
| 8 | `servico-esmaltacao-gel.jpg` | service | Esmaltação em gel (Unhas) — Brilho e resistência por até três semanas. | ⚠ sim | `Service("esmaltacao-gel").imageUrl` |
| 9 | `servico-alongamento-gel.jpg` | service | Alongamento em gel (Unhas) — Extensão em gel com formato desenhado para a sua mão. | ⚠ sim | `Service("alongamento-gel").imageUrl` |
| 10 | `servico-nail-art.jpg` | service | Nail Art (Unhas) — Desenho autoral por unha. Combine com qualquer serviço. | ⚠ sim | `Service("nail-art").imageUrl` |
| 11 | `servico-design-sobrancelhas.jpg` | service | Design de sobrancelhas (Sobrancelhas) — Mapeamento do formato a partir da sua expressão. | — | `Service("design-sobrancelhas").imageUrl` |
| 12 | `servico-brow-lamination.jpg` | service | Brow Lamination (Sobrancelhas) — Fios alinhados e efeito volumoso por semanas. | — | `Service("brow-lamination").imageUrl` |
| 13 | `servico-extensao-classica.jpg` | service | Extensão clássica (Cílios) — Um fio por cílio natural. Resultado discreto e elegante. | — | `Service("extensao-classica").imageUrl` |
| 14 | `servico-maquiagem-social.jpg` | service | Maquiagem social (Maquiagem) — Para jantares, reuniões e compromissos do dia. | — | `Service("maquiagem-social").imageUrl` |
| 15 | `servico-maquiagem-noiva.jpg` | service | Maquiagem para noiva (Maquiagem) — No dia do casamento, com acompanhamento e retoque. | — | `Service("maquiagem-noiva").imageUrl` |
| 16 | `servico-limpeza-pele.jpg` | service | Limpeza de pele (Estética facial) — Higienização profunda com extração. | — | `Service("limpeza-pele").imageUrl` |
| 17 | `equipe-ana-ribeiro-avatar.jpg` | avatar | Retrato de Ana Ribeiro, Nail designer — olhar para a câmera, fundo neutro | — | `Professional("Ana Ribeiro").avatarUrl` |
| 18 | `equipe-ana-ribeiro-capa.jpg` | cover | Ana Ribeiro em contexto de trabalho: Alongamento em gel, Manutenção, Esmaltação em gel | ⚠ sim | `Professional("Ana Ribeiro").coverUrl` |
| 19 | `equipe-bruna-camargo-avatar.jpg` | avatar | Retrato de Bruna Camargo, Manicure e pedicure — olhar para a câmera, fundo neutro | — | `Professional("Bruna Camargo").avatarUrl` |
| 20 | `equipe-bruna-camargo-capa.jpg` | cover | Bruna Camargo em contexto de trabalho: Manicure, Pedicure, Blindagem | ⚠ sim | `Professional("Bruna Camargo").coverUrl` |
| 21 | `equipe-paula-nunes-avatar.jpg` | avatar | Retrato de Paula Nunes, Nail artist — olhar para a câmera, fundo neutro | — | `Professional("Paula Nunes").avatarUrl` |
| 22 | `equipe-paula-nunes-capa.jpg` | cover | Paula Nunes em contexto de trabalho: Nail Art, Chrome, Francesinha | ⚠ sim | `Professional("Paula Nunes").coverUrl` |
| 23 | `equipe-julia-nakamura-avatar.jpg` | avatar | Retrato de Julia Nakamura, Designer de sobrancelhas — olhar para a câmera, fundo neutro | — | `Professional("Julia Nakamura").avatarUrl` |
| 24 | `equipe-julia-nakamura-capa.jpg` | cover | Julia Nakamura em contexto de trabalho: Design, Henna, Brow Lamination | — | `Professional("Julia Nakamura").coverUrl` |
| 25 | `equipe-larissa-prado-avatar.jpg` | avatar | Retrato de Larissa Prado, Lash designer — olhar para a câmera, fundo neutro | — | `Professional("Larissa Prado").avatarUrl` |
| 26 | `equipe-larissa-prado-capa.jpg` | cover | Larissa Prado em contexto de trabalho: Volume russo, Extensão clássica, Lash Lifting | — | `Professional("Larissa Prado").coverUrl` |
| 27 | `equipe-carla-meireles-avatar.jpg` | avatar | Retrato de Carla Meireles, Maquiadora — olhar para a câmera, fundo neutro | — | `Professional("Carla Meireles").avatarUrl` |
| 28 | `equipe-carla-meireles-capa.jpg` | cover | Carla Meireles em contexto de trabalho: Maquiagem social, Festa, Fotos | — | `Professional("Carla Meireles").coverUrl` |
| 29 | `equipe-sofia-duarte-avatar.jpg` | avatar | Retrato de Sofia Duarte, Maquiadora — noivas e eventos — olhar para a câmera, fundo neutro | — | `Professional("Sofia Duarte").avatarUrl` |
| 30 | `equipe-sofia-duarte-capa.jpg` | cover | Sofia Duarte em contexto de trabalho: Noivas, Eventos, Maquiagem + cabelo | — | `Professional("Sofia Duarte").coverUrl` |
| 31 | `equipe-renata-alves-avatar.jpg` | avatar | Retrato de Renata Alves, Esteticista — olhar para a câmera, fundo neutro | — | `Professional("Renata Alves").avatarUrl` |
| 32 | `equipe-renata-alves-capa.jpg` | cover | Renata Alves em contexto de trabalho: Limpeza de pele, Peeling, Drenagem | — | `Professional("Renata Alves").coverUrl` |
| 33 | `portfolio-amendoado-nude-leitoso.jpg` | portfolio | Amendoado nude leitoso — Alongamento em gel por Ana Ribeiro · estilo: Alongamento,Minimalista | ⚠ sim | `PortfolioItem("Amendoado nude leitoso").imageUrl` |
| 34 | `portfolio-fibra-com-francesinha-fina.jpg` | portfolio | Fibra com francesinha fina — Alongamento em fibra de vidro por Ana Ribeiro · estilo: Alongamento,Francesinha | ⚠ sim | `PortfolioItem("Fibra com francesinha fina").imageUrl` |
| 35 | `portfolio-chrome-espelhado.jpg` | portfolio | Chrome espelhado — Nail Art por Paula Nunes · estilo: Nail Art,Chrome | ⚠ sim | `PortfolioItem("Chrome espelhado").imageUrl` |
| 36 | `portfolio-arco-suave-com-henna.jpg` | portfolio | Arco suave com henna — Design + Henna por Julia Nakamura · estilo: Sobrancelhas,Henna | — | `PortfolioItem("Arco suave com henna").imageUrl` |
| 37 | `portfolio-volume-russo-4d.jpg` | portfolio | Volume russo 4D — Volume russo por Larissa Prado · estilo: Cílios,Volume | — | `PortfolioItem("Volume russo 4D").imageUrl` |
| 38 | `portfolio-glow-natural.jpg` | portfolio | Glow natural — Maquiagem social por Carla Meireles · estilo: Maquiagem,Natural | — | `PortfolioItem("Glow natural").imageUrl` |
| 39 | `portfolio-noiva-classica.jpg` | portfolio | Noiva clássica — Maquiagem para noiva por Sofia Duarte · estilo: Maquiagem,Noiva | — | `PortfolioItem("Noiva clássica").imageUrl` |
| 40 | `portfolio-gel-vermelho-classico.jpg` | portfolio | Gel vermelho clássico — Esmaltação em gel por Ana Ribeiro · estilo: Esmaltação,Clássico | ⚠ sim | `PortfolioItem("Gel vermelho clássico").imageUrl` |
| 41 | `portfolio-linhas-minimalistas.jpg` | portfolio | Linhas minimalistas — Nail Art por Paula Nunes · estilo: Nail Art,Minimalista | ⚠ sim | `PortfolioItem("Linhas minimalistas").imageUrl` |
| 42 | `portfolio-francesinha-invertida.jpg` | portfolio | Francesinha invertida — Esmaltação em gel por Paula Nunes · estilo: Francesinha,Nail Art | ⚠ sim | `PortfolioItem("Francesinha invertida").imageUrl` |
| 43 | `portfolio-rosa-leitoso.jpg` | portfolio | Rosa leitoso — Manicure + Pedicure por Bruna Camargo · estilo: Minimalista,Clássico | ⚠ sim | `PortfolioItem("Rosa leitoso").imageUrl` |
| 44 | `portfolio-laminacao-efeito-volume.jpg` | portfolio | Laminação efeito volume — Brow Lamination por Julia Nakamura · estilo: Sobrancelhas,Laminação | — | `PortfolioItem("Laminação efeito volume").imageUrl` |
| 45 | `portfolio-lash-lifting-natural.jpg` | portfolio | Lash lifting natural — Lash Lifting por Larissa Prado · estilo: Cílios,Natural | — | `PortfolioItem("Lash lifting natural").imageUrl` |
| 46 | `portfolio-olhos-esfumados.jpg` | portfolio | Olhos esfumados — Maquiagem para festa por Carla Meireles · estilo: Maquiagem,Glam,Festa | — | `PortfolioItem("Olhos esfumados").imageUrl` |
| 47 | `portfolio-coque-baixo-e-pele-luminosa.jpg` | portfolio | Coque baixo e pele luminosa — Maquiagem + cabelo por Sofia Duarte · estilo: Maquiagem,Noiva,Cabelo | — | `PortfolioItem("Coque baixo e pele luminosa").imageUrl` |
| 48 | `portfolio-pele-renovada.jpg` | portfolio | Pele renovada — Limpeza de pele por Renata Alves · estilo: Estética,Pele | — | `PortfolioItem("Pele renovada").imageUrl` |
| 49 | `pacote-beauty-day.jpg` | package | Beauty Day — Manicure + Pedicure + Sobrancelha | ⚠ sim | `Package("beauty-day").imageUrl` |
| 50 | `pacote-glow.jpg` | package | Glow — Limpeza facial + Design + Lash Lifting | — | `Package("glow").imageUrl` |
| 51 | `pacote-event-ready.jpg` | package | Event Ready — Manicure + Sobrancelha + Maquiagem | ⚠ sim | `Package("event-ready").imageUrl` |
| 52 | `pacote-bridal-experience.jpg` | package | Bridal Experience — Teste + Maquiagem no dia + Preparação de pele | — | `Package("bridal-experience").imageUrl` |
| 53 | `pacote-bridal-premium.jpg` | package | Bridal Premium — Teste + Maquiagem + Cabelo + Preparação | — | `Package("bridal-premium").imageUrl` |
| 54 | `pacote-nail-package.jpg` | package | Nail Package — 5 manicures | ⚠ sim | `Package("nail-package").imageUrl` |
| 55 | `pacote-brow-package.jpg` | package | Brow Package — 4 designs | — | `Package("brow-package").imageUrl` |
| 56 | `pacote-lash-package.jpg` | package | Lash Package — 3 manutenções | — | `Package("lash-package").imageUrl` |
| 57 | `unidade-centro.jpg` | branch | Interior do Unidade Centro — Consolação, ambiente do estúdio sem pessoas | — | `Branch("centro").imageUrl` |
| 58 | `unidade-jardins.jpg` | branch | Interior do Unidade Jardins — Jardim Paulista, ambiente do estúdio sem pessoas | — | `Branch("jardins").imageUrl` |
| 59 | `inspiracao-1.jpg` | inspiration | Referência salva pela cliente: "Quero algo assim, mas em nude." | — | `InspirationImage[0].imageUrl` |
| 60 | `inspiracao-2.jpg` | inspiration | Referência salva pela cliente: "Referência para o jantar." | — | `InspirationImage[1].imageUrl` |
| 61 | `inspiracao-3.jpg` | inspiration | Referência salva pela cliente: "Pele natural, batom nude rosado." | — | `InspirationImage[2].imageUrl` |
| 62 | `inspiracao-4.jpg` | inspiration | Referência salva pela cliente: "Cabelo preso, mas com movimento." | — | `InspirationImage[3].imageUrl` |
| 63 | `hero-home.jpg` | hero | Ambiente do estúdio, luz natural — imagem principal da Home | — | `DEFAULT_CONTENT.hero.imageUrl (src/lib/brand/config.ts)` |
| 64 | `sobre-estudio.jpg` | service | Detalhe do estúdio para a seção "O estúdio" | — | `DEFAULT_CONTENT.about.imageUrl (src/lib/brand/config.ts)` |
| 65 | `noivas-hero.jpg` | editorial | Produção de noiva — faixa de página inteira em /noivas | — | `src/app/(site)/noivas/page.tsx` |
| 66 | `home-noivas.jpg` | service | Produção de noiva — seção de eventos na Home | — | `src/app/(site)/page.tsx` |
