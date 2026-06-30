# Core System Files for Manuscript Documentation

**System:** Barangay Management System  
**Stack:** React + TypeScript + Laravel + MySQL  
**Purpose:** Chapter 4 — Source Code Documentation, System Architecture, and Technical Flow

This document identifies **core files only** for nine major modules. Backend architecture is described **once** in Section 2 to avoid repetition. Module-specific backend mappings appear in Section 3.

**Excluded from scope:** Announcements, Notifications, Events, styling files, and non-critical utilities.

---

# SECTION 1 — FRONTEND MODULE FLOWS

Each module follows the same client-side pattern: a React page renders the UI, calls a service file, and sends HTTP requests to a Laravel API endpoint.

---

## AUTHENTICATION

### Frontend Files

* **Main page:** `client/src/pages/Login.tsx`
* **Important components:**
  * `client/src/context/AuthContext.tsx`
  * `client/src/routes/ProtectedRoute.tsx`
* **Service/API file:**
  * `client/src/services/auth.service.ts`
  * `client/src/services/api.ts`

### Frontend Flow

```text
Login.tsx
↓
auth.service.ts → api.ts
↓
POST /auth/login  |  GET /auth/me
```

### Purpose

Handles user sign-in, session validation, and role-based access before entering protected pages. Successful login stores a Sanctum token used on all subsequent API calls.

---

## RESIDENTS

### Frontend Files

* **Main page:**
  * `client/src/pages/residents/ResidentListPage.tsx`
  * `client/src/pages/residents/ResidentProfilePage.tsx`
  * `client/src/pages/residents/RegisterResidentPage.tsx`
* **Important components:** `client/src/components/residents/ResidentFormModal.tsx`
* **Service/API file:** `client/src/services/residents.service.ts`

### Frontend Flow

```text
ResidentListPage / ResidentProfilePage / RegisterResidentPage
↓
residents.service.ts
↓
GET | POST | PUT | DELETE  /residents
```

### Purpose

Manages barangay resident records—registration, profile viewing, search, purok filtering, and linking residents to households.

---

## HOUSEHOLDS

### Frontend Files

* **Main page:**
  * `client/src/pages/households/HouseholdListPage.tsx`
  * `client/src/pages/households/HouseholdDetailsPage.tsx`
  * `client/src/pages/households/RegisterHouseholdPage.tsx`
* **Important components:**
  * `client/src/components/households/HouseholdFormModal.tsx`
  * `client/src/components/households/ViewResidentsModal.tsx`
* **Service/API file:** `client/src/services/households.service.ts`

### Frontend Flow

```text
HouseholdListPage / HouseholdDetailsPage / RegisterHouseholdPage
↓
households.service.ts
↓
GET | POST | PUT | DELETE  /households
```

### Purpose

Registers and maintains household units, assigns purok and household head, and displays members linked to each household.

---

## SKETCH MAP

### Frontend Files

* **Main page:** `client/src/pages/SketchMap.tsx`
* **Important components:**
  * `client/src/components/map/MapSearch.tsx`
  * `client/src/components/map/MarkerLayerGroup.tsx`
  * `client/src/components/map/HouseholdAssignmentModal.tsx`
  * `client/src/components/map/AssignPurokModal.tsx`
  * `client/src/components/map/PurokInfoModal.tsx`
* **Service/API file:**
  * `client/src/services/map.service.ts`
  * `client/src/services/purokBoundary.service.ts`
  * `client/src/services/search.service.ts`

### Frontend Flow

```text
SketchMap.tsx
↓
map.service.ts | purokBoundary.service.ts | search.service.ts
↓
/map/markers  |  /purok-boundaries  |  /search/households-residents
```

### Purpose

Visualizes the barangay sketch map—places household markers, draws purok boundaries, assigns households to map points, and searches residents or households on the canvas.

---

## CERTIFICATES

### Frontend Files

* **Main page:** `client/src/pages/Certificates.tsx`
* **Important components:**
  * `client/src/components/certificates/CertificateRequests.tsx`
  * `client/src/components/certificates/IssuedCertificates.tsx`
  * `client/src/components/certificates/CertificateStatistics.tsx`
* **Service/API file:**
  * `client/src/services/certificate.service.ts`
  * `client/src/services/pdf.service.ts`

### Frontend Flow

```text
Certificates.tsx
↓
certificate.service.ts | pdf.service.ts
↓
/certificate-requests  |  /issued-certificates  |  /certificates/{id}/download
```

### Purpose

Processes certificate requests from submission through approval and release, stores issued certificates, and generates downloadable PDF documents.

---

## APPROVAL CENTER

### Frontend Files

* **Main page:** `client/src/pages/ApprovalCenter.tsx`
* **Important components:** *(unified UI in page; approval actions handled inline)*
* **Service/API file:**
  * `client/src/services/approval-queue.service.ts`
  * `client/src/services/certificate.service.ts`
  * `client/src/services/blotter.service.ts`

### Frontend Flow

```text
ApprovalCenter.tsx
↓
approval-queue.service.ts (+ module-specific services for approve/reject)
↓
GET /approval-queue  |  POST /certificate-requests/{id}/approve  |  POST /blotters/{id}/approve
```

### Purpose

Provides a single workspace where the barangay captain or admin reviews and approves or rejects pending certificate requests and blotter entries.

---

## BLOTTER

### Frontend Files

* **Main page:** `client/src/pages/BlotterPage.tsx`
* **Important components:**
  * `client/src/components/blotter/AddBlotterModal.tsx`
  * `client/src/components/blotter/EditBlotterModal.tsx`
  * `client/src/components/blotter/ViewBlotterModal.tsx`
* **Service/API file:** `client/src/services/blotter.service.ts`

### Frontend Flow

```text
BlotterPage.tsx
↓
blotter.service.ts
↓
GET | POST | PUT | DELETE  /blotters
```

### Purpose

Records complaints and blotter cases, tracks status from pending to approved or rejected, and supports PDF export for official records.

---

## REPORTS

### Frontend Files

* **Main page:** `client/src/pages/Reports.tsx`
* **Important components:**
  * `client/src/components/reports/HouseholdsReport.tsx`
  * `client/src/components/reports/ResidentsReport.tsx`
  * `client/src/components/reports/VaccinationsReport.tsx`
  * `client/src/components/reports/BlotterReport.tsx`
  * `client/src/components/reports/CertificatesReport.tsx`
* **Service/API file:**
  * `client/src/services/reports.service.ts`
  * `client/src/services/pdf.service.ts`

### Frontend Flow

```text
Reports.tsx → report tab component
↓
reports.service.ts | pdf.service.ts
↓
/reports/*  |  /pdf/export/*
```

### Purpose

Generates filtered summaries and exports (CSV/PDF) across residents, households, vaccinations, blotters, and certificates for barangay planning and documentation.

---

## VACCINATION

### Frontend Files

* **Main page:** `client/src/pages/VaccinationsPage.tsx`
* **Important components:**
  * `client/src/components/vaccinations/VaccinationTable.tsx`
  * `client/src/components/vaccinations/AddVaccinationModal.tsx`
* **Service/API file:** `client/src/services/vaccination.service.ts`

### Frontend Flow

```text
VaccinationsPage.tsx
↓
vaccination.service.ts
↓
GET | POST | PUT | DELETE  /vaccinations  |  POST /vaccinations/{id}/complete
```

### Purpose

Tracks immunization records per resident, monitors dose schedules, marks vaccinations as completed, and supports filtered reporting by purok and date.

---

# SECTION 2 — SHARED BACKEND ARCHITECTURE

All modules share one backend request pipeline. The frontend never talks to the database directly; every operation passes through Laravel’s API layer.

## Standard System Flow

```text
React Frontend (Pages & Components)
        ↓
Service Layer (*.service.ts via api.ts)
        ↓
Laravel API Routes (server/routes/api.php)
        ↓
Middleware (auth:sanctum, role-based access)
        ↓
Controllers (business logic & validation)
        ↓
Eloquent Models (ORM)
        ↓
MySQL Database
```

## API Route Registry

**File:** `server/routes/api.php`

This single file registers every REST endpoint, groups them by module prefix, and applies authentication (`auth:sanctum`) and role middleware (`role:admin,captain,staff,...`) before requests reach a controller.

| Route group | Example endpoints |
| ----------- | ----------------- |
| Authentication | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Residents | `GET\|POST\|PUT\|DELETE /residents` |
| Households | `GET\|POST\|PUT\|DELETE /households` |
| Sketch Map | `/map/markers`, `/purok-boundaries`, `/search/households-residents` |
| Certificates | `/certificate-requests`, `/issued-certificates`, `/certificates/{id}/download` |
| Approval Center | `GET /approval-queue`, approve/reject on source modules |
| Blotter | `GET\|POST\|PUT\|DELETE /blotters`, `POST /blotters/{id}/approve` |
| Reports | `/reports/*`, `/pdf/export/*` |
| Vaccination | `GET\|POST\|PUT\|DELETE /vaccinations`, `POST /vaccinations/{id}/complete` |

## Controllers (Business Logic Layer)

Controllers receive HTTP requests, validate input, execute module rules, and return JSON responses.

| Module | Controller file(s) |
| ------ | ------------------ |
| Authentication | `server/app/Http/Controllers/AuthController.php` |
| Residents | `server/app/Http/Controllers/ResidentController.php` |
| Households | `server/app/Http/Controllers/HouseholdController.php` |
| Sketch Map | `MapMarkerController.php`, `PurokBoundaryController.php`, `SearchController.php` |
| Certificates | `CertificateRequestController.php`, `IssuedCertificateController.php`, `CertificatePdfController.php` |
| Approval Center | `ApprovalQueueController.php` (+ approve/reject in source controllers) |
| Blotter | `server/app/Http/Controllers/BlotterController.php` |
| Reports | `ReportController.php`, `PdfExportController.php` |
| Vaccination | `server/app/Http/Controllers/VaccinationController.php` |

