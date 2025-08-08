# Carbon Aegis - Sustainability Reporting SaaS Platform

## Overview

Carbon Aegis is a comprehensive Sustainability Reporting SaaS platform designed to help organizations comply with ESRS (European Sustainability Reporting Standards) and CSRD (Corporate Sustainability Reporting Directive) requirements. The platform provides automated reporting, GHG accounting, materiality assessment, and collaborative ESG reporting capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Carbon Aegis brand colors and design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Authentication & Authorization
- **Provider**: Replit Auth with passport.js integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Role-Based Access**: Two primary roles - Organization and Consultant
- **User Flow**: Login → Role Selection → Onboarding → Dashboard

#### Database Schema
- **Users**: Profile management with role-based access
- **Organizations**: Company profiles with sustainability metrics
- **GHG Emissions**: Scope 1, 2, and 3 emissions tracking
- **Materiality Topics**: ESG materiality assessment data
- **ESRS Disclosures**: Compliance reporting data
- **Consultant Relationships**: Many-to-many consultant-organization mapping

#### UI Components
- **Design System**: Custom Carbon Aegis theme with green primary colors
- **Typography**: Inter for body text, Poppins for headings
- **Component Library**: Comprehensive set of reusable UI components
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

1. **User Authentication**: Replit Auth → Session Creation → Role Assignment
2. **Organization Setup**: Profile Creation → Business Information → Sustainability Metrics
3. **Data Collection**: Manual Entry → Bulk Import → API Integration
4. **Reporting**: Data Processing → ESRS Compliance → Document Generation
5. **Collaboration**: Real-time Updates → Stakeholder Access → Audit Trail

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui**: Accessible UI primitives
- **wouter**: Lightweight routing library
- **zod**: Schema validation

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

## Environment Configuration

### Environment Variables
The application uses environment variables for configuration:

#### Required Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET`: Secret key for session encryption
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Application port (default: 5000)

#### Optional Variables
- `REPLIT_DOMAINS`: Replit domain configuration
- `CORS_ORIGIN`: CORS allowed origins
- `MAX_FILE_SIZE`: Maximum file upload size (10MB)
- `UPLOAD_DIR`: File upload directory

#### API Keys (as needed)
- `OPENAI_API_KEY`: For AI-powered features
- `STRIPE_SECRET_KEY`: For payment processing
- `SENDGRID_API_KEY`: For email notifications

### File Structure
- `.env`: Environment variables (excluded from version control)
- `.env.example`: Template for environment variables
- `README.md`: Project documentation and setup instructions

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API
- **Hot Module Replacement**: Real-time code updates
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Build
- **Frontend**: Vite build with static asset optimization
- **Backend**: ESBuild bundling with Node.js execution
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions for scalability

### Replit Integration
- **Authentication**: Native Replit Auth integration
- **Development Banner**: Replit branding in development mode
- **Cartographer**: Replit's development tooling integration

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Replaced landing page with dedicated authentication page as home page
  - Created comprehensive sign-up/sign-in page matching user design specifications
  - Implemented Google OAuth button (UI ready for Firebase integration)
  - Added email/password authentication with demo credentials
  - Removed old landing page, making auth page the new root route (/)
- July 07, 2025. Updated organization dashboard and implemented role selection
  - Updated organization dashboard to match user's design with Environment, Social, Governance sections
  - Added GHG Emissions chart with monthly data and scope breakdown
  - Updated navigation sidebar with new modules (Risk Management, Performance Metrics, Compliance, Team)
  - Created dashboard preview SVG for auth page left side
  - Implemented role selection screen matching user's design specifications
  - Added sign-up flow navigation from auth page to role selection
  - Implemented complete organization onboarding flow (Business Profile → Operations Overview)
  - Implemented complete consultant onboarding flow (Consultant Profile → Experience & Expertise → Technology & Tools → Service Offerings)
  - Added multi-step forms with validation, step indicators, and GDPR compliance badges
  - Created separate onboarding paths for organizations and consultants with role-specific routing
- July 07, 2025. Implemented comprehensive Company Profile module
  - Fixed 401 Unauthorized authentication errors during onboarding completion
  - Enhanced session management with temporary-to-permanent user conversion
  - Built complete Company Profile module with 6 sub-modules matching user specifications:
    1. Entity Scope & Reporting: Legal identity, subsidiaries, NACE codes, fiscal year
    2. Corporate Structure: Ownership structure, parent companies, ownership charts
    3. Business Model Description: Products/services, markets, supply chain
    4. Industry Classification: NACE codes, EU Taxonomy eligibility, sustainability classification
    5. Geography & Locations: Countries of operation, production sites, market regions
    6. Business Strategy & Initiatives: Sustainability policies, net-zero targets, KPIs
  - Added comprehensive database schema with 5 new tables for company profile data
  - Implemented backend storage operations and API endpoints for all sub-modules
  - Created responsive multi-tab UI with form validation, tooltips, and repeatable sections
  - Added Company Profile link to organization navigation sidebar
  - Included placeholder buttons for Excel import and API integration (UI only)
- July 11, 2025. Implemented comprehensive Materiality Assessment module with four sub-modules
  - Built complete materiality assessment system matching ESRS/CSRD requirements
  - Created four integrated sub-modules:
    1. Topic Identification: ESRS-organized topic selection with custom topic support
    2. Impact/Magnitude Scoring: Dual materiality scoring with weighted calculations
    3. Materiality Matrix: Visual SVG-based matrix with interactive filtering
    4. Material Topics Report: Complete narrative reporting with stakeholder mapping
  - Enhanced database schema with 14 new fields for comprehensive topic tracking
  - Implemented materiality index calculation with configurable thresholds (3.0 material, 4.0 highly material)
  - Added progress tracking across all assessment phases
  - Created complete CRUD API endpoints for materiality topics
  - Integrated module into organization navigation as "Materiality Assessment"
  - Built responsive multi-tab interface with step completion indicators
  - Added support for ESRS standards mapping (E1-E5, S1-S4, G1)
  - Implemented stakeholder impact assessment and business risk categorization
- July 14, 2025. Implemented comprehensive Governance & Policies module with five sub-modules
  - Built complete governance module matching ESRS/CSRD governance requirements
  - Created five integrated sub-modules:
    1. Sustainability Governance Structure: Board oversight mechanisms and committee setup
    2. ESG Policy Register: Comprehensive policy management and tracking
    3. ESG-Linked Incentives: Executive compensation tied to ESG performance
    4. Internal ESG Information Flows: Data flow mapping and internal reporting
    5. ESG Integration into Core Business Processes: Business process integration assessment
  - Enhanced database schema with 5 new tables for governance data tracking
  - Implemented comprehensive backend API with full CRUD operations
  - Added multi-select dropdown components with badge-based selection
  - Integrated module into organization navigation as "Gov & Policies"
  - Fixed authentication issues with organization ID resolution
  - Created responsive multi-tab interface with form validation and tooltips
  - Added support for policy lifecycle management and committee structure tracking
- July 14, 2025. Implemented comprehensive Data Collection module for ESG KPI tracking
  - Built comprehensive ESG data collection system with structured E, S, G categorization
  - Created detailed ESG topic framework matching ESRS standards (E1-E5, S1-S4, G1-GOV-2)
  - Added extensive database schema with esgDataKpis table for comprehensive KPI tracking
  - Implemented full CRUD API endpoints for ESG data collection with proper authentication
  - Created comprehensive frontend with tabbed interface for Environment, Social, Governance, and Overview sections
  - Added 50+ predefined KPIs across ESG categories with proper units and metric types
  - Implemented standardized dropdown options for data owners, source types, collection methods, and assurance levels
  - Added multi-select functionality for reference standards and source types with badge-based UI
  - Integrated comprehensive KPI management with status tracking, filtering, and search capabilities
  - Added Data Collection module to organization navigation with Database icon
  - Enhanced KPI form with detailed metadata fields including baseline year, verification status, and confidentiality levels
  - Created collapsible topic sections with quick-add functionality for predefined KPIs
  - Added comprehensive overview dashboard with tabular KPI management and filtering options
