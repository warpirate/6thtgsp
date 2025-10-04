# System Architecture Documentation

## 🏗️ Quarter Master System Architecture

Complete architectural overview of the Quarter Master Inventory Management System.

---

## 📊 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React SPA]
        B[Service Worker]
        C[LocalStorage]
    end
    
    subgraph "Authentication"
        D[Supabase Auth]
        E[JWT Tokens]
        F[Session Management]
    end
    
    subgraph "API Layer"
        G[Supabase REST API]
        H[Supabase Realtime]
        I[Edge Functions]
    end
    
    subgraph "Database Layer"
        J[PostgreSQL]
        K[Row Level Security]
        L[Triggers & Functions]
    end
    
    subgraph "Storage Layer"
        M[Supabase Storage]
        N[File Buckets]
        O[CDN]
    end
    
    A --> D
    A --> G
    A --> H
    A --> M
    D --> E
    E --> F
    G --> J
    H --> J
    I --> J
    J --> K
    J --> L
    M --> N
    N --> O
```

---

## 🎯 System Components

### 1. Frontend Application (React + Vite)

```mermaid
graph LR
    subgraph "Frontend Stack"
        A[Vite Dev Server]
        B[React 18]
        C[TypeScript]
        D[Tailwind CSS]
        E[React Router]
        F[React Query]
        G[React Hook Form]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
```

**Technologies**:
- **Build Tool**: Vite 5.4 - Fast HMR, optimized builds
- **UI Framework**: React 18 - Component-based architecture
- **Type Safety**: TypeScript 5.2 - Compile-time error checking
- **Styling**: Tailwind CSS 3.4 - Utility-first CSS
- **Routing**: React Router 6 - Client-side routing
- **State Management**: React Query - Server state management
- **Forms**: React Hook Form + Zod - Form validation

**Structure**:
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Sidebar, Header)
│   └── forms/          # Form components
├── pages/              # Route-based pages
├── hooks/              # Custom React hooks
├── lib/                # Configuration & setup
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── styles/             # Global CSS
```

---

### 2. Backend-as-a-Service (Supabase)

```mermaid
graph TD
    subgraph "Supabase Platform"
        A[PostgreSQL Database]
        B[Authentication Service]
        C[Storage Service]
        D[Realtime Service]
        E[Edge Functions]
        F[API Gateway]
    end
    
    F --> A
    F --> B
    F --> C
    F --> D
    F --> E
```

**Services**:

| Service | Purpose | Technology |
|---------|---------|------------|
| **PostgreSQL** | Primary database | PostgreSQL 15 |
| **Auth** | User authentication | GoTrue (JWT) |
| **Storage** | File storage | S3-compatible |
| **Realtime** | Live updates | WebSocket |
| **Edge Functions** | Serverless compute | Deno runtime |

**Configuration**:
```typescript
// Supabase client initialization
const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: { schema: 'public' },
  }
)
```

---

### 3. Database Architecture

```mermaid
erDiagram
    USERS ||--o{ STOCK_RECEIPTS : creates
    USERS ||--o{ APPROVAL_WORKFLOW : approves
    STOCK_RECEIPTS ||--o{ RECEIPT_ITEMS : contains
    STOCK_RECEIPTS ||--o{ DOCUMENTS : has
    STOCK_RECEIPTS ||--o{ APPROVAL_WORKFLOW : tracks
    STOCK_RECEIPTS }o--|| ITEMS_MASTER : references
    USERS ||--o{ AUDIT_LOGS : generates
    
    USERS {
        uuid id PK
        string username UK
        string password_hash
        string full_name
        user_role role
        string email
        boolean is_active
        timestamp created_at
    }
    
    STOCK_RECEIPTS {
        uuid id PK
        string receipt_id UK
        string item_name
        numeric quantity
        string unit
        receipt_status status
        uuid received_by FK
        uuid verified_by FK
        uuid approved_by FK
        timestamp created_at
    }
    
    APPROVAL_WORKFLOW {
        uuid id PK
        uuid receipt_id FK
        uuid approver_id FK
        workflow_action action
        text comments
        timestamp created_at
    }
```

**Key Tables**:
1. **users** - User accounts and profiles
2. **stock_receipts** - Main receipt records
3. **receipt_items** - Line items in receipts
4. **items_master** - Item catalog
5. **documents** - Attached files
6. **approval_workflow** - Approval history
7. **audit_logs** - System activity logs

**Schema Features**:
- ✅ Row-Level Security (RLS) on all tables
- ✅ Triggers for audit logging
- ✅ Enums for type safety
- ✅ Foreign key constraints
- ✅ Indexes for performance

---

### 4. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    participant R as RLS Policies
    
    U->>F: Enter credentials
    F->>A: signInWithPassword()
    A->>A: Validate credentials
    A->>A: Generate JWT token
    A->>F: Return {user, session}
    F->>D: Fetch user profile
    D->>R: Check RLS policies
    R->>D: Return filtered data
    D->>F: User profile + role
    F->>U: Authenticated session
    
    Note over F,D: All subsequent requests include JWT
    
    U->>F: Request protected resource
    F->>D: Query with JWT
    D->>R: Enforce RLS based on role
    R->>D: Filter results
    D->>F: Authorized data only
    F->>U: Display allowed content
```

**Security Layers**:
1. **JWT Tokens**: Secure, stateless authentication
2. **Row-Level Security**: Database-level authorization
3. **Permission Checks**: Component-level access control
4. **Role-Based Routing**: Route-level protection

---

### 5. Data Flow Architecture

```mermaid
graph TD
    A[User Action] --> B{Auth Check}
    B -->|Authenticated| C[Permission Check]
    B -->|Not Authenticated| D[Redirect to Login]
    C -->|Authorized| E[API Request]
    C -->|Not Authorized| F[Show Unauthorized]
    E --> G[Supabase Client]
    G --> H{Request Type}
    H -->|Query| I[PostgreSQL]
    H -->|Mutation| J[PostgreSQL + Trigger]
    H -->|Upload| K[Storage Bucket]
    I --> L[RLS Filter]
    J --> M[Audit Log Trigger]
    L --> N[Return Data]
    M --> N
    N --> O[React Query Cache]
    O --> P[UI Update]
    P --> Q[User Sees Result]
```

**Request Flow**:
1. User initiates action
2. Frontend validates permissions
3. API request sent with JWT
4. Supabase validates token
5. PostgreSQL enforces RLS
6. Data returned to client
7. React Query caches result
8. UI updates reactively

---

## 🔐 Security Architecture

### Defense in Depth Strategy

```mermaid
graph TB
    subgraph "Layer 1: Network"
        A[HTTPS/TLS]
        B[CORS]
        C[Rate Limiting]
    end
    
    subgraph "Layer 2: Authentication"
        D[JWT Tokens]
        E[Password Hashing]
        F[Session Management]
    end
    
    subgraph "Layer 3: Authorization"
        G[RLS Policies]
        H[Permission Checks]
        I[Role Validation]
    end
    
    subgraph "Layer 4: Data"
        J[Input Validation]
        K[SQL Injection Protection]
        L[XSS Prevention]
    end
    
    subgraph "Layer 5: Audit"
        M[Activity Logging]
        N[Change Tracking]
        O[Anomaly Detection]
    end
    
    A --> D
    B --> D
    C --> D
    D --> G
    E --> G
    F --> G
    G --> J
    H --> J
    I --> J
    J --> M
    K --> M
    L --> M
