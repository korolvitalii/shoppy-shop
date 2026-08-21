# ShoppyShop

ShoppyShop is a full-stack shopping application built with **Angular 22** and an **ASP.NET Core 10 REST API**.

## Live site

[Open ShoppyShop](https://shoppy-shop-zeta.vercel.app/en/products)

There is no pre-created customer account. Register through the `/register` page to use authenticated features such as favourites, checkout, and order history.

The product catalogue can be browsed without authentication.

## Key features

- Responsive product catalogue and product detail pages
- Search suggestions
- Category, price, and sorting filters
- Catalogue-grounded shopping assistant with product cards
- Persistent favourites and shopping basket
- Multi-step checkout flow
- Mock payment processing
- Customer registration and authentication
- Protected routes
- Purchase history
- English and Polish localization
- Light and dark themes
- Accessible navigation, dialogs, forms, loading states, and error feedback

## Frontend architecture

### Technology stack

- Angular 22
- Standalone components
- TypeScript
- RxJS
- Angular Signals
- SCSS
- Vitest
- ESLint
- Prettier

### API communication

The frontend communicates with the backend exclusively through relative `/api/*` URLs.

There is no frontend environment file containing an API base URL.

Same-origin proxying is handled by:

- `proxy.conf.json` during local development
- `vercel.json` rewrites in preview and production environments

This approach keeps API configuration outside the application code and allows secure cookie-based authentication to work consistently.

### Authentication

The access token is stored only in application memory using an Angular signal. It is never persisted in `localStorage` or `sessionStorage`.

The refresh token is stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie that cannot be accessed by frontend JavaScript.

When the application starts, an app initializer attempts to restore the authenticated session before the application renders.

Concurrent `401 Unauthorized` responses share a single refresh request. This prevents multiple simultaneous refresh attempts from triggering the backend's refresh-token reuse protection.

### Internationalization and themes

The application supports:

- English
- Polish
- Light theme
- Dark theme

### SEO and server-side rendering

The build process prerenders localized catalogue pages and validates generated crawl assets.

Relevant scripts include:

```text
scripts/generate-seo-assets.mjs
scripts/verify-seo.mjs
```

### Accessibility

The interface includes support for:

- Keyboard navigation
- Accessible menus and dialogs
- Form labels and validation feedback
- Loading-state announcements
- Error feedback
- Focus management

## Backend repository

The backend is maintained in a separate repository:

[ShoppyShop API](https://github.com/korolvitalii/shoppy-shop-api)

The backend uses:

- ASP.NET Core 10
- Modular monolith architecture
- Entity Framework Core
- Npgsql
- PostgreSQL 17
- JWT authentication
- Docker
- Railway deployment
- Neon PostgreSQL

The solution is divided into the following projects:

```text
ShoppyShop.Api
ShoppyShop.Application
ShoppyShop.Domain
ShoppyShop.Infrastructure
```

Backend functionality includes:

- Anthropic-powered shopping assistant with catalogue search tools
- JWT authentication
- Rotating hashed refresh tokens
- Public catalogue endpoints
- Customer favourites
- Customer order history
- Server-side checkout price calculation
- Idempotency-key-protected order creation
- PostgreSQL persistence
- Railway and Neon cloud deployment

## Running locally

### Requirements

- Node.js 24
- npm 11
- Network access to the deployed API

The application always communicates with the real backend. There is currently no offline or mocked API mode.

Install the locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm start
```

Open:

```text
https://localhost:4200
```

The local development server uses HTTPS with a self-signed certificate so that the backend's `Secure` refresh-token cookie can be used during local development.

Register an account through `/register` to access customer functionality.

## Quality checks

Run all project checks with:

```bash
npm run check
```

This command runs:

- ESLint and architecture-boundary checks
- Prettier validation
- Unit and component tests
- Localized production build and SEO validation

The same checks run before every Vercel deployment. Non-`main` pushes create preview deployments, while `main` pushes create the production deployment.

## Testing strategy

Unit and component tests use Angular's `HttpTestingController` through:

```typescript
provideHttpClientTesting();
```

HTTP requests are intercepted directly at Angular's HTTP testing layer. No external network-mocking library is placed in front of the application.

Tests for components or services that depend on `HttpClient`-based services require the appropriate providers:

```typescript
providers: [provideHttpClient(), provideHttpClientTesting()];
```

Alternatively, individual dependencies can be replaced with explicit mock providers.

## Deployment architecture

### Frontend

The frontend is deployed to Vercel through GitHub Actions.

Vercel's automatic Git deployments are disabled in `vercel.json`.

The deployment workflow works as follows:

- Pushes to non-`main` branches create preview deployments
- Pushes to `main` create production deployments
- Deployment runs only after all quality checks pass

The `vercel.json` configuration rewrites `/api/:path*` requests to the Railway backend.

This makes API calls same-origin from the browser, which is required for the `Secure` and `SameSite=Strict` refresh-token cookie.

The API rewrite must be declared before the locale catch-all rewrite. Otherwise, localized catalogue routing could incorrectly intercept `/api/*` requests.

### Backend

The backend is deployed as a Docker container on Railway, with its PostgreSQL 17 database hosted by Neon in Frankfurt.

The infrastructure includes:

- Railway for the containerized API
- Neon for managed PostgreSQL
- Railway encrypted service variables
- GitHub Actions deployment to Railway

The current application deployment does not use AWS App Runner or Amazon RDS.

## Known limitations

### No pre-created account

Each user must register a new account before using authenticated features.

### Mock payment processing

The checkout flow does not use a real payment provider.

It stores only:

- Card brand
- Last four digits
- Mock payment token identifier

Full card details are not stored.

### Single backend region

The API and database are deployed in single provider regions and do not provide multi-region failover.

### No offline development mode

The frontend currently requires access to the deployed backend because there is no local mock API mode.

## Related repository

- [ShoppyShop API](https://github.com/korolvitalii/shoppy-shop-api)