- July 14, 2025. Implemented comprehensive Reports Module with full ESRS reporting functionality
  - Built complete reporting system with template management and generated report tracking
  - Created database schema with reports and report_sections tables with proper foreign key relationships
  - Added default ESRS template with 9 sections (General Information, Governance, Strategy, Risk Management, Metrics, etc.)
  - Implemented comprehensive backend API with full CRUD operations for reports and templates
  - Created responsive frontend with three main sections: overview dashboard, template library, and report editor
  - Added report creation modal with template selection, title input, and language options
  - Implemented report status tracking (draft, in_progress, review, final) with proper lifecycle management
  - Added reports navigation to organization sidebar with FileText icon
  - Fixed API request parameter order issues in mutations to ensure proper functionality
  - Integrated comprehensive report management with filtering, search, and status updates
  - Created foundation for advanced report editing and export functionality
- July 14, 2025. Updated ESRS Report Structure to match official ESRS/CSRD requirements
  - Restructured report sections to comply with official ESRS reporting standards
  - Added comprehensive Table of Contents as the first section with proper page numbering
  - Updated section names to match ESRS requirements:
    1. General Information
    2. Governance, Strategy & Business Model
    3. Materiality Assessment
    4. Impacts, Risks, and Opportunities
    5. Policies, Actions, Targets & KPIs
    6. EU Taxonomy Alignment
    7. Appendix
  - Enhanced report editor with detailed form fields for each section
  - Added EU Taxonomy alignment metrics (Turnover, CapEx, OpEx percentages)
  - Updated database template with new section structure
  - Improved report editor UI with better visual hierarchy and section organization
- July 14, 2025. Enhanced General Information section with proper field mapping to Company Profile module
  - Updated General Information section with 7 specific ESRS-compliant fields:
    1. Entity Legal Name (mapped to Company Profile → Entity Scope & Reporting → Legal Name)
    2. Legal Form (mapped to Company Profile → Entity Scope & Reporting → Legal Form)
    3. Country of Registration (mapped to Company Profile → Entity Scope & Reporting → Country)
    4. NACE Sector (mapped to Company Profile → Industry and Taxonomy Classification → NACE Sector Code)
    5. Consolidation Scope (mapped to Company Profile → Entity Scope & Reporting → Subsidiary List)
    6. Registered HQ (mapped to Company Profile → Geography and Locations → HQ Address)
    7. Reporting Period (mapped to Company Profile → Fiscal Year-End)
  - Added data source indicators for each field showing exact module and field mapping
  - Enhanced field layout with proper grid structure and descriptive placeholders
  - Connected report fields to existing Company Profile data structure for future data integration
- July 15, 2025. Implemented auto-filling functionality for ESRS reports from Company Profile data
  - Added Company Profile data fetching query to Reports component
  - Implemented automatic population of General Information section from existing Company Profile data
  - Added real-time data binding for all General Information fields with auto-save capability
  - Connected Entity Legal Name, Legal Form, Country, NACE Sector, Consolidation Scope, Registered HQ, and Reporting Period fields
  - Added save functionality with Save button icon for immediate data persistence
  - Enhanced user experience with seamless data flow from Company Profile to ESRS reports
  - Implemented subsidiary consolidation scope auto-formatting from Company Profile subsidiary data
- July 15, 2025. Implemented comprehensive Governance, Strategy & Business Model section with auto-filling
  - Built complete Governance, Strategy & Business Model section with 9 specific fields:
    1. Overview of Business Model (text field for manual entry)
    2. Key Products/Services (auto-filled from Company Profile → Business Model → Key Products)
    3. Primary Markets (auto-filled from Company Profile → Business Model → Primary Markets)
    4. ESG Strategy Overview (auto-filled from Business Strategy → Sustainability Policies)
    5. Transition Plan (auto-filled from Business Strategy → Sustainability Transition Plan)
    6. Net-Zero Target (auto-filled from Business Strategy → Net-Zero Target)
    7. Circular Economy Initiatives (auto-filled from Business Strategy → Product Stewardship)
    8. Governance Roles for ESG (auto-filled from Governance & Policies → Committee Responsibilities)
    9. Board Oversight of Sustainability (auto-filled from Governance & Policies → Board Oversight)
  - Added governance data fetching query to retrieve committee and board oversight information
  - Implemented real-time data binding with save functionality for all fields
  - Enhanced auto-population logic to pull data from multiple modules (Company Profile, Business Strategy, Governance)
  - Added proper field layout with grid structure and data source indicators
  - Connected all fields to existing database schema for seamless data integration
