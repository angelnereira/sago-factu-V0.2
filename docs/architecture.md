# Arquitectura del Sistema SAGO-FACTU

## Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App - Next.js]
        MOBILE[Mobile - Progressive Web App]
    end
    
    subgraph "API Layer - Next.js App Router"
        API[/api Routes]
        SA[Server Actions]
        MW[Middleware - Auth & Multi-Tenant]
    end
    
    subgraph "Business Logic Layer"
        AUTH[Auth Service]
        FOLIO[Folio Management]
        INVOICE[Invoice Processing]
        HKA_CLIENT[HKA SOAP Client]
    end
    
    subgraph "Data Layer"
        PRISMA[(Prisma ORM)]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis - Queue)]
    end
    
    subgraph "External Services"
        HKA[The Factory HKA SOAP API]
        S3[AWS S3 Storage]
        EMAIL[Email Service]
    end
    
    subgraph "Background Processing"
        QUEUE[BullMQ Queue]
        WORKERS[Queue Workers]
    end
    
    WEB --> API
    WEB --> SA
    MOBILE --> API
    
    API --> MW
    SA --> MW
    MW --> AUTH
    MW --> FOLIO
    MW --> INVOICE
    
    AUTH --> PRISMA
    FOLIO --> PRISMA
    INVOICE --> PRISMA
    INVOICE --> HKA_CLIENT
    
    HKA_CLIENT --> QUEUE
    QUEUE --> WORKERS
    WORKERS --> HKA
    
    PRISMA --> POSTGRES
    QUEUE --> REDIS
    
    INVOICE --> S3
    INVOICE --> EMAIL
    
    HKA -.respuesta.-> WORKERS
    WORKERS -.actualizar.-> PRISMA
```

## Flujo de Emisión de Factura

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Next.js UI
    participant SA as Server Action
    participant DB as Prisma/PostgreSQL
    participant Q as BullMQ Queue
    participant W as Worker
    participant HKA as The Factory HKA
    participant S3 as AWS S3
    
    U->>UI: Llenar formulario factura
    UI->>SA: Enviar datos
    SA->>SA: Validar con Zod
    SA->>DB: Verificar folios disponibles
    
    alt Sin folios
        DB-->>SA: Error: Sin folios
        SA-->>UI: Mostrar error
        UI-->>U: "No hay folios disponibles"
    else Con folios
        SA->>DB: Crear invoice (status: QUEUED)
        SA->>Q: Agregar job a cola
        SA-->>UI: Success
        UI-->>U: "Factura en proceso"
        
        Q->>W: Procesar job
        W->>W: Generar XML FEL
        W->>HKA: SOAP: Enviar(xml)
        
        alt Éxito HKA
            HKA-->>W: CUFE + XML certificado
            W->>DB: Update (status: CERTIFIED)
            W->>DB: Consumir folio
            W->>S3: Guardar XML/PDF
            W->>DB: Actualizar URLs
            W->>DB: Crear notificación
            W-->>U: Email: Factura certificada
        else Error HKA
            HKA-->>W: Error + mensaje
            W->>DB: Update (status: REJECTED/ERROR)
            W->>DB: Crear notificación
            W-->>U: Email: Error en factura
        end
    end
```

## Modelo de Datos Multi-Tenant