```

**Security Measures**:

| Layer | Implementation | Tool |
|-------|----------------|------|
| **Transport** | TLS 1.3 | Supabase |
| **Authentication** | JWT + bcrypt | Supabase Auth |
| **Authorization** | RLS + RBAC | PostgreSQL + Custom |
| **Input Validation** | Zod schemas | React Hook Form |
| **Output Encoding** | React escaping | React (automatic) |
| **Audit Logging** | Triggers | PostgreSQL |

---

## 📊 State Management Architecture

```mermaid
graph LR
    subgraph "Client State"
        A[React Context]
        B[useState/useReducer]
        C[URL Params]
    end
    
    subgraph "Server State"
        D[React Query Cache]
        E[Optimistic Updates]
        F[Background Refetch]
    end
    
    subgraph "Persistent State"
        G[LocalStorage]
        H[Session Storage]
        I[Cookies]
    end
    
    A --> D
    B --> D
    C --> D
    D --> G
    D --> H
    D --> I
```

**State Categories**:

1. **Authentication State** (React Context)
   - User profile
   - Session info
   - Permissions

2. **Server State** (React Query)
   - Receipts list
   - User data
   - Audit logs

3. **UI State** (Local useState)
   - Modal open/closed
   - Form inputs
   - Sidebar collapsed

4. **URL State** (Search Params)
   - Filters
   - Pagination
   - Sort order

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        A[Local Dev]
        B[Vite HMR]
        C[Supabase Local]
    end
    
    subgraph "CI/CD"
        D[GitHub Actions]
        E[Build]
        F[Test]
        G[Deploy]
    end
    
    subgraph "Production"
        H[Vercel/Netlify]
        I[CDN]
        J[Supabase Cloud]
    end
    
    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
```

**Deployment Strategy**:

| Stage | Platform | Purpose |
|-------|----------|---------|
| **Development** | Local + Supabase | Development environment |
| **Staging** | Vercel Preview | Testing before production |
| **Production** | Vercel/Netlify | Live application |
| **Database** | Supabase Cloud | Managed PostgreSQL |
| **Storage** | Supabase Storage | File hosting |

---

## ⚡ Performance Architecture

### Optimization Strategies

```mermaid
graph TD
    A[User Request] --> B{Cached?}
    B -->|Yes| C[Return from Cache]
    B -->|No| D[Fetch from Server]
    D --> E{Stale While Revalidate}
    E --> F[Show Stale Data]
    E --> G[Fetch Fresh Data]
    G --> H[Update Cache]
    H --> I[Update UI]
    F --> I
    C --> I
```

**Performance Features**:

1. **Code Splitting**: Route-based lazy loading
2. **Caching**: React Query with stale-while-revalidate
3. **Debouncing**: Search input, auto-save
4. **Pagination**: Server-side with page caching
5. **Image Optimization**: Lazy loading, WebP format
6. **Bundle Size**: Tree shaking, minification

**Metrics**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

---

## 🔄 Real-Time Architecture

```mermaid
sequenceDiagram
    participant U as User A
    participant F as Frontend A
    participant R as Realtime Server
    participant D as Database
    participant F2 as Frontend B
    participant U2 as User B
    
    F->>R: Subscribe to channel
    R->>R: Register subscription
    
    U2->>F2: Update receipt
    F2->>D: UPDATE query
    D->>D: Trigger fires
    D->>R: Broadcast change
    R->>F: Push update
    F->>F: Invalidate cache
    F->>D: Refetch data
    D->>F: Fresh data
    F->>U: UI updates automatically
```

**Realtime Features**:
- Live receipt status updates
- Collaborative editing prevention
- Notification delivery
- Approval queue updates

---

## 📦 Module Architecture

```
Quarter Master Application
│
├── Core Modules
│   ├── Authentication
│   ├── Authorization
│   └── Routing
│
├── Feature Modules
│   ├── Receipts
│   │   ├── List
│   │   ├── Create
│   │   └── Detail
│   ├── Approvals
│   ├── Inventory
│   └── Users
│
├── Shared Modules
│   ├── UI Components
│   ├── Forms
│   └── Utils
│
└── Integration Modules
    ├── Supabase Client
    ├── Storage
    └── Analytics
```

---

## 🎯 Design Patterns

### 1. Component Patterns

```typescript
// Container/Presenter Pattern
const ReceiptsContainer = () => {
  const { data, isLoading } = useQuery(['receipts'], fetchReceipts)
  return <ReceiptsList data={data} isLoading={isLoading} />
}

// Compound Components
<Form>
  <Form.Input name="email" />
  <Form.Submit />
</Form>

// Render Props
<DataFetcher
  query={['user']}
  render={(data) => <UserProfile user={data} />}
/>
```

### 2. Hook Patterns

```typescript
// Custom Hook for Data Fetching
const useReceipts = (filters) => {
  return useQuery({
    queryKey: ['receipts', filters],
    queryFn: () => fetchReceipts(filters),
  })
}

// Custom Hook for Permissions
const usePermission = (permission) => {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}
```

### 3. State Management Patterns

```typescript
// Context Provider Pattern
<AuthProvider>
  <App />
</AuthProvider>

// Reducer Pattern
const [state, dispatch] = useReducer(reducer, initialState)
```

---

## 🔗 Integration Architecture

```mermaid
graph LR
    subgraph "External Services"
        A[Email Service]
        B[PDF Generator]
        C[Analytics]
    end
    
    subgraph "Edge Functions"
        D[Send Email]
        E[Generate Report]
        F[Track Event]
    end
    
    subgraph "Application"
        G[Frontend]
    end
    
    G --> D
    G --> E
    G --> F
    D --> A
    E --> B
    F --> C
```

**Integration Points**:
- Email notifications (future)
- PDF generation (future)
- Analytics tracking (future)
- Export functionality

---

## 📊 Scalability Considerations

### Horizontal Scaling

```mermaid
graph TB
    A[Load Balancer] --> B[App Instance 1]
    A --> C[App Instance 2]
    A --> D[App Instance N]
    
    B --> E[Supabase]
    C --> E
    D --> E
    
    E --> F[Primary DB]
    E --> G[Read Replicas]
```

**Scaling Strategy**:
1. **Frontend**: CDN + multiple edge locations
2. **API**: Auto-scaling with Supabase
3. **Database**: Read replicas for queries
4. **Storage**: CDN for files

---

## 🔧 Development Workflow

```mermaid
graph LR
    A[Code] --> B[Lint]
    B --> C[Type Check]
    C --> D[Unit Test]
    D --> E[Build]
    E --> F[Deploy Preview]
    F --> G[E2E Test]
    G --> H[Deploy Production]
```

**Workflow Steps**:
1. Local development with HMR
2. Pre-commit hooks (Husky)
3. CI pipeline (GitHub Actions)
4. Automated testing
5. Preview deployment (Vercel)
6. Production deployment

---

## 📈 Monitoring & Observability

```mermaid
graph TD
    A[Application] --> B[Error Tracking]
    A --> C[Performance Monitoring]
    A --> D[User Analytics]
    
    B --> E[Sentry]
    C --> F[Vercel Analytics]
    D --> G[Custom Dashboard]
    
    E --> H[Alerts]
    F --> H
    G --> H
```

**Monitoring Tools** (Future):
- Error tracking: Sentry
- Performance: Vercel Analytics
- Database: Supabase Dashboard
- Logs: Supabase Logs

---

## 🎓 Technology Decision Matrix

| Requirement | Technology | Rationale |
|-------------|------------|-----------|
| **Fast Development** | Vite | < 100ms HMR |
| **Type Safety** | TypeScript | Compile-time checks |
| **Backend** | Supabase | BaaS, built-in auth/storage |
| **Database** | PostgreSQL | ACID compliance, RLS |
| **UI Framework** | React | Large ecosystem, stable |
| **Styling** | Tailwind | Rapid prototyping |
| **Forms** | React Hook Form | Performance, DX |
| **Data Fetching** | React Query | Caching, optimistic updates |
| **Validation** | Zod | Type-safe schemas |

---

## 🔗 Related Documentation

- [Database Schema](../database-schema.md)
- [Security Guidelines](../security.md)
- [Deployment Guide](../deployment-guide.md)
- [Performance Optimization](../performance/optimization.md)

---

**Last Updated**: 2025-10-04  
**Version**: 1.0.0  
**Maintainer**: Quarter Master Development Team