- July 15, 2025. Built comprehensive environment configuration and documentation
  - Created .env file with all necessary environment variables for development
  - Added .env.example template with detailed documentation for each variable
  - Updated .gitignore to exclude environment files from version control
  - Created comprehensive README.md with setup instructions and project documentation
  - Added environment configuration section to replit.md documentation
  - Documented required variables (DATABASE_URL, SESSION_SECRET, NODE_ENV, PORT)
  - Documented optional variables (CORS_ORIGIN, MAX_FILE_SIZE, UPLOAD_DIR)
  - Documented API keys for third-party integrations (OpenAI, Stripe, SendGrid)
  - Enhanced security practices for environment variable management
- July 15, 2025. Implemented comprehensive Materiality Assessment section in ESRS reports
  - Built complete Materiality Assessment section with 5 fields mapped to Material Topics module:
    1. Materiality Assessment Methodology (manual text field)
    2. List of Assessed Topics (auto-filled from Material Topics → Topic Identification)
    3. Stakeholder Input in Assessment (manual text field)
    4. Double Materiality Matrix (auto-filled from Material Topics → Materiality Matrix Visualization)
    5. Final Material Topics Table (auto-filled from Material Topics → Material Topics Report)
  - Added materiality topics data fetching query to Reports component
  - Enhanced auto-population logic to include materiality assessment data from materialityTopics array
  - Implemented real-time data binding for all materiality assessment fields with save functionality
  - Added comprehensive UI with proper field mapping, data source indicators, and form validation
  - Enhanced manual "Auto-fill Data" button to include materiality assessment data population
  - Added save button with mutation integration for immediate data persistence
  - Connected materiality assessment fields to existing Material Topics database schema
  - Implemented proper data transformation for topics list and material topics table formatting
  - Replaced Double Materiality Matrix text field with actual SVG visualization from Material Topics module
  - Created embedded materiality matrix with interactive data points, category colors, and materiality thresholds
  - Added comprehensive legend with environmental/social/governance categories and stakeholder concern levels
  - Implemented proper error handling for cases where no materiality assessment data exists
  - Enhanced visualization with red threshold lines (3.0 materiality) and material topic highlighting
- July 15, 2025. Implemented comprehensive Impacts, Risks & Opportunities section in ESRS reports
  - Built complete Impacts, Risks & Opportunities section with 5 fields mapped to Risk Management module:
    1. List of Sustainability Risks (auto-filled from Risk Management → Risk Register)
    2. List of Sustainability Opportunities (auto-filled from Risk Management → Opportunity Register)
    3. Value Chain Mapping (auto-filled from Risk Management → Affected Stakeholders)
    4. Due Diligence Process (auto-filled from Risk Management → Due Diligence Framework, Oversight and Scope)
    5. Remediation Mechanisms (auto-filled from Risk Management → Action Plans)
  - Added Risk Management data fetching queries for IRO Register, Due Diligence Process, and Action Plans
  - Enhanced auto-population logic to include comprehensive risk and opportunity data from Risk Management module
  - Implemented real-time data binding for all impacts and risks fields with save functionality
  - Added proper field mapping, data source indicators, and form validation for all Risk Management fields
  - Enhanced manual "Auto-fill Data" button to include Risk Management data population
  - Connected all impacts and risks fields to existing Risk Management database schema
  - Implemented proper data transformation for risks list, opportunities list, value chain mapping, due diligence framework, and remediation mechanisms
  - Enhanced sustainability risks list to include comprehensive risk details: title, description, category, likelihood/5, impact severity/5, time horizon, affected stakeholders, value chain location, financial materiality, and impact materiality
  - Improved risk data formatting with detailed pipe-separated format for better readability and completeness
  - Enhanced Due Diligence Process field to include all fields from Risk Management module: frameworks, scope description, governance oversight, process description, frequency, stakeholder involvement, grievance mechanism status and description, supporting documents
  - Updated Due Diligence Process auto-population with comprehensive multi-line format for complete ESRS compliance
