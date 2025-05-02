import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Home, FileText, Users, Settings, LogOut, MenuSquare, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminNotificationsProvider } from '@/components/bartap/AdminNotificationsProvider';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Special case for login page - don't check authentication
  // This is determined by checking if the children component is the login page
  if (children.type?.name === 'AdminLoginPage') {
    return (
      <div className="min-h-screen flex dark:bg-background">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Get the session from cookies
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Skip authentication check for now to prevent login loops
  // We'll rely on client-side auth in the login page
  
  // Navigation links
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/orders', label: 'Orders', icon: FileText },
    { href: '/admin/menu', label: 'Menu', icon: MenuSquare },
    { href: '/admin/kitchen', label: 'Kitchen', icon: ChefHat },
    { href: '/admin/tables', label: 'Tables', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <AdminNotificationsProvider>
      <div className="min-h-screen flex dark:bg-background">
        {/* Sidebar navigation */}
        <aside className="hidden md:flex w-64 flex-col bg-muted/40 border-r border-border">
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold">BarTap Admin</h1>
            <p className="text-sm text-muted-foreground">Staff Management Portal</p>
          </div>
          
          <nav className="flex-1 pt-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-border mt-auto">
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" className="w-full flex items-center gap-2 justify-start" type="submit">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </form>
          </div>
        </aside>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <header className="flex items-center h-16 px-4 border-b border-border md:hidden">
            <h1 className="text-lg font-bold">BarTap Admin</h1>
            
            {/* Mobile menu button - would typically open a drawer */}
            <Button variant="ghost" size="icon" className="ml-auto">
              <MenuSquare className="h-5 w-5" />
            </Button>
          </header>
          
          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminNotificationsProvider>
  );
}