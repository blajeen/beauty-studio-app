import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, CalendarPlus, Gift, Images, RotateCcw, Sparkles } from 'lucide-react';
import { requireCustomer } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import {
  getCustomerBenefits,
  getCustomerFavorites,
  getCustomerNotifications,
  getRecurrenceSuggestions,
  getUpcomingAppointments,
} from '@/lib/data/customer';
import { formatDayDistance, formatRelativeDay, formatTime } from '@/lib/datetime';
import { formatCurrency, percent, pluralize } from '@/lib/utils';
import { Avatar, Badge, Button, Card, DataRow } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { AppointmentCard } from '@/components/cards';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function AccountPage() {
  const user = await requireCustomer();
  const brand = await getBrand();

  const [upcoming, recurrence, benefits, favorites, notifications] = await Promise.all([
    getUpcomingAppointments(user.customerId, 3),
    getRecurrenceSuggestions(user.customerId),
    getCustomerBenefits(user.customerId),
    getCustomerFavorites(user.customerId),
    getCustomerNotifications(user.customerId, 4),
  ]);

  const next = upcoming[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-10">
        <section>
          <h2 className="font-display text-2xl">Seu próximo horário</h2>
          <div className="mt-5">
            {next ? (
              <AppointmentCard
                appointment={next}
                href={`/minha-conta/agendamentos/${next.id}`}
                action={
                  <span className="text-[12.5px] text-muted">
                    {formatDayDistance(next.startAt)} · toque para ver detalhes e remarcar
                  </span>
                }
              />
            ) : (
              <EmptyState
                compact
                icon={<CalendarPlus size={20} />}
                title="Nenhum horário marcado"
                description="Escolha o que quer fazer e reserve em menos de um minuto."
                action={<Button href="/agendar">Agendar horário</Button>}
              />
            )}
          </div>
          {upcoming.length > 1 ? (
            <div className="mt-4 space-y-3">
              {upcoming.slice(1).map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  href={`/minha-conta/agendamentos/${appointment.id}`}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* RECORRÊNCIA — o motivo pelo qual a cliente volta sem ser lembrada por WhatsApp. */}
        {recurrence.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl">Está chegando a hora</h2>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Sugestões a partir do intervalo de cada serviço e da sua última visita.
            </p>
            <div className="mt-5 space-y-3">
              {recurrence.map((item) => (
                <Card key={item.serviceId} className="flex flex-wrap items-center gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink">
                    <RotateCcw size={17} strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{item.serviceName}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      Sua última vez foi {formatDayDistance(item.lastAt)}
                      {item.professional ? ` com ${item.professional.displayName}` : ''} · intervalo
                      sugerido de {item.intervalDays} dias
                    </p>
                  </div>
                  <Button
                    href={`/agendar?servico=${item.serviceSlug}${item.professional ? `&profissional=${item.professional.id}` : ''}`}
                    size="sm"
                    variant={item.dueIn <= 0 ? 'primary' : 'secondary'}
                  >
                    {item.dueIn <= 0 ? 'Agendar agora' : 'Agendar'}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {favorites.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl">Seus favoritos</h2>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Com quem você mais se atende — e o que costuma fazer.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {favorites.map((favorite) => (
                <Link
                  key={favorite.professional.id}
                  href={`/agendar?profissional=${favorite.professional.id}`}
                >
                  <Card className="flex items-center gap-4 p-4 transition-colors hover:border-ink/25">
                    <Avatar
                      name={favorite.professional.displayName}
                      src={favorite.professional.avatarUrl}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-medium">
                        {favorite.professional.displayName}
                      </p>
                      <p className="truncate text-[12.5px] text-muted">
                        {favorite.topService} · {pluralize(favorite.count, 'atendimento', 'atendimentos')}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-6">
        <Card className="p-5">
          <p className="eyebrow mb-4">Atalhos</p>
          <div className="space-y-2">
            <Shortcut href="/agendar" icon={<CalendarPlus size={16} />} label="Agendar horário" />
            {brand.features.inspiration ? (
              <Shortcut
                href="/minha-conta/inspiracoes"
                icon={<Images size={16} />}
                label="Minhas inspirações"
              />
            ) : null}
            <Shortcut
              href="/minha-conta/historico"
              icon={<Sparkles size={16} />}
              label="Ficha e histórico"
            />
            {brand.features.beautyClub ? (
              <Shortcut href="/beauty-club" icon={<Gift size={16} />} label="Beauty Club" />
            ) : null}
          </div>
        </Card>

        {benefits.packages.length > 0 ? (
          <Card className="p-5">
            <p className="eyebrow mb-4">Seus pacotes</p>
            <div className="space-y-5">
              {benefits.packages.map((item) => {
                const used = item.usedSessions;
                const total = item.totalSessions;
                return (
                  <div key={item.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[14px] font-medium">{item.package.name}</p>
                      <span className="text-[12.5px] text-muted">
                        {used}/{total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-soft">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-700"
                        style={{ width: `${percent(used, total)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] text-muted">
                      {total - used} restantes · válido até{' '}
                      {item.expiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
            <Button href="/minha-conta/pacotes" variant="link" className="mt-4 text-[13px]">
              Ver detalhes
            </Button>
          </Card>
        ) : null}

        {benefits.subscriptions.map((subscription) => (
          <Card key={subscription.id} className="bg-secondary p-5 text-white">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Beauty Club</p>
            <p className="mt-2 font-display text-2xl">{subscription.plan.name}</p>
            <p className="mt-1 text-[12.5px] text-white/55">
              {formatCurrency(subscription.plan.monthlyPrice)}/mês · ciclo até{' '}
              {subscription.cycleEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </p>
            <dl className="mt-4 border-t border-white/15 pt-3">
              {subscription.plan.items.map((item) => {
                const used = subscription.usages.filter(
                  (usage) => usage.serviceId === item.serviceId,
                ).length;
                return (
                  <div key={item.id} className="flex justify-between py-1 text-[13px]">
                    <dt className="text-white/70">{item.service.name}</dt>
                    <dd className="text-white/90">
                      {used}/{item.quantityPerCycle}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        ))}

        {notifications.length > 0 ? (
          <Card className="p-5">
            <p className="eyebrow mb-4 flex items-center gap-2">
              <Bell size={13} />
              Avisos
            </p>
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <p className="text-[13.5px] font-medium">{notification.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                    {notification.body}
                  </p>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="mt-1 inline-block text-[12.5px] underline underline-offset-4"
                    >
                      Ver
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function Shortcut({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors hover:bg-primary-soft"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}