- July 15, 2025. Implemented comprehensive Policies, Actions, Targets & KPIs section in ESRS reports
  - Built complete "Policies, Actions, Targets & KPIs" section with dynamic ESG data population from Data Collection module
  - Added ESG Data KPIs query to Reports component for real-time data fetching
  - Implemented comprehensive ESG data organization by topic → KPIs → data collection information structure
  - Created detailed KPI data presentation covering ESRS 2, E1–E5, S1–S4, G1 disclosure requirements
  - Added comprehensive KPI details including: KPI name, type, unit, current value, baseline year, data owner, collection frequency, collection method, assurance level, verification status, reference standards, reporting period, completion status, notes
  - Enhanced manual "Auto-fill Data" button to include ESG data population from Data Collection module
  - Connected Policies, Actions, Targets & KPIs section to existing ESG Data KPIs database schema
  - Implemented proper data transformation for comprehensive ESG reporting with topic-based organization
  - Added large textarea (15 rows) to accommodate comprehensive ESG data display
  - Created seamless integration between Data Collection module and ESRS report generation
  - Fixed authentication issues for ESG Data KPIs endpoints by updating req.user.id to req.user.claims.sub
  - Implemented comprehensive KPI cards display with topic-based organization
  - Added visual KPI cards with completion status indicators (complete/partial/missing)
  - Created responsive grid layout for KPI cards with detailed information display
  - Enhanced KPI cards with reference standards badges and notes sections
  - Replaced textarea with interactive card-based visualization for better user experience
  - Commented out EU Taxonomy section from ESRS report for future implementation
  - Updated section numbering (Section 7 → Section 6) after commenting out EU Taxonomy
  - Added debug logging to investigate Due Diligence Process data population issue
  - Replaced single "Due Diligence Process" field with 3 separate fields in Section 4: Impacts, Risks & Opportunities:
    1. Due Diligence Frameworks (mapped to Risk Management → Due Diligence Process → Frameworks)
    2. Scope Description (mapped to Risk Management → Due Diligence Process → Scope Description)
    3. Governance Oversight (mapped to Risk Management → Due Diligence Process → Governance Oversight)
  - Updated auto-fill data logic to populate the 3 new Due Diligence fields separately
  - Enhanced data granularity for better ESRS compliance and reporting accuracy
  - Fixed timestamp handling error in report saving (HTTP 500 error on PUT /api/generated-reports/:id)
  - Improved backend route to automatically handle lastModified and updatedAt timestamps
  - Removed manual timestamp passing from frontend to prevent database conversion errors
  - Enhanced error handling for report save operations
  - Fixed database constraint violation error for report status field
  - Updated report status from 'in_progress' to 'draft' to match schema (only 'draft' and 'final' allowed)
  - Fixed finalizedAt timestamp formatting to use ISO string format
  - Resolved all HTTP 500 errors when saving report changes
- July 16, 2025. Enhanced Emission Overview module with comprehensive save functionality
  - Changed all "Calculate Emissions" buttons to "Save" buttons across all emission forms
  - Implemented mutation for saving emission data using existing API endpoint (/api/ghg-emissions)
  - Added proper form submit handlers (handleSaveEmission) to all emission forms:
    1. Stationary Combustion (Fuel & Bioenergy)
    2. Mobile Combustion (Passenger & Delivery Vehicles)
    3. Fugitive Emissions (Refrigerants)
    4. Purchased Electricity (Scope 2)
    5. Purchased Heat & Steam (Scope 2)
  - Added loading states and disabled states for all Save buttons during mutation
  - Implemented toast notifications for successful saves and error handling
  - Added form validation and scope/category selection validation
  - Enhanced user experience with form reset after successful save
  - Connected all emission forms to GHG emissions database with proper data transformation