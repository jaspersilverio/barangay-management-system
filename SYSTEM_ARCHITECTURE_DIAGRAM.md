# System Architecture Diagrams

## 🏗️ **Overall System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BARANGAY MANAGEMENT SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   React Client  │◄─────────────────►│  Laravel API    │
│   (Frontend)    │    REST API      │   (Backend)     │
│                 │                  │                 │
│ • TypeScript    │                  │ • PHP 8.2       │
│ • Bootstrap     │                  │ • Sanctum Auth  │
│ • React Query   │                  │ • Eloquent ORM  │
│ • Leaflet Maps  │                  │ • Form Requests │
│ • Recharts      │                  │ • Middleware    │
└─────────────────┘                  └─────────────────┘
                                              │
                                              │ SQL
                                              ▼
                                    ┌─────────────────┐
                                    │    Database     │
                                    │                 │
                                    │ • SQLite/MySQL  │
                                    │ • 28 Tables     │
                                    │ • Relationships │
                                    │ • Audit Logs    │
                                    └─────────────────┘
```

## 🔐 **Authentication & Authorization Flow**

```
┌─────────────┐    Login Request    ┌─────────────┐
│    User     │────────────────────►│   Laravel   │
│             │                     │   Backend   │
└─────────────┘                     └─────────────┘
                                             │
                                             │ Validate
                                             ▼
                                    ┌─────────────┐
                                    │   Database  │
                                    │   (Users)   │
                                    └─────────────┘
                                             │
                                             │ JWT Token
                                             ▼
┌─────────────┐    Token Response   ┌─────────────┐
│    User     │◄───────────────────│   Laravel   │
│             │                     │   Backend   │
└─────────────┘                     └─────────────┘
        │
        │ Store Token
        ▼
┌─────────────┐
│ localStorage│
│   (Token)   │
└─────────────┘
```

## 👥 **User Roles & Permissions**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ROLE HIERARCHY                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│    ADMIN    │ ──► Full System Access
│             │     • User Management
│             │     • All Puroks
│             │     • System Settings
└─────────────┘

┌─────────────┐
│PUROK LEADER │ ──► Assigned Purok Only
│             │     • Manage Residents
│             │     • Manage Households
│             │     • View Reports
└─────────────┘

┌─────────────┐
│   STAFF     │ ──► General Operations
│             │     • Add Residents
│             │     • Manage Blotters
│             │     • Generate Reports
└─────────────┘

┌─────────────┐
│   VIEWER    │ ──► Read-Only Access
│             │     • View Data
│             │     • Generate Reports
│             │     • No Modifications
└─────────────┘
```

## 📊 **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW PROCESS                     │
└─────────────────────────────────────────────────────────────┘

User Action ──► Frontend Validation ──► API Request ──► Backend Processing
     │                │                      │                │
     ▼                ▼                      ▼                ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  React  │    │ TypeScript  │    │   Laravel   │    │  Database   │
│Component│    │ Validation  │    │ Middleware  │    │ Operations  │
└─────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                │                      │                │
     ▼                ▼                      ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│              Response & State Management                    │
│  • React Query Cache Update                                │
│  • UI State Synchronization                                │
│  • Error Handling & Display                                │
│  • Audit Logging                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ **Database Schema Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐    1:N    ┌─────────────┐    1:N    ┌─────────────┐
│   PUROKS    │◄──────────│ HOUSEHOLDS  │◄──────────│  RESIDENTS  │
│             │           │             │           │             │
│ • id        │           │ • id        │           │ • id        │
│ • name      │           │ • purok_id  │           │ • household_id│
│ • description│          │ • head_name │           │ • first_name │
└─────────────┘           │ • address   │           │ • last_name  │
                          │ • contact   │           │ • birthdate  │
                          └─────────────┘           │ • civil_status│
                                   │                └─────────────┘
                                   │                         │
                                   ▼                         ▼
                          ┌─────────────┐           ┌─────────────┐
                          │   BLOTTERS  │           │VACCINATIONS │
                          │             │           │             │
                          │ • id        │           │ • id        │
                          │ • household_id│         │ • resident_id│
                          │ • incident  │           │ • vaccine   │
                          │ • status    │           │ • date      │
                          └─────────────┘           └─────────────┘

┌─────────────┐    1:N    ┌─────────────┐
│    USERS    │◄──────────│ AUDIT_LOGS  │
│             │           │             │
│ • id        │           │ • id        │
│ • name      │           │ • user_id   │
│ • email     │           │ • action    │
│ • role      │           │ • model_type│
│ • assigned_purok_id│    │ • changes   │
└─────────────┘           └─────────────┘
```

## 🔄 **API Request/Response Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    API INTERACTION FLOW                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐    HTTP Request    ┌─────────────┐
│   React     │───────────────────►│   Laravel   │
│ Component   │    (with JWT)      │   Router    │
└─────────────┘                    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │ Middleware  │
                                    │ • Auth      │
                                    │ • Role      │
                                    │ • CORS      │
                                    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │ Controller  │
                                    │ • Validation│
                                    │ • Business  │
                                    │   Logic     │
                                    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │   Model     │
                                    │ • Eloquent  │
                                    │ • Database  │
                                    │   Queries   │
                                    └─────────────┘
                                             │
                                             ▼
┌─────────────┐    JSON Response   ┌─────────────┐
│   React     │◄───────────────────│   Laravel   │
│ Component   │    (with Data)     │ Controller  │
└─────────────┘                    └─────────────┘
        │
        ▼
┌─────────────┐
│ React Query │
│ • Cache     │
│ • Update UI │
│ • Error     │
│   Handling  │
└─────────────┘
```

## 🧪 **Testing Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING STRATEGY                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UNIT      │    │INTEGRATION  │    │     E2E     │
│   TESTS     │    │   TESTS     │    │   TESTS     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ • Components│    │ • API       │    │ • User      │
│ • Functions │    │   Endpoints │    │   Workflows │
│ • Models    │    │ • Database  │    │ • Cross-    │
│ • Utils     │    │   Queries   │    │   Browser   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEST COVERAGE                           │
│  • Frontend: Jest + React Testing Library                  │
│  • Backend: PHPUnit + Feature Tests                        │
│  • API: Postman + Newman Automation                        │
│  • Database: Migration + Seeder Tests                      │
│  • Security: Penetration Testing                           │
└─────────────────────────────────────────────────────────────┘
```

## 📱 **Frontend Component Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                REACT COMPONENT HIERARCHY                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      App.tsx                               │
│  • QueryClient Provider                                    │
│  • Auth Context                                           │
│  • Theme Context                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AppLayout.tsx                           │
│  • Navigation Sidebar                                      │
│  • Header with User Info                                   │
│  • Main Content Area                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Page Components                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Dashboard   │ │ Residents   │ │ Households  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Blotters    │ │ Reports     │ │ Settings    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Shared Components                         │
│  • Form Modals (Add/Edit)                                  │
│  • Data Tables with Pagination                             │
│  • Loading Skeletons                                       │
│  • Error Boundaries                                        │
│  • Charts and Visualizations                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 **Security Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND SECURITY                       │
│  • Input Validation (Zod)                                  │
│  • XSS Protection (React)                                  │
│  • CSRF Protection (Axios)                                 │
│  • Secure Token Storage                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK SECURITY                        │
│  • HTTPS Encryption                                        │
│  • CORS Configuration                                      │
│  • Rate Limiting                                           │
│  • Request Validation                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SECURITY                        │
│  • JWT Authentication (Sanctum)                            │
│  • Role-based Access Control                               │
│  • SQL Injection Protection (Eloquent)                     │
│  • Input Sanitization                                      │
│  • Audit Logging                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SECURITY                       │
│  • Encrypted Connections                                   │
│  • Foreign Key Constraints                                 │
│  • Soft Deletes                                            │
│  • Backup & Recovery                                       │
└─────────────────────────────────────────────────────────────┘
```