```mermaid
erDiagram
    User ||--o{ OrganizationMember : belongs
    Organization ||--o{ OrganizationMember : has
    Organization ||--o{ Folio : owns
    Organization ||--o{ Invoice : creates
    User ||--o{ Invoice : creates
    Invoice ||--o| Folio : uses
    Invoice ||--o{ InvoiceItem : contains
    User ||--o{ Notification : receives
    Invoice ||--o{ Notification : triggers
    Organization ||--o| OrganizationSettings : configures
    
    User {
        string id PK
        string email UK
        string name
        string password
        enum role
        string organizationId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Organization {
        string id PK
        string name
        string ruc UK
        string email
        string phone
        string address
        int totalFolios
        int usedFolios
        int availableFolios
        string hkaClientId
        string hkaClientSecret
        enum hkaEnvironment
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    OrganizationMember {
        string id PK
        string organizationId FK
        string userId FK
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Folio {
        string id PK
        string organizationId FK
        string folioNumber UK
        enum status
        datetime createdAt
        datetime usedAt
        json hkaResponse
        string hkaError
    }
    
    Invoice {
        string id PK
        string organizationId FK
        string userId FK
        string invoiceNumber
        string customerName
        string customerRuc
        string customerEmail
        string customerPhone
        decimal subtotal
        decimal tax
        decimal total
        string currency
        enum status
        datetime createdAt
        datetime updatedAt
        datetime issuedAt
        string folioId FK
        string cufe UK
        json hkaResponse
        string hkaError
        string xmlUrl
        string pdfUrl
    }
    
    InvoiceItem {
        string id PK
        string invoiceId FK
        string description
        decimal quantity
        decimal unitPrice
        decimal total
    }
    
    Notification {
        string id PK
        string userId FK
        string invoiceId FK
        enum type
        string title
        string message
        boolean isRead
        datetime createdAt
    }
    
    OrganizationSettings {
        string id PK
        string organizationId FK
        string theme
        string timezone
        string currency
        string language
        string invoicePrefix
        int invoiceNumber
        boolean autoNumbering
        string emailFromName
        string emailFromAddress
        boolean hkaTestMode
    }
```

## Flujo de Autenticación Multi-Tenant

```mermaid
sequenceDiagram
    participant U as Usuario
    participant MW as Middleware
    participant AUTH as NextAuth
    participant DB as Database
    participant UI as Dashboard
    
    U->>MW: Acceder a /dashboard
    MW->>AUTH: Verificar sesión
    AUTH->>DB: Consultar usuario + organización
    DB-->>AUTH: Datos del usuario
    AUTH-->>MW: Sesión válida + organizationId
    MW->>MW: Agregar header x-organization-id
    MW->>UI: Renderizar dashboard
    UI->>DB: Consultas filtradas por organizationId
    DB-->>UI: Datos de la organización
    UI-->>U: Dashboard personalizado
```

## Arquitectura de Colas y Workers

```mermaid
graph LR
    subgraph "Application Layer"
        API[API Endpoints]
        SA[Server Actions]
    end
    
    subgraph "Queue System"
        QUEUE[BullMQ Queue]
        REDIS[(Redis)]
    end
    
    subgraph "Worker Processes"
        W1[Invoice Worker]
        W2[Email Worker]
        W3[Cleanup Worker]
    end
    
    subgraph "External Services"
        HKA[HKA SOAP API]
        S3[AWS S3]
        EMAIL[Email Service]
    end
    
    API --> QUEUE
    SA --> QUEUE
    QUEUE --> REDIS
    QUEUE --> W1
    QUEUE --> W2
    QUEUE --> W3
    
    W1 --> HKA
    W1 --> S3
    W2 --> EMAIL
    W3 --> S3
```

## Patrones de Seguridad Multi-Tenant

```mermaid
graph TD
    subgraph "Request Flow"
        REQ[HTTP Request]
        MW[Middleware]
        AUTH[Authentication]
        TENANT[Tenant Resolution]
        PERM[Permission Check]
        API[API Handler]
    end
    
    subgraph "Data Isolation"
        ORG[Organization Context]
        FILTER[Data Filtering]
        QUERY[Prisma Query]
        DB[(Database)]
    end
    
    REQ --> MW
    MW --> AUTH
    AUTH --> TENANT
    TENANT --> PERM
    PERM --> API
    
    API --> ORG
    ORG --> FILTER
    FILTER --> QUERY
    QUERY --> DB
    
    subgraph "Security Layers"
        JWT[JWT Validation]
        ROLE[Role-based Access]
        ORG_CHECK[Organization Check]
        ROW_LEVEL[Row-level Security]
    end
    
    AUTH --> JWT
    PERM --> ROLE
    TENANT --> ORG_CHECK
    FILTER --> ROW_LEVEL
```
