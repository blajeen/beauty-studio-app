/**
 * Teste ponta a ponta do agendamento (seção 89).
 *
 * Dirige o navegador como uma cliente faria: entra, escolhe dois serviços com
 * profissionais diferentes, pega um horário, confirma e confere se a reserva
 * apareceu em "meus horários" — depois abre o detalhe e cancela. Também cobre
 * o atalho de primeiro horário disponível e o cronograma reverso de eventos.
 *
 *   npm run build && npm start
 *   npm run e2e
 */
import { existsSync } from 'node:fs';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';

const BASE = process.env.BASE ?? 'http://localhost:3200';
const EMAIL = 'maria@cliente.com';
const PASSWORD = 'lumi1234';

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean) as string[];

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✔ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✖ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const lower = (value: string) => value.toLocaleLowerCase('pt-BR');

/**
 * `innerText` respeita `text-transform`, e os rótulos de seção do design system
 * são versaletes. Comparamos sempre em minúsculas, pelo conteúdo e não pela
 * aparência.
 */
async function textOf(page: Page): Promise<string> {
  return lower(await page.evaluate(() => document.body.innerText));
}

function has(text: string, needle: string): boolean {
  return text.includes(lower(needle));
}

async function waitForText(page: Page, needle: string, timeout = 45_000) {
  await page.waitForFunction(
    (value: string) => document.body.innerText.toLowerCase().includes(value),
    { timeout },
    lower(needle),
  );
}

async function waitUntilGone(page: Page, needle: string, timeout = 45_000) {
  await page.waitForFunction(
    (value: string) => !document.body.innerText.toLowerCase().includes(value),
    { timeout },
    lower(needle),
  );
}

/** Clica no primeiro elemento cujo texto casa — a interface é em português e não tem test-ids. */
async function clickByText(page: Page, selector: string, text: string): Promise<boolean> {
  return page.evaluate(
    (sel, needle) => {
      const target = Array.from(document.querySelectorAll<HTMLElement>(sel)).find((node) =>
        (node.textContent ?? '').includes(needle),
      );
      if (!target) return false;
      target.click();
      return true;
    },
    selector,
    text,
  );
}

/** Passa pela escolha de unidade quando o estúdio tem mais de um endereço. */
async function passBranchStep(page: Page, branch: string) {
  if (!has(await textOf(page), 'Onde você quer ser atendida')) return;
  await clickByText(page, 'button', branch);
  await pause(300);
  await clickByText(page, 'button', 'Continuar');
  await pause(700);
}

async function login(page: Page) {
  // Começa sempre deslogada: o navegador pode ter sessão de uma execução anterior.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.deleteCookie({ name: 'bs_session', url: BASE });
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle2' });
  await page.type('input[name="email"]', EMAIL);
  await page.type('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }),
    page.click('button[type="submit"]'),
  ]);
  check('login da cliente', page.url().includes('/minha-conta'), page.url());
}

async function bookTwoServices(page: Page): Promise<string | null> {
  await page.goto(`${BASE}/agendar`, { waitUntil: 'networkidle2' });

  check('etapa inicial oferece os caminhos', has(await textOf(page), 'Como você quer começar'));
  await clickByText(page, 'button', 'Sei o que quero fazer');
  await pause(600);

  await passBranchStep(page, 'Unidade Centro');

  check('catálogo de serviços aparece', has(await textOf(page), 'O que você quer fazer'));
  check('seleciona manicure', await clickByText(page, 'button', 'Manicure tradicional'));

  await clickByText(page, 'button', 'Sobrancelhas');
  await pause(400);
  check('seleciona design de sobrancelhas', await clickByText(page, 'button', 'Design de sobrancelhas'));
  check('resumo mostra dois serviços', has(await textOf(page), '2 serviços'));

  await clickByText(page, 'button', 'Continuar');
  await pause(700);

  check('etapa de profissionais aparece', has(await textOf(page), 'Com quem'));
  await clickByText(page, 'button', 'Continuar');

  await waitUntilGone(page, 'Procurando horários');
  await pause(700);
  check('grade de horários carregou', has(await textOf(page), 'Escolha o horário'));

  const slotLabel = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) =>
      /^\d{2}:\d{2}$/.test((item.textContent ?? '').trim()),
    ) as HTMLButtonElement | undefined;
    button?.click();
    return button?.textContent?.trim() ?? null;
  });
  check('há horários disponíveis', Boolean(slotLabel));
  if (!slotLabel) return null;

  await pause(600);
  check(
    'roteiro aparece ao escolher o horário',
    has(await textOf(page), 'Seu roteiro'),
    'reserva com vários serviços precisa mostrar a sequência',
  );

  await clickByText(page, 'button', 'Continuar');
  await pause(700);

  const review = await textOf(page);
  check('resumo antes de confirmar', has(review, 'Tudo certo'));
  check('resumo traz o total estimado', has(review, 'Total estimado'));
  check('resumo cita a política de cancelamento', has(review, 'Cancelamentos com menos'));

  await clickByText(page, 'button', 'Confirmar agendamento');
  await waitForText(page, 'Agendamento confirmado');

  const success = await textOf(page);
  check('confirmação exibida', has(success, 'Agendamento confirmado'));

  const code = success.match(/seu código é\s+([a-z0-9]{6})/)?.[1]?.toUpperCase() ?? null;
  check('código de reserva gerado', Boolean(code), success.slice(0, 120));
  console.log(`    horário escolhido: ${slotLabel} · código: ${code}`);
  return code;
}

