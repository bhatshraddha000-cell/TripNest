# TripNest – Travel Planning & Trip Management Platform

TripNest is a collaborative travel planning and trip management platform built to simplify group coordination, itinerary organization, expense splitting, document management, and travel statistics.

---

## 🌟 Features

### 1. Collaboration & Trip Management
- **Create Trips**: Define travel dates, destinations, passenger counts, and travel budgets.
- **Group Collaboration**: Invite friends to trips by email. Members can accept/reject invitations.
- **Role Model**:
  - **Platform Level**: Regular `USER` and platform `ADMIN`.
  - **Trip Level**: Trip creator is designated `GROUP_ADMIN` (permissions to edit/delete trip, manage members, etc.). Joined invitees are `MEMBER` accounts (permissions to view, schedule, and split expenses).

### 2. Day-Wise Itineraries & Activity Scheduling
- **Daily Plans**: Group-level daily itinerary timelines.
- **Activities**: Add custom items (flights, sightseeing, restaurants) with locations, timings, and estimated costs.
- **Activity Overlap Checks**: Automatic validations to warn of timeline overlaps.

### 3. Expense Sharing & Settlements
- **Log Expenses**: Track group spending with customizable categories (Food, Lodging, Transportation, etc.).
- **Equal & Custom Splits**: Split bills evenly or enter exact custom shares.
- **Mark Paid**: Seamless settlement dashboard tracking who owes whom. Marking a split as paid updates balances instantly.

### 4. Travel Documents & Reminders
- **Document Locker**: Upload tickets, reservations, and passports securely with type/size validation.
- **Email Reminders**: Automated background email alerts sent before trip departures.

### 5. Milestone 4: Traveler Analytics Dashboard
- **Upcoming Trips**: Dynamic list derived from trip dates.
- **Budget Metrics**: Detailed tracking of total budget vs. activity estimations vs. actual expenses.
- **Expense Summary**: Interactive breakdown showing category costs, paid amounts, outstanding debts, and pending balances.
- **Travel Stats**: Aggregated count of total trips, ongoing/completed/upcoming trips, visited destinations, and planned activities.
- **Popular Destinations**: Rankings of frequently visited places.
- **SVG Charts**: Sleek, animated, responsive SVG doughnut and bar charts indicating expense categorization and budget utilization.

### 6. platform Administration Portal
- **Admin analytics**: Metrics on platform usage (total registered users, active user counts, new signups, and trip participant metrics).
- **Global counts**: Overall platform statistics (total planned trips, activities, document lockers, notifications, and expense logs).
- **Revenue states**: Placeholder report structure with proper status indicating no platform revenue streams are stored.
- **Security Check**: Secured endpoints rejecting regular travelers with `403 Forbidden` errors.

---

## 🛠️ Technology Stack

- **Backend**: Java 17, Spring Boot, Spring Security (JWT-based state-less authentication), Spring Data JPA, Hibernate, MySQL.
- **Testing**: JUnit 5, Mockito, Spring Boot Test, RestTemplate.
- **Frontend**: React 19, Vite, React Router, Context API, Axios, Vanilla CSS (Premium glassmorphic templates), Custom SVG charts.

---

## ⚙️ Environment Variables & Configuration

Backend and database parameters are configurable via environment variables or command-line system properties.

### Backend Environment Variables
| Variable | Description | Default Fallback |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | Database connection URL | `jdbc:mysql://localhost:3306/tripnest_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `12345678` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `tripnest-local-dev-secret-2026-07-06-...` |
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP sender email username | `tripnest207@gmail.com` |
| `MAIL_PASSWORD` | SMTP password / app passcode | `blhtgeycfenvkvxe` |

### Frontend Environment Variables
| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base endpoint URL of backend API | `http://localhost:8081` (Local) / Prod URL |

---

## 🚀 Running Locally

### Prerequisites
- Java Development Kit (JDK) 17 or higher
- Node.js (v18+) and npm
- MySQL Server (running locally on port 3306)

### 1. Database Setup
Create the schema manually:
```sql
CREATE DATABASE IF NOT EXISTS tripnest_db;
```

### 2. Run Backend API
Navigate to the backend directory and launch via Maven Wrapper:
```bash
cd backend
# Starts backend service on port 8081
./mvnw spring-boot:run
```

### 3. Run Frontend Dev Server
Navigate to the frontend directory, install dependencies, and launch Vite:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Running Backend Unit & Integration Tests
The project contains 56 unit and integration test suites validating user validation rules, budget formulas, customized expense splits, invitation flows, overlap logic, and controller endpoint access controls:
```bash
cd backend
./mvnw clean test
```

### API Validation (Postman)
An automated API flow collection is available at the project root:
- File name: `TripNest_Workflow.postman_collection.json`
- Import this file into Postman, set your `baseUrl` env variable to `http://localhost:8081`, and run the requests in sequence to test authentication, trip planning, expense splitting, and dashboard analytics.

---

## 🔒 Security & Roles

Authentication and roles are strictly enforced at both the API layer (Spring Security) and UI view layers (React ProtectedRoute).

### Platform Security Filters:
- `/api/auth/**` and GET `/api/destinations/**`: Allowed publicly without credentials.
- `/api/admin/**`: restricted only to users with role `ADMIN`. Regular travelers will receive a `403 Forbidden` error.
- All other endpoints require a valid Bearer JWT token in the request header.

### Startup Data Seeders:
On application start, the database seeds:
1. Roles: `ROLE_TRAVELER` (system role USER) and `ROLE_ADMIN` (system role ADMIN).
2. Administrator user: `admin@tripnest.com` with password `password123`.
3. Traveler user: `traveler@tripnest.com` with password `password123`.

---

## 🌐 Production Deployment Configuration

### CORS Configuration
Allow specific frontend domains in production:
In `application.properties`, configure `app.cors.allowed-origins` with your deployed client URL:
```properties
app.cors.allowed-origins=https://tripnest-app.vercel.app
```

### Database production safety
Do NOT use `spring.jpa.hibernate.ddl-auto=create` in production. Override this parameter to prevent data loss:
```properties
spring.jpa.hibernate.ddl-auto=update
```
Or set the environment variable:
`SPRING_JPA_HIBERNATE_DDL_AUTO=update`