# Carbon Aegis - Sustainability Reporting Platform

A comprehensive SaaS platform for sustainability reporting, ESG compliance, and carbon accounting.

## Environment Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your actual values.

### Environment Variables

The application requires several environment variables to function properly:

#### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 5000)

#### Optional Variables

- `REPLIT_DOMAINS`: Replit domain configuration
- `CORS_ORIGIN`: CORS allowed origins
- `MAX_FILE_SIZE`: Maximum file upload size
- `UPLOAD_DIR`: File upload directory

#### API Keys (as needed)

- `OPENAI_API_KEY`: For AI-powered features
- `STRIPE_SECRET_KEY`: For payment processing
- `SENDGRID_API_KEY`: For email notifications

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Database

The application uses PostgreSQL with Drizzle ORM. Database migrations are handled automatically through schema synchronization.

### Security

- Environment variables are excluded from version control
- Session secrets should be strong, randomly generated strings
- API keys should be kept secure and not shared

### Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure session secrets
4. Configure CORS origins for production domains

## Project Structure

- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared types and schemas
- `/public` - Static assets

## Features

- Multi-tenant organization management
- ESRS/CSRD compliance reporting
- GHG emissions tracking
- Materiality assessment
- Governance & policies management
- ESG data collection
- Risk management
- Automated report generation

## Support

For technical support or questions, please refer to the project documentation or contact the development team.