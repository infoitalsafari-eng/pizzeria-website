import { useAuthStore } from '@/store/authStore';
import { User, MapPin, Clock, Bell, Globe, LogOut } from 'lucide-react';

const ProfileView = () => {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: MapPin, label: 'Mes adresses', action: () => {} },
    { icon: Clock, label: 'Historique des commandes', action: () => {} },
    { icon: Bell, label: 'Notifications', action: () => {}, toggle: true },
    { icon: Globe, label: 'Langue', action: () => {}, value: 'Français' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Avatar & Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{user?.name || 'Utilisateur'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || 'user@email.com'}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="glass-card divide-y divide-border">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground text-sm font-medium">{item.label}</span>
            </div>
            {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
            {item.toggle && (
              <div className="w-10 h-6 bg-primary rounded-full relative">
                <div className="w-4 h-4 bg-primary-foreground rounded-full absolute right-1 top-1" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 border border-destructive/30 text-destructive rounded-xl font-medium hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Déconnexion
      </button>
    </div>
  );
};

export default ProfileView;
