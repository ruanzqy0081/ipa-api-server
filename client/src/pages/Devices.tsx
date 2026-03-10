import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Smartphone, Wifi, WifiOff, Loader2 } from "lucide-react";

export default function Devices() {
  const devicesQuery = trpc.devices.list.useQuery();

  const getStatusColor = (status: string) => {
    return status === "online"
      ? "bg-green-500/10 text-green-400"
      : "bg-slate-500/10 text-slate-400";
  };

  const getStatusIcon = (status: string) => {
    return status === "online" ? (
      <Wifi className="h-4 w-4 text-green-400" />
    ) : (
      <WifiOff className="h-4 w-4 text-slate-400" />
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dispositivos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus dispositivos registrados
          </p>
        </div>

        {devicesQuery.isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando dispositivos...</p>
          </div>
        ) : devicesQuery.data?.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-slate-400 mb-4 opacity-50" />
              <p className="text-slate-400">Nenhum dispositivo registrado</p>
              <p className="text-sm text-slate-500 mt-2">
                Dispositivos serão registrados quando você usar a IPA
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {devicesQuery.data?.map((device) => (
              <Card key={device.id} className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-blue-400" />
                      <div>
                        <CardTitle className="text-white">
                          {device.deviceName || "Dispositivo Desconhecido"}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-mono text-xs">
                          UDID: {device.udid}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device.status)}
                      <Badge className={getStatusColor(device.status)}>
                        {device.status === "online" ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Registrado em</p>
                      <p className="text-white font-semibold">
                        {new Date(device.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Último acesso</p>
                      <p className="text-white font-semibold">
                        {new Date(device.lastSeen).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações Gerais */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-400">Total de Dispositivos</p>
              <p className="text-2xl font-bold text-white">{devicesQuery.data?.length || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Dispositivos Online</p>
              <p className="text-2xl font-bold text-green-400">
                {devicesQuery.data?.filter((d) => d.status === "online").length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
