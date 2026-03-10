import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Copy, Download, Pause, Play, Lock, Trash2, Loader2 } from "lucide-react";

export default function Packages() {
  const [newPackageName, setNewPackageName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const packagesQuery = trpc.packages.list.useQuery();
  const createPackageMutation = trpc.packages.create.useMutation();
  const updatePackageMutation = trpc.packages.update.useMutation();
  const deletePackageMutation = trpc.packages.delete.useMutation();
  const generateDylibMutation = trpc.dylib.generate.useMutation();

  const handleCreatePackage = async () => {
    if (!newPackageName.trim()) {
      toast.error("Nome do package é obrigatório");
      return;
    }

    setIsCreating(true);
    try {
      await createPackageMutation.mutateAsync({ name: newPackageName });
      toast.success("Package criado com sucesso");
      setNewPackageName("");
      packagesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar package");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await updatePackageMutation.mutateAsync({
        id,
        status: newStatus as any,
      });
      toast.success("Package atualizado");
      packagesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar package");
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este package?")) return;

    try {
      await deletePackageMutation.mutateAsync({ id });
      toast.success("Package deletado");
      packagesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar package");
    }
  };

  const handleGenerateDylib = async (id: number) => {
    try {
      await generateDylibMutation.mutateAsync({ packageId: id });
      toast.success("Dylib gerada com sucesso");
      packagesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao gerar dylib");
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400";
      case "maintenance":
        return "bg-blue-500/10 text-blue-400";
      case "locked":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Packages</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus packages e tokens
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="mr-2 h-4 w-4" />
                Novo Package
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Novo Package</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Digite o nome do seu novo package
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do package"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={handleCreatePackage}
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Package"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {packagesQuery.isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando packages...</p>
          </div>
        ) : packagesQuery.data?.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">Nenhum package criado ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {packagesQuery.data?.map((pkg) => (
              <Card key={pkg.id} className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{pkg.name}</CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        Token: {pkg.token.substring(0, 16)}...
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.status)}`}>
                      {pkg.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-slate-700/50 p-3 rounded">
                      <code className="text-sm text-cyan-400 flex-1 break-all">{pkg.token}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToken(pkg.token)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {pkg.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(pkg.id, "paused")}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(pkg.id, "maintenance")}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            Manutenção
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(pkg.id, "locked")}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            Travar
                          </Button>
                        </>
                      )}

                      {pkg.status !== "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(pkg.id, "active")}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Ativar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDylib(pkg.id)}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Gerar Dylib
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePackage(pkg.id)}
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
