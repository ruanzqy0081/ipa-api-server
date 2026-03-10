import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, Key, Smartphone, Zap } from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<any>(null);

  const meQuery = trpc.auth.me.useQuery();
  const packagesQuery = trpc.packages.list.useQuery();
  const devicesQuery = trpc.devices.list.useQuery();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (!meQuery.isLoading && !meQuery.data) {
      navigate("/login");
    }
  }, [meQuery.data, navigate]);

  const stats = [
    {
      title: "Packages",
      value: packagesQuery.data?.length || 0,
      icon: Package,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Dispositivos",
      value: devicesQuery.data?.length || 0,
      icon: Smartphone,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "VIP Level",
      value: user?.vipLevel?.toUpperCase() || "FREE",
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Packages", path: "/packages", icon: "📦" },
    { label: "Keys", path: "/keys", icon: "🔑" },
    { label: "Dispositivos", path: "/devices", icon: "📱" },
    { label: "Perfil", path: "/profile", icon: "👤" },
  ];

  if (meQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo, {user?.name || user?.username}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Detalhes do seu perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Usuário</p>
                <p className="font-semibold text-white">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="font-semibold text-white">{user?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Plano VIP</p>
                <p className="font-semibold text-white">{user?.vipLevel?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Idioma</p>
                <p className="font-semibold text-white">
                  {user?.language === "pt-BR" ? "Português (BR)" : "English"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