*Controller paths:* `server/app/Http/Controllers/` unless noted.

## Models & Database (Persistence Layer)

Eloquent models map PHP objects to MySQL tables. Controllers call models to create, read, update, and delete records.

| Layer | Responsibility |
| ----- | -------------- |
| **Model** | Defines table relationships, scopes, and fillable fields |
| **Migration** | Defines table structure (created via `server/database/migrations/`) |
| **MySQL table** | Stores actual barangay data |

**Primary create migrations (schema foundation):**

| Table | Migration file |
| ----- | -------------- |
| `users` | `2025_08_19` → `0001_01_01_000000_create_users_table.php` |
| `residents` | `2025_08_19_100200_create_residents_table.php` |
| `households` | `2025_08_19_100100_create_households_table.php` |
| `map_markers` | `2025_01_20_000000_create_map_markers_table.php` |
| `purok_boundaries` | `2025_09_10_125705_create_purok_boundaries_table.php` |
| `certificate_requests` | `2025_08_30_113930_create_certificate_requests_table.php` |
| `issued_certificates` | `2025_08_30_115932_create_issued_certificates_table.php` |
| `blotters` | `2025_09_05_002653_create_blotters_table.php` |
| `vaccinations` | `2025_09_18_095902_create_vaccinations_table.php` |

**Note:** Approval Center and Reports do not own separate tables—they read and aggregate data from the module tables above.

---

# SECTION 3 — CORE BACKEND FILES TABLE

| Module | Controller | Model | Primary Table |
| ------ | ---------- | ----- | ------------- |
| Authentication | `AuthController.php` | `User.php` | `users` |
| Residents | `ResidentController.php` | `Resident.php` | `residents` |
| Households | `HouseholdController.php` | `Household.php` | `households` |
| Sketch Map | `MapMarkerController.php`, `PurokBoundaryController.php` | `MapMarker.php`, `PurokBoundary.php` | `map_markers`, `purok_boundaries` |
| Certificates | `CertificateRequestController.php`, `IssuedCertificateController.php`, `CertificatePdfController.php` | `CertificateRequest.php`, `IssuedCertificate.php` | `certificate_requests`, `issued_certificates` |
| Approval Center | `ApprovalQueueController.php` | `CertificateRequest`, `Blotter` *(aggregated)* | `certificate_requests`, `blotters` |
| Blotter | `BlotterController.php` | `Blotter.php` | `blotters` |
| Reports | `ReportController.php`, `PdfExportController.php` | Multiple models *(read-only aggregation)* | Uses existing module tables |
| Vaccination | `VaccinationController.php` | `Vaccination.php` | `vaccinations` |

*Model path:* `server/app/Models/` · *Controller path:* `server/app/Http/Controllers/`

---

# SECTION 4 — SHARED INFRASTRUCTURE

These files support every module and should be referenced once in the manuscript—not repeated per module.

| Layer | File | Purpose |
| ----- | ---- | ------- |
| **Client routing** | `client/src/routes/index.tsx` | Maps URLs to page components (lazy-loaded routes) |
| **Authentication guard** | `client/src/routes/ProtectedRoute.tsx` | Blocks unauthenticated users; enforces role access per route |
| **Session state** | `client/src/context/AuthContext.tsx` | Stores logged-in user, token, login/logout handlers |
| **HTTP client** | `client/src/services/api.ts` | Axios instance; attaches Bearer token to API requests |
| **Navigation config** | `client/src/config/sidebarMenu.ts` | Role-based sidebar menu (single source of truth) |
| **API registry** | `server/routes/api.php` | Central definition of all REST endpoints and middleware groups |
| **Authentication middleware** | `server/app/Http/Middleware/Authenticate.php` | Validates Sanctum token on protected routes |
| **Role middleware** | `server/app/Http/Middleware/RoleMiddleware.php` | Restricts endpoints by user role (admin, captain, staff, purok_leader) |
| **Layout shell** | `client/src/layouts/AppLayout.tsx` | Wraps authenticated pages with sidebar and notification provider |

## End-to-End Connection (One Diagram for Chapter 4)

```text
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + TypeScript)                          │
│  Pages → Components → *.service.ts → api.ts             │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / JSON
                           ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Laravel)                                      │
│  api.php → Middleware → Controller → Model              │
└──────────────────────────┬──────────────────────────────┘
                           │ Eloquent ORM
                           ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE (MySQL)                                       │
│  Module tables (users, residents, households, …)        │
└─────────────────────────────────────────────────────────┘
```

---

*Manuscript-ready core file documentation — Barangay Management System. Chapter 4 technical reference. May 2026.*


