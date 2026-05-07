# SkyReserve - Plataforma de Gestão de Aviação

## Visão Geral

**SkyReserve** é uma plataforma premium de reserva de voos que oferece uma experiência elegante e intuitiva para clientes e um painel administrativo robusto para gerenciamento de voos, aeronaves e assentos. O sistema integra lógica de alocação de assentos implementada em Python/C para garantir performance e confiabilidade.

## Arquitetura do Sistema

### Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Banco de Dados**: MySQL/TiDB com Drizzle ORM
- **Autenticação**: Manus OAuth
- **Lógica de Assentos**: Python (seat_allocator.py) - pronto para integração C via ctypes/CFFI

### Estrutura de Diretórios

```
gestao-aviacao/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── Home.tsx        # Página inicial
│   │   │   ├── FlightSearch.tsx # Busca de voos
│   │   │   ├── SeatSelection.tsx # Seleção de assentos
│   │   │   ├── BookingConfirmation.tsx # Confirmação
│   │   │   ├── MyBookings.tsx  # Histórico de reservas
│   │   │   └── admin/          # Painel administrativo
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Flights.tsx
│   │   │       └── Aircraft.tsx
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilitários
│   │   └── App.tsx             # Roteamento principal
│   └── public/                 # Arquivos estáticos
├── server/                     # Backend Express + tRPC
│   ├── routers.ts              # Procedures tRPC
│   ├── db.ts                   # Query helpers
│   ├── seat_allocator.py       # Lógica de assentos
│   ├── *.test.ts               # Testes unitários
│   └── _core/                  # Framework interno
├── drizzle/                    # Schema e migrations
│   └── schema.ts               # Definição de tabelas
├── shared/                     # Código compartilhado
└── todo.md                     # Rastreamento de tarefas
```

## Banco de Dados

### Schema Principal

#### `users`
- `id` (PK): Identificador único
- `openId` (UNIQUE): ID do OAuth
- `name`, `email`, `loginMethod`: Dados do usuário
- `role`: 'user' | 'admin'
- `createdAt`, `updatedAt`, `lastSignedIn`: Timestamps

#### `aircraft`
- `id` (PK): Identificador único
- `name`, `manufacturer`: Informações da aeronave
- `totalSeats`: Número total de assentos
- `seatConfiguration`: JSON com layout (rows, seatsPerRow, layout)

#### `flights`
- `id` (PK): Identificador único
- `flightNumber` (UNIQUE): Código do voo (ex: TP123)
- `aircraftId` (FK): Referência à aeronave
- `origin`, `destination`: Códigos IATA (ex: LIS, NYC)
- `departureTime`, `arrivalTime`: Horários
- `pricePerSeat`: Preço em centavos (€)
- `status`: 'scheduled' | 'boarding' | 'departed' | 'cancelled'

#### `seats`
- `id` (PK): Identificador único
- `flightId` (FK): Referência ao voo
- `seatNumber`: Código visual (ex: 12A)
- `row`, `column`: Posição na aeronave
- `status`: 'available' | 'occupied' | 'reserved'
- `seatClass`: 'economy' | 'business' | 'first'

#### `bookings`
- `id` (PK): Identificador único
- `bookingCode` (UNIQUE): Código de reserva (ex: BK123456)
- `userId` (FK): Referência ao usuário
- `flightId` (FK): Referência ao voo
- `seatId` (FK): Referência ao assento
- `passengerName`, `passengerEmail`: Dados do passageiro
- `totalPrice`: Preço total em centavos
- `status`: 'confirmed' | 'cancelled' | 'completed'
- `bookingDate`, `cancellationDate`: Timestamps

## API tRPC

### Procedures Públicas

#### `flights.search`
Busca voos disponíveis por origem, destino e data.

```typescript
Input: { origin: string, destination: string, departureDate: string }
Output: Flight[] com availableSeats
```

#### `flights.getById`
Obtém detalhes completos de um voo.

```typescript
Input: { flightId: number }
Output: Flight com availableSeats e totalSeats
```

#### `seats.getFlightSeats`
Lista todos os assentos de um voo com status.

```typescript
Input: { flightId: number }
Output: Seat[]
```

#### `seats.getAvailability`
Retorna estatísticas de ocupação de um voo.

```typescript
Input: { flightId: number }
Output: { available, occupied, reserved, total, occupancyRate }
```

### Procedures Protegidas (Autenticados)

#### `bookings.create`
Cria uma nova reserva para o usuário autenticado.

```typescript
Input: { flightId, seatId, passengerName, passengerEmail }
Output: { bookingCode, message }
```

#### `bookings.list`
Lista todas as reservas do usuário autenticado.

```typescript
Output: Booking[] com informações de voo
```

#### `bookings.getByCode`
Obtém detalhes de uma reserva específica.

```typescript
Input: { bookingCode: string }
Output: Booking com detalhes do voo
```

#### `bookings.cancel`
Cancela uma reserva e libera o assento.

```typescript
Input: { bookingId: number }
Output: { success: true, message }
```

### Procedures Admin (role === 'admin')

#### `flights.list`
Lista todos os voos cadastrados.

```typescript
Output: Flight[]
```

#### `flights.create`
Cria um novo voo e seus assentos.

```typescript
Input: { flightNumber, aircraftId, origin, destination, departureTime, arrivalTime, pricePerSeat }
Output: { flightId, message }
```

#### `flights.updateStatus`
Atualiza o status de um voo.

```typescript
Input: { flightId, status: 'scheduled' | 'boarding' | 'departed' | 'cancelled' }
Output: { success: true }
```

#### `aircraft.list`
Lista todas as aeronaves cadastradas.

```typescript
Output: Aircraft[]
```

#### `aircraft.create`
Cria uma nova aeronave.

```typescript
Input: { name, manufacturer, totalSeats, rows, seatsPerRow }
Output: { success: true, message }
```

#### `admin.getDashboardStats`
Retorna estatísticas globais do sistema.

```typescript
Output: { totalFlights, totalBookings, totalRevenue, flightStats[] }
```

#### `admin.getFlightStats`
Retorna estatísticas detalhadas de um voo.

```typescript
Input: { flightId: number }
Output: { flight, seats, bookings, revenue }
```

## Portal do Cliente

### Fluxo de Reserva

1. **Página Inicial (Home.tsx)**
   - Formulário de busca: origem, destino, data
   - Apresentação de features principais
   - Links para login e painel admin (se autenticado)

2. **Busca de Voos (FlightSearch.tsx)**
   - Listagem de voos disponíveis
   - Informações: número, horários, duração, preço
   - Assentos disponíveis em tempo real
   - Botão "Selecionar" para cada voo

3. **Seleção de Assentos (SeatSelection.tsx)**
   - Mapa interativo da aeronave
   - Cores: verde (disponível), azul (selecionado), laranja (reservado), vermelho (ocupado)
   - Formulário: nome do passageiro, email
   - Resumo da reserva com preço total
   - Botão "Confirmar Reserva"

4. **Confirmação (BookingConfirmation.tsx)**
   - Código de reserva em destaque
   - Detalhes do passageiro
   - Informações do voo e assento
   - Preço total
   - Botões: Imprimir, Ver Minhas Reservas, Voltar

5. **Histórico de Reservas (MyBookings.tsx)**
   - Lista de todas as reservas do usuário
   - Status: Confirmada, Cancelada, Completa
   - Botões: Detalhes, Cancelar (se confirmada)
   - Confirmação antes de cancelamento

### Autenticação

- Login via Manus OAuth
- Sessão persistente com cookies
- Redirecionamento automático para login em rotas protegidas
- Logout com limpeza de sessão

## Painel Administrativo

### Acesso

- Apenas usuários com `role === 'admin'`
- Proteção de rotas no frontend
- Validação no backend (protectedProcedure com verificação de role)

### Dashboard (AdminDashboard.tsx)

- **Cards de Métricas**:
  - Total de Voos
  - Total de Reservas
  - Receita Total

- **Tabela de Estatísticas por Voo**:
  - Número do voo
  - Quantidade de reservas
  - Receita gerada

### Gestão de Voos (AdminFlights.tsx)

- **Listagem**:
  - Número, rota, saída, preço, status
  - Filtros e ordenação

- **Criar Novo Voo**:
  - Formulário com campos: número, aeronave, origem, destino, horários, preço
  - Validação de entrada
  - Criação automática de assentos baseada na configuração da aeronave

- **Editar Status**:
  - Dropdown para mudar status (agendado, embarque, partiu, cancelado)

### Gestão de Aeronaves (AdminAircraft.tsx)

- **Listagem**:
  - Nome, fabricante, total de assentos

- **Criar Nova Aeronave**:
  - Formulário: nome, fabricante, fileiras, assentos por fileira
  - Cálculo automático de total de assentos

## Integração com C/Python

### Módulo seat_allocator.py

O arquivo `server/seat_allocator.py` implementa a lógica de alocação de assentos em Python puro, pronto para ser adaptado para integração com C via ctypes ou CFFI.

#### Funcionalidades Principais

