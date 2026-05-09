import { Navbar, MobileNav } from './Navbar';

interface AppShellProps {
  children: React.ReactNode;
  fullScreen?: boolean;
}

export function AppShell({ children, fullScreen }: AppShellProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background overflow-hidden">
      <Navbar />
      <main className={`flex-1 relative overflow-hidden ${fullScreen ? 'pt-14' : 'pt-14 pb-16 md:pb-0'}`}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
