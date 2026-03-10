# iPA API Server - TODO

## Fase 1: Banco de Dados e Autenticação
- [x] Estender schema com tabelas: accounts, vip_plans, packages, keys, devices, udids, sessions
- [x] Criar migrations SQL para todas as tabelas
- [x] Implementar sistema de autenticação admin (admin/admin123)
- [x] Implementar sistema de planos VIP (VIP 1-4 com limites)

## Fase 2: Backend - Autenticação e Usuários
- [x] Criar procedimento de login admin
- [x] Criar procedimento de logout
- [x] Criar procedimento de gerenciamento de usuários (criar, editar, deletar)
- [x] Implementar controle de acesso admin
- [x] Criar sistema de sessões de usuários

## Fase 3: Sistema de Packages
- [x] Criar tabela e procedures para packages
- [x] Implementar criação de package com token único
- [x] Implementar status de package (ativo, pausado, manutenção, travado)
- [x] Implementar limite de 3 packages por usuário
- [x] Criar procedimento para gerar dylib com token embutido
- [x] Implementar upload de dylib para S3

## Fase 4: Sistema de Keys
- [x] Criar tabela e procedures para keys
- [x] Implementar criação de keys com alias (máximo 3)
- [x] Implementar tipos de duração (1 dia, 1 semana, 1 mês, 1 ano)
- [x] Implementar ativação de key
- [x] Implementar pausa, reset, ban, exclusão e adição de tempo
- [x] Implementar validação de keys por package

## Fase 5: Sistema de Devices/UDID
- [x] Criar tabela e procedures para devices e UDIDs
- [x] Implementar registro de UDID
- [x] Implementar status online/offline de dispositivos
- [x] Implementar controle de sessões de dispositivos
- [x] Implementar limpeza de sessões

## Fase 6: Geração de Dylib
- [x] Criar template de dylib (simulado)
- [x] Implementar geração automática com token embutido
- [x] Implementar upload para S3
- [x] Implementar histórico de versões

## Fase 7: Frontend - Dashboard e Layout
- [x] Criar DashboardLayout com sidebar
- [x] Implementar navegação principal
- [x] Criar página de login com branding Ruan Dev
- [x] Implementar autenticação frontend

## Fase 8: Frontend - Gerenciamento de Packages
- [x] Criar página de packages
- [x] Implementar CRUD de packages
- [x] Implementar controle de status
- [x] Implementar download de dylib

## Fase 9: Frontend - Gerenciamento de Keys
- [x] Criar página de keys
- [x] Implementar CRUD de keys
- [x] Implementar criação com alias
- [x] Implementar controle de duração

## Fase 10: Frontend - Gerenciamento de Devices
- [x] Criar página de devices
- [x] Implementar visualização de UDIDs
- [x] Implementar status online/offline
- [x] Implementar controle de sessões

## Fase 11: Frontend - Dashboard e Analytics
- [x] Criar dashboard com estatísticas
- [x] Implementar contadores (keys, packages, devices, etc)
- [x] Implementar gráficos de atividade

## Fase 12: Frontend - Perfil e Configurações
- [x] Criar página de perfil
- [x] Implementar troca de idioma (PT-BR/EN)
- [x] Implementar visualização de sessões
- [x] Implementar troca de senha

## Fase 13: Testes e Integração
- [x] Escrever testes vitest para backend
- [x] Testar fluxo completo
- [ ] Validar segurança
- [ ] Preparar para deploy

## Fase 14: Deploy e Entrega
- [ ] Criar checkpoint final
- [ ] Preparar para deploy na Vercel
- [ ] Entregar ao usuário