```python
class SeatAllocator:
    def initialize_seats(aircraft_id, total_seats, rows, seats_per_row) -> bool
    def count_available_seats() -> int
    def find_available_seat(seat_class) -> Optional[int]
    def reserve_seat(seat_id) -> bool
    def release_seat(seat_id) -> bool
    def occupy_seat(seat_id) -> bool
    def calculate_occupancy_stats() -> Tuple[available, occupied, reserved]
    def find_best_seat(seat_class, seats_per_row) -> Optional[int]
    def get_seat_map() -> List[Dict]
```

#### Integração com C (Próxima Etapa)

Para compilar a biblioteca C:

```bash
gcc -fPIC -shared -o server/c_modules/libseat_allocator.so server/c_modules/seat_allocator.c
```

Usar com ctypes:

```python
import ctypes
lib = ctypes.CDLL('./server/c_modules/libseat_allocator.so')
result = lib.reserve_seat(flight_id, seat_id)
```

## Testes

### Testes Unitários (Vitest)

Localização: `server/*.test.ts`

Cobertura:
- `auth.logout.test.ts`: Teste de logout
- `flights.test.ts`: Testes de procedures de voos, assentos e reservas

Executar testes:

```bash
pnpm test
```

Resultado esperado: Todos os testes passam (10+ testes)

## Estilo Visual

### Design Premium

- **Paleta de Cores**:
  - Azul primário: #2563eb (confiança, profissionalismo)
  - Verde: #16a34a (sucesso, disponibilidade)
  - Laranja: #ea580c (alerta, reservado)
  - Vermelho: #dc2626 (erro, ocupado)
  - Cinza neutro: #64748b a #f1f5f9

- **Tipografia**:
  - Fonte: Inter (via Tailwind)
  - Tamanhos: 12px (small) a 32px (heading)
  - Pesos: 400 (regular), 600 (semibold), 700 (bold)

- **Componentes**:
  - Cards com sombras suaves
  - Botões com hover states
  - Inputs com borders refinados
  - Tabelas com alternância de linhas
  - Modais e confirmações

- **Responsividade**:
  - Mobile-first design
  - Breakpoints: sm (640px), md (768px), lg (1024px)
  - Layouts adaptativos

## Deployment

### Requisitos

- Node.js 22+
- pnpm 10+
- MySQL 8+
- Variáveis de ambiente (OAuth, banco de dados, etc.)

### Build e Start

```bash
# Instalar dependências
pnpm install

# Build para produção
pnpm build

# Iniciar servidor
pnpm start
```

### Variáveis de Ambiente

Configuradas automaticamente pelo Manus:
- `DATABASE_URL`: Conexão MySQL
- `JWT_SECRET`: Chave de sessão
- `VITE_APP_ID`: ID OAuth
- `OAUTH_SERVER_URL`: URL do servidor OAuth
- Outras: `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, etc.

## Performance

- **Frontend**: Carregamento lazy de rotas, otimização de componentes
- **Backend**: Queries otimizadas com índices, caching de dados
- **Banco de Dados**: Índices em chaves primárias e estrangeiras
- **Assentos**: Alocação eficiente com algoritmo de busca otimizado

## Segurança

- **Autenticação**: OAuth via Manus
- **Autorização**: Verificação de role em procedures admin
- **Validação**: Schemas Zod em todas as entradas
- **HTTPS**: Enforced em produção
- **Cookies**: HttpOnly, Secure, SameSite

## Fluxos Principais

### Fluxo de Reserva (Cliente)

1. Usuário acessa home
2. Busca voos (origem, destino, data)
3. Seleciona voo da lista
4. Escolhe assento no mapa
5. Preenche dados do passageiro
6. Confirma reserva
7. Recebe código de reserva
8. Pode imprimir ou ver histórico

### Fluxo de Cancelamento (Cliente)

1. Acessa "Minhas Reservas"
2. Seleciona reserva confirmada
3. Clica "Cancelar"
4. Confirma ação
5. Assento é liberado
6. Reserva muda para "Cancelada"

### Fluxo de Gestão de Voos (Admin)

1. Acessa painel admin
2. Vai para "Gestão de Voos"
3. Cria novo voo (número, aeronave, rota, horários, preço)
4. Assentos são criados automaticamente
5. Pode atualizar status do voo
6. Visualiza estatísticas em tempo real

## Próximas Melhorias

- [ ] Integração real com biblioteca C compilada
- [ ] Gráficos avançados no dashboard
- [ ] Notificações por email
- [ ] Sistema de pagamento
- [ ] Relatórios em PDF
- [ ] Atualização em tempo real com WebSockets
- [ ] Suporte multilíngue
- [ ] Mobile app nativa

## Suporte e Contato

Para questões técnicas ou sugestões, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.

---

**Versão**: 1.0.0  
**Data**: Maio de 2026  
**Desenvolvido com**: React, Express, tRPC, MySQL, Tailwind CSS
