/**
 * Captura de telas para revisão visual (seção 89: mobile e desktop).
 *
 * Usa o navegador já instalado na máquina — não baixa Chromium. Faz login de
 * verdade pelo formulário, então as telas internas saem no estado real.
 *
 *   npm run build && npm start
 *   npm run shots
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';

const BASE = process.env.BASE ?? 'http://localhost:3200';
const OUT = process.env.SHOTS_DIR ?? join(process.cwd(), '.shots');
const PASSWORD = 'lumi1234';

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean) as string[];

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const MOBILE = { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

type Shot = { name: string; path: string; mobile?: boolean; full?: boolean; wait?: number };

const PUBLIC_SHOTS: Shot[] = [
  { name: '01-home', path: '/', full: true },
  { name: '02-home-mobile', path: '/', mobile: true },
  { name: '03-servicos', path: '/servicos' },
  { name: '04-categoria-unhas', path: '/servicos/unhas' },
  { name: '05-profissionais', path: '/profissionais' },
  { name: '06-portfolio', path: '/portfolio' },
  { name: '07-noivas', path: '/noivas' },
  { name: '08-beauty-club', path: '/beauty-club' },
  { name: '09-pacotes', path: '/pacotes' },
  { name: '10-agendar', path: '/agendar' },
  { name: '11-agendar-mobile', path: '/agendar', mobile: true },
  { name: '12-entrar', path: '/entrar' },
];

const ROLE_SHOTS: { email: string; shots: Shot[] }[] = [
  {
    email: 'maria@cliente.com',
    shots: [
      { name: '20-minha-conta', path: '/minha-conta', full: true },
      { name: '21-meus-horarios', path: '/minha-conta/agendamentos' },
      { name: '22-historico', path: '/minha-conta/historico' },
      { name: '23-minha-conta-mobile', path: '/minha-conta', mobile: true },
    ],
  },
  {
    email: 'ana@lumi.studio',
    shots: [
      { name: '30-pro-hoje', path: '/pro', full: true },
      { name: '31-pro-agenda', path: '/pro/agenda' },
      { name: '32-pro-clientes', path: '/pro/clientes' },
      { name: '33-pro-hoje-mobile', path: '/pro', mobile: true },
    ],
  },
  {
    email: 'dona@lumi.studio',
    shots: [
      { name: '40-dashboard', path: '/admin', full: true },
      { name: '41-agenda', path: '/admin/agenda' },
      { name: '42-clientes', path: '/admin/clientes' },
      { name: '43-servicos-precos', path: '/admin/servicos' },
      { name: '44-retencao', path: '/admin/retencao' },
      { name: '45-programas', path: '/admin/programas' },
    ],
  },
  {
    email: 'produto@lumi.studio',
    shots: [
      { name: '50-studio', path: '/studio', full: true },
      { name: '51-studio-marca', path: '/studio/marca', full: true },
      { name: '52-studio-conteudo', path: '/studio/conteudo' },
    ],
  },
];

function resolveBrowser(): string {
  const found = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      'Nenhum navegador encontrado. Informe o caminho em BROWSER_PATH=/caminho/para/chrome',
    );
  }
  return found;
}

async function capture(page: Page, shot: Shot) {
  await page.setViewport(shot.mobile ? MOBILE : DESKTOP);
  await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle2', timeout: 60_000 });
  // Dá tempo para as animações de entrada assentarem antes do clique do obturador.
  await new Promise((resolve) => setTimeout(resolve, shot.wait ?? 900));
  await page.screenshot({
    path: join(OUT, `${shot.name}.png`) as `${string}.png`,
    fullPage: shot.full ?? false,
  });
  console.log(`  ✔ ${shot.name}`);
}

async function login(page: Page, email: string) {
  await page.setViewport(DESKTOP);
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle2' });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function logout(page: Page) {
  await page.goto(`${BASE}/minha-conta/perfil`, { waitUntil: 'domcontentloaded' });
  await page.deleteCookie({ name: 'bs_session', url: BASE });
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  let browser: Browser | null = null;
  try {
    /*
     * Alguns navegadores instalados pelo sistema (Edge no Windows, por exemplo)
     * recusam o modo "launch" do Puppeteer. Nesses casos o script se conecta a
     * uma instância já aberta com --remote-debugging-port.
     */
    browser = process.env.BROWSER_URL
      ? await puppeteer.connect({ browserURL: process.env.BROWSER_URL })
      : await puppeteer.launch({
          executablePath: resolveBrowser(),
          headless: true,
          userDataDir: join(OUT, '.browser-profile'),
          args: [
            '--no-sandbox',
            '--disable-gpu',
            '--hide-scrollbars',
            '--no-first-run',
            '--no-default-browser-check',
          ],
        });

    const page = await browser.newPage();

    console.log('\n── públicas ───────────────────────────');
    for (const shot of PUBLIC_SHOTS) await capture(page, shot);

    for (const role of ROLE_SHOTS) {
      console.log(`\n── ${role.email} ───────────────────────────`);
      await logout(page);
      await login(page, role.email);
      for (const shot of role.shots) await capture(page, shot);
    }

    console.log(`\n✓ imagens em ${OUT}\n`);
  } finally {
    if (process.env.BROWSER_URL) await browser?.disconnect();
    else await browser?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
