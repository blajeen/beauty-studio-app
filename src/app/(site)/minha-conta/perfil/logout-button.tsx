'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/states';
import { logout } from '@/app/(auth)/actions';

export function LogoutButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      onClick={() => start(() => {
        void logout();
      })}
      disabled={pending}
    >
      {pending ? <Spinner /> : <LogOut size={15} />}
      Sair
    </Button>
  );
}
