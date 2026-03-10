import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export default function Profile() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const meQuery = trpc.auth.me.useQuery();
  const updateLanguageMutation = trpc.auth.updateLanguage.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const devicesQuery = trpc.devices.listSessions.useQuery();
  const clearSessionsMutation = trpc.devices.clearAllSessions.useMutation();

  const handleChangeLanguage = async (language: "pt-BR" | "en") => {
    try {
      await updateLanguageMutation.mutateAsync({ language });
      toast.success("Idioma atualizado");
      meQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar idioma");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar senha");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearSessions = async () => {
    if (!confirm("Tem certeza que deseja deslogar de todos os dispositivos?")) return;

    try {
      await clearSessionsMutation.mutateAsync();
      toast.success("Todas as sessões foram encerradas");
      devicesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao encerrar sessões");
    }
  };

  if (meQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas configurações e preferências
          </p>
        </div>

        {/* Informações da Conta */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Usuário</label>
              <p className="text-white font-semibold">{meQuery.data?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Nome</label>
              <p className="text-white font-semibold">{meQuery.data?.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Email</label>
              <p className="text-white font-semibold">{meQuery.data?.email || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Plano VIP</label>
              <p className="text-white font-semibold">{meQuery.data?.vipLevel?.toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferências */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Customize sua experiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Idioma</label>
              <Select
                value={meQuery.data?.language || "pt-BR"}
                onValueChange={(value) => handleChangeLanguage(value as "pt-BR" | "en")}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="pt-BR" className="text-white">
                    Português (Brasil)
                  </SelectItem>
                  <SelectItem value="en" className="text-white">
                    English
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Atualize sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Senha Atual</label>
              <Input
                type="password"
                placeholder="Digite sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Nova Senha</label>
              <Input
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                className="bg-slate-700 border-slate-600 text-white mt-1"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sessões Ativas */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Sessões Ativas</CardTitle>
            <CardDescription>
              {devicesQuery.data?.length || 0} dispositivo(s) conectado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devicesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : devicesQuery.data?.length === 0 ? (
              <p className="text-slate-400">Nenhuma sessão ativa</p>
            ) : (
              <>
                <div className="space-y-2">
                  {devicesQuery.data?.map((session) => (
                    <div key={session.id} className="p-3 bg-slate-700/50 rounded">
                      <p className="text-sm text-slate-300">
                        IP: {session.ipAddress || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Criada: {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-red-600/50 hover:bg-red-500/10 text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Encerrar Todas as Sessões
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Encerrar Todas as Sessões</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Você será desconectado de todos os dispositivos. Você precisará fazer login novamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-600 hover:bg-slate-700"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleClearSessions}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Encerrar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