async function verifyInAccount(page: Page, code: string) {
  await page.goto(`${BASE}/minha-conta/agendamentos`, { waitUntil: 'networkidle2' });
  check('reserva aparece em "meus horários"', has(await textOf(page), code));
}

async function openDetailAndCancel(page: Page, code: string) {
  await page.goto(`${BASE}/minha-conta/agendamentos`, { waitUntil: 'networkidle2' });

  const href = await page.evaluate((needle) => {
    const link = Array.from(document.querySelectorAll('a')).find((anchor) =>
      (anchor.textContent ?? '').includes(needle),
    ) as HTMLAnchorElement | undefined;
    return link?.getAttribute('href') ?? null;
  }, code);

  check('detalhe da reserva é alcançável', Boolean(href));
  if (!href) return;

  await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle2' });
  const detail = await textOf(page);
  check('detalhe mostra o roteiro', has(detail, 'Seu roteiro'));
  check(
    'detalhe oferece remarcar e cancelar',
    has(detail, 'Remarcar') && has(detail, 'Cancelar agendamento'),
  );

  await clickByText(page, 'button', 'Cancelar agendamento');
  await pause(700);
  check('modal de cancelamento abre', has(await textOf(page), 'Motivo'));

  await clickByText(page, 'button', 'Confirmar cancelamento');
  await waitForText(page, 'Cancelado', 30_000);
  check('reserva fica cancelada', has(await textOf(page), 'Cancelado'));
}

async function checkFirstAvailable(page: Page) {
  await page.goto(`${BASE}/agendar?servico=manicure-tradicional`, { waitUntil: 'networkidle2' });
  await pause(600);
  await passBranchStep(page, 'Unidade Centro');

  // Com o serviço já escolhido pela URL, restam as etapas de ajuste até a grade.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (has(await textOf(page), 'Escolha o horário')) break;
    await clickByText(page, 'button', 'Continuar');
    await pause(800);
  }
  await waitUntilGone(page, 'Procurando horários');
  await pause(600);
  check('chega na grade de horários pela URL do serviço', has(await textOf(page), 'Escolha o horário'));

  const clicked = await clickByText(page, 'button', 'Primeiro disponível');
  check('atalho "primeiro disponível" existe', clicked);
  if (!clicked) return;

  await waitForText(page, 'Tudo certo');
  check('primeiro disponível leva direto ao resumo', has(await textOf(page), 'Tudo certo'));
}

async function checkEventFlow(page: Page) {
  await page.goto(`${BASE}/agendar?ocasiao=1&tipo=WEDDING`, { waitUntil: 'networkidle2' });
  await pause(600);
  await passBranchStep(page, 'Unidade Jardins');

  await clickByText(page, 'button', 'Maquiagem');
  await pause(400);
  check('seleciona maquiagem para o evento', await clickByText(page, 'button', 'Maquiagem para festa'));

  await clickByText(page, 'button', 'Continuar');
  await pause(700);
  await clickByText(page, 'button', 'Continuar'); // profissionais
  await pause(800);

  check(
    'etapa de evento pergunta o horário de estar pronta',
    has(await textOf(page), 'Que horas precisa estar pronta'),
  );

  const date = new Date();
  date.setDate(date.getDate() + 30);
  await page.evaluate((value) => {
    const input = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, date.toISOString().slice(0, 10));
  await pause(700);

  const plan = await textOf(page);
  check('cronograma reverso calcula o início', has(plan, 'Início recomendado'));
  check('cronograma soma preparo e serviços', has(plan, 'Preparo') && has(plan, 'Pronta às'));
}

function resolveBrowser(): string {
  const found = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Nenhum navegador encontrado. Use BROWSER_PATH=/caminho/para/chrome');
  return found;
}

async function main() {
  let browser: Browser | null = null;
  try {
    browser = process.env.BROWSER_URL
      ? await puppeteer.connect({ browserURL: process.env.BROWSER_URL })
      : await puppeteer.launch({
          executablePath: resolveBrowser(),
          headless: true,
          args: ['--no-sandbox', '--disable-gpu'],
        });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('\n── acesso ───────────────────────────');
    await login(page);

    console.log('\n── agendamento com dois serviços ───────────────────────────');
    const code = await bookTwoServices(page);

    if (code) {
      console.log('\n── conferência na conta ───────────────────────────');
      await verifyInAccount(page, code);

      console.log('\n── detalhe e cancelamento ───────────────────────────');
      await openDetailAndCancel(page, code);
    }

    console.log('\n── primeiro horário disponível ───────────────────────────');
    await checkFirstAvailable(page);

    console.log('\n── fluxo de evento ───────────────────────────');
    await checkEventFlow(page);

    console.log(`\n${failed === 0 ? '✓' : '✖'} ${passed} verificações passaram, ${failed} falharam\n`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    if (process.env.BROWSER_URL) await browser?.disconnect();
    else await browser?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
