import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Copy, Pause, Play, Ban, Trash2, Loader2, Clock } from "lucide-react";

export default function Keys() {
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [newKeyAlias, setNewKeyAlias] = useState("");
  const [newKeyDuration, setNewKeyDuration] = useState<"1day" | "1week" | "1month" | "1year">("1month");
  const [isCreating, setIsCreating] = useState(false);

  const packagesQuery = trpc.packages.list.useQuery();
  const keysQuery = trpc.keys.listByPackage.useQuery(
    { packageId: selectedPackageId || 0 },
    { enabled: !!selectedPackageId }
  );

  const createKeyMutation = trpc.keys.create.useMutation();
  const pauseKeyMutation = trpc.keys.pause.useMutation();
  const resetKeyMutation = trpc.keys.reset.useMutation();
  const banKeyMutation = trpc.keys.ban.useMutation();
  const deleteKeyMutation = trpc.keys.delete.useMutation();
  const addTimeMutation = trpc.keys.addTime.useMutation();

  const handleCreateKey = async () => {
    if (!selectedPackageId) {
      toast.error("Selecione um package");
      return;
    }

    setIsCreating(true);
    try {
      await createKeyMutation.mutateAsync({
        packageId: selectedPackageId,
        duration: newKeyDuration,
        alias: newKeyAlias || undefined,
      });
      toast.success("Key criada com sucesso");
      setNewKeyAlias("");
      keysQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    toast.success("Key copiada!");
  };

  const handlePauseKey = async (keyId: number) => {
    try {
      await pauseKeyMutation.mutateAsync({ keyId });
      toast.success("Key pausada");
      keysQuery.refetch();
    } catch (error) {
      toast.error("Erro ao pausar key");
    }
  };

  const handleResetKey = async (keyId: number) => {
    if (!confirm("Tem certeza que deseja resetar esta key?")) return;
    try {
      await resetKeyMutation.mutateAsync({ keyId });
      toast.success("Key resetada");
      keysQuery.refetch();
    } catch (error) {
      toast.error("Erro ao resetar key");
    }
  };

  const handleBanKey = async (keyId: number) => {
    if (!confirm("Tem certeza que deseja banir esta key?")) return;
    try {
      await banKeyMutation.mutateAsync({ keyId });
      toast.success("Key banida");
      keysQuery.refetch();
    } catch (error) {
      toast.error("Erro ao banir key");
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta key?")) return;
    try {
      await deleteKeyMutation.mutateAsync({ keyId });
      toast.success("Key deletada");
      keysQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar key");
    }
  };

  const handleAddTime = async (keyId: number) => {
    try {
      await addTimeMutation.mutateAsync({
        keyId,
        duration: "1month",
      });
      toast.success("Tempo adicionado");
      keysQuery.refetch();
    } catch (error) {
      toast.error("Erro ao adicionar tempo");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400";
      case "banned":
        return "bg-red-500/10 text-red-400";
      case "expired":
        return "bg-slate-500/10 text-slate-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      "1day": "1 Dia",
      "1week": "1 Semana",
      "1month": "1 Mês",
      "1year": "1 Ano",
    };
    return labels[duration] || duration;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Keys</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas keys de acesso
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="mr-2 h-4 w-4" />
                Nova Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Nova Key</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Configure os detalhes da sua nova key
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Package</label>
                  <Select value={selectedPackageId?.toString()} onValueChange={(v) => setSelectedPackageId(parseInt(v))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione um package" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {packagesQuery.data?.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()} className="text-white">
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Alias (Opcional)</label>
                  <Input
                    placeholder="Ex: FFH4X"
                    value={newKeyAlias}
                    onChange={(e) => setNewKeyAlias(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Duração</label>
                  <Select value={newKeyDuration} onValueChange={(v) => setNewKeyDuration(v as any)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="1day" className="text-white">1 Dia</SelectItem>
                      <SelectItem value="1week" className="text-white">1 Semana</SelectItem>
                      <SelectItem value="1month" className="text-white">1 Mês</SelectItem>
                      <SelectItem value="1year" className="text-white">1 Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateKey}
                  disabled={isCreating || !selectedPackageId}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Key"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {packagesQuery.data?.map((pkg) => (
            <Card
              key={pkg.id}
              className={`border-slate-700 cursor-pointer transition-all ${
                selectedPackageId === pkg.id
                  ? "bg-blue-500/10 border-blue-500"
                  : "bg-slate-800/50 hover:bg-slate-800"
              }`}
              onClick={() => setSelectedPackageId(pkg.id)}
            >
              <CardContent className="pt-6">
                <p className="font-semibold text-white">{pkg.name}</p>
                <p className="text-sm text-slate-400 mt-1">{pkg.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!selectedPackageId ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">Selecione um package para ver suas keys</p>
            </CardContent>
          </Card>
        ) : keysQuery.isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando keys...</p>
          </div>
        ) : keysQuery.data?.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">Nenhuma key criada para este package</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {keysQuery.data?.map((key) => (
              <Card key={key.id} className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white font-mono text-sm">{key.keyCode}</CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        Duração: {getDurationLabel(key.duration)}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(key.status)}`}>
                      {key.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-slate-700/50 p-2 rounded">
                      <code className="text-xs text-cyan-400 flex-1 break-all">{key.keyCode}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(key.keyCode)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {key.activatedAt && key.expiresAt && (
                      <div className="text-xs text-slate-400">
                        <p>Ativada: {new Date(key.activatedAt).toLocaleDateString()}</p>
                        <p>Expira: {new Date(key.expiresAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {key.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseKey(key.id)}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanKey(key.id)}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Banir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTime(key.id)}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            +1 Mês
                          </Button>
                        </>
                      )}

                      {key.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetKey(key.id)}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Ativar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="border-red-600/50 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
