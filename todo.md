# Gestão de Aviação - TODO

## Fase 1: Estrutura de Banco de Dados
- [x] Definir schema de tabelas (flights, aircraft, seats, bookings, users)
- [x] Gerar e aplicar migrations SQL
- [x] Criar helpers de query no server/db.ts

## Fase 2: Backend e Integração C
- [x] Criar módulo C para lógica de alocação de assentos (seat_allocator.c)
- [x] Implementar wrapper Python com ctypes/CFFI (seat_allocator.py)
- [x] Criar procedures tRPC para voos (listar, criar, atualizar)
- [x] Criar procedures tRPC para assentos (disponibilidade, reserva)
- [x] Criar procedures tRPC para reservas (criar, cancelar, listar)
- [x] Implementar autenticação e autorização (admin vs cliente)

## Fase 3: Portal do Cliente
- [x] Página de pesquisa de voos (origem, destino, data)
- [x] Listagem de resultados com filtros
- [x] Página de seleção de assentos (mapa interativo)
- [x] Fluxo de confirmação de reserva
- [x] Geração e exibição de bilhete com código de reserva
- [x] Página de histórico de reservas
- [x] Funcionalidade de cancelamento de reserva

## Fase 4: Painel Administrativo
- [x] Layout do painel admin com sidebar (DashboardLayout)
- [x] Página de gestão de voos (CRUD)
- [x] Página de gestão de aeronaves
- [x] Proteção de rotas admin (apenas admin)

## Fase 5: Dashboard Administrativo
- [x] Estatísticas de ocupação por voo
- [x] Gráficos de receita e reservas
- [x] Relatório de voos e assentos disponíveis
- [x] Visualização de dados em tempo real

## Fase 6: Refinamento e Entrega
- [x] Testes de fluxo completo (cliente e admin)
- [x] Refinamento visual e UX
- [x] Validação de performance
- [x] Documentação final
- [x] Checkpoint e entrega
