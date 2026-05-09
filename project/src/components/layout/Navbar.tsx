import { Link, useLocation } from 'react-router-dom';
import { Map, AlertTriangle, FileWarning, LayoutDashboard, Settings, User, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { useAlertStore, useUserStore } from '@/stores';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/map', label: 'Map', icon: Map },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/report', label: 'Report', icon: FileWarning },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Map className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">REAS</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-alert-critical text-[10px] font-bold text-foreground">
              {unreadCount}
            </span>
          )}
        </button>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none">
                <Avatar className="h-8 w-8 ring-1 ring-border">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                  <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold leading-none">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{user?.karmaPoints} pts</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth/login" className="hidden md:flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm py-2">
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-xs transition-colors',
            pathname === item.path ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
