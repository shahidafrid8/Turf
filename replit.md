# TurfTime - Sports Turf Booking Application

## Overview

TurfTime is a mobile-first web application for booking sports turfs (football, cricket, basketball courts, etc.). Inspired by Spotify's design aesthetic, it features a dark theme with energetic green accents (#00FF00), providing users with an intuitive platform to discover, browse, and book sports facilities with real-time slot availability and flexible payment options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state and data fetching
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens

**Design System**
- Mobile-first responsive design (max-width: 512px container)
- Spotify-inspired dark theme with HSL color system
- Custom CSS variables for theming (background, foreground, primary, etc.)
- Energetic green primary color (#00E676 / hsl(142, 100%, 45%))
- Typography: Modern sans-serif fonts (Montserrat, Inter fallbacks)
- Spacing based on Tailwind's spacing scale (2, 4, 6, 8, 12, 16)

**Key UI Patterns**
- Bottom navigation bar for main app sections (Home, Search, Bookings, Favorites, Profile)
- Card-based layouts with hover elevation effects
- Horizontal scrolling carousels for featured content
- Date selector with scrollable calendar interface
- Time slot grid organized by period (morning, afternoon, evening)

### Backend Architecture

**Technology Stack**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM
- **Session Management**: Express sessions (configured for PostgreSQL via connect-pg-simple)
- **API Pattern**: RESTful endpoints

**Server Structure**
- Express server with middleware for JSON parsing, logging, and static file serving
- Custom request logging with timestamps and duration tracking
- Development mode includes Vite middleware for HMR
- Production mode serves pre-built static assets

**API Design**
- GET `/api/turfs` - Fetch all available turfs
- GET `/api/turfs/:id` - Fetch single turf details
- GET `/api/turfs/:id/slots/:date` - Fetch available time slots for specific turf and date
- GET `/api/bookings` - Fetch all bookings
- POST `/api/bookings` - Create new booking

**Data Storage Strategy**
- Interface-based storage abstraction (`IStorage`) for flexibility
- In-memory storage implementation for development
- Prepared for PostgreSQL integration via Drizzle ORM
- Schema-first approach with Zod validation

### Data Models

**Core Entities**
1. **Users**: Authentication and profile management (id, username, password)
2. **Turfs**: Sports facility information (id, name, location, address, imageUrl, rating, amenities, sportTypes, pricePerHour, isAvailable, featured)
3. **TimeSlots**: Availability windows (id, turfId, date, startTime, endTime, price, period, isBooked)
4. **Bookings**: Reservation records (id, userId, turfId, slotId, date, startTime, endTime, duration, totalAmount, status, bookingCode)

**Relationships**
- One turf has many time slots
- One user has many bookings
- One booking references one turf and one time slot

**Business Logic**
- Dynamic pricing by time period (morning/afternoon/evening)
- Slot booking prevents double-booking via `isBooked` flag
- Booking codes generated for confirmation tracking
- Session-based temporary booking data during checkout flow

### Build and Deployment

**Build Process**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.cjs`
- Selective dependency bundling to reduce cold start times
- Production build creates single distributable artifact

**Development Workflow**
- Hot module replacement (HMR) via Vite
- TypeScript compilation checking without emit
- Database schema changes via `drizzle-kit push`

## External Dependencies

### UI Component Libraries
- **Radix UI**: Comprehensive primitive components for accessibility (accordion, alert-dialog, avatar, button primitives, checkbox, dialog, dropdown-menu, etc.)
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **cmdk**: Command palette component
- **embla-carousel-react**: Touch-friendly carousel implementation

### Data and State Management
- **@tanstack/react-query**: Server state management and data fetching
- **react-hook-form** with **@hookform/resolvers**: Form handling and validation
- **zod**: Runtime type validation and schema parsing
- **drizzle-zod**: Automatic Zod schema generation from Drizzle models

### Database and ORM
- **Drizzle ORM**: Type-safe SQL query builder for PostgreSQL
- **@neondatabase/serverless**: Neon Database PostgreSQL driver (serverless-compatible)
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: Database migration and schema management tools

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx** + **tailwind-merge**: Conditional className utilities
- **class-variance-authority**: Component variant management
- **nanoid**: Unique ID generation
- **lucide-react**: Icon library

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Fast JavaScript bundler for server
- **TypeScript**: Type safety across client and server
- **PostCSS** + **Autoprefixer**: CSS processing

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation
- **@replit/vite-plugin-dev-banner**: Development mode indicator

### Expected Integrations
The application architecture is prepared for:
- **Payment Processing**: Stripe integration (dependency present, implementation pending)
- **Email Notifications**: Nodemailer (dependency present)
- **Image Storage**: External CDN or object storage (currently using Unsplash URLs)
- **Real-time Updates**: WebSocket support via `ws` package