# ShoppyShop — Modern Angular E-Commerce Platform

ShoppyShop is a production-style e-commerce web application built to demonstrate advanced Angular development, scalable front-end architecture, clean code practices, state management, performance optimization, and professional software engineering workflows.

The application simulates a real online store where users can browse products, search and filter the catalogue, manage a shopping cart, place orders, and maintain their personal account.

The main purpose of this project is to demonstrate how a modern Angular application can remain scalable, maintainable, testable, and performant as the number of features grows.

---

## Project Goals

This project demonstrates practical knowledge of:

- Modern Angular architecture
- Standalone components and APIs
- Angular Signals
- RxJS and reactive programming
- NgRx state management
- Lazy-loaded routes
- Smart and presentational components
- Feature-based project structure
- Facade and Repository patterns
- Typed reactive forms
- API communication
- Error handling
- Authentication and authorization
- Performance optimization
- Accessibility
- Unit and end-to-end testing
- CI/CD and professional Git workflows

---

## Main Features

### Product Catalogue

- Product listing with pagination
- Category filtering
- Price filtering
- Rating filtering
- Sorting by price, popularity, rating, and newest
- Debounced product search
- Product availability indicators
- Responsive product grid
- Skeleton loaders during data fetching
- Empty-state and error-state handling

### Product Details

- Detailed product information
- Product image gallery
- Product variants
- Stock availability
- Customer reviews
- Related products
- Add-to-cart functionality
- Add-to-wishlist functionality
- Recently viewed products

### Shopping Cart

- Add and remove products
- Update product quantity
- Calculate subtotal, discounts, tax, and total price
- Persist cart state between sessions
- Validate stock before checkout
- Optimistic UI updates
- Clear cart functionality

### Checkout

- Multi-step checkout process
- Shipping address form
- Delivery method selection
- Payment method selection
- Order summary
- Promo code support
- Form validation
- Order confirmation page

### Authentication

- User registration
- User login
- Logout
- Refresh-token flow
- Protected routes
- Role-based authorization
- Authentication state restoration
- HTTP interceptor for access tokens

### User Account

- Profile management
- Saved addresses
- Order history
- Order details
- Wishlist
- Password update
- Notification preferences

### Administration

- Product management
- Category management
- Inventory management
- Order management
- User management
- Sales dashboard
- Role-based access control

---

## Technology Stack

### Front End

- Angular
- TypeScript
- RxJS
- Angular Signals
- NgRx
- SCSS
- Angular Material or a custom design system
- Reactive Forms
- Angular Router
- Angular CDK

### Testing

- Jest
- Angular Testing Library
- Playwright
- API mocking
- Component tests
- Integration tests
- End-to-end tests

### Development Tools

- ESLint
- Prettier
- Husky
- lint-staged
- Commitlint
- Docker
- GitHub Actions
- Storybook

### Optional Back End

The Angular application can be connected to:

- ASP.NET Core Web API
- Node.js and NestJS
- Mock Service Worker
- JSON Server during early development

---

## Architecture

The project follows a feature-first architecture with clear separation of responsibilities.

Each business feature owns its UI, state, data-access logic, models, routes, and tests.

### Error handling

Application failures use a single safe error contract under `src/app/core/errors`:

- `apiErrorInterceptor` converts `HttpClient` failures into typed `AppError` values.
- Stable codes (`NETWORK_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`, `SERVER_ERROR`, and others) support diagnostics without exposing backend details.
- `GlobalErrorHandler` catches unexpected Angular and browser errors.
- `ErrorNotificationService` provides signal-based notification state.
- The accessible global banner announces friendly messages and can be dismissed.

Raw API messages, stack traces, credentials, and server implementation details are never displayed to customers. Recoverable feature views can still keep their contextual retry controls while the shared error contract provides consistent messages and codes.

### Global loading

HTTP activity is tracked by a signal-based `LoadingService` and functional interceptor. A reference counter keeps the indicator visible until all concurrent requests complete, while a 200 ms display delay prevents flashes for fast responses. Requests such as silent background refreshes can opt out with the `SKIP_GLOBAL_LOADING` HTTP context token. Feature pages retain their local skeletons and loading states for contextual feedback.

```text
src/
├── app/
│   ├── core/
│   │   ├── authentication/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── error-handling/
│   │   ├── configuration/
│   │   ├── logging/
│   │   └── layout/
│   │
│   ├── shared/
│   │   ├── ui/
│   │   ├── directives/
│   │   ├── pipes/
│   │   ├── validators/
│   │   ├── utilities/
│   │   └── models/
│   │
│   ├── features/
│   │   ├── catalogue/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── data-access/
│   │   │   ├── state/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── catalogue.routes.ts
│   │   │
│   │   ├── product-details/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── authentication/
│   │   ├── account/
│   │   ├── orders/
│   │   ├── wishlist/
│   │   └── administration/
│   │
│   ├── shell/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── navigation/
│   │   └── application-shell.component.ts
│   │
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.component.ts
│
├── assets/
├── environments/
└── styles/
    ├── abstracts/
    ├── base/
    ├── components/
    ├── layout/
    ├── themes/
    └── styles.scss
```

---

## Architectural Principles

### Feature-First Structure

The application is organized around business features instead of technical file types.

For example, everything related to the shopping cart is located inside the `cart` feature.

This keeps features isolated and makes the project easier to scale.

### Standalone Components

The project uses standalone components, directives, and pipes.

This reduces unnecessary module configuration and simplifies lazy loading, testing, and dependency management.

### Smart and Presentational Components

Container components are responsible for:

- Retrieving state
- Dispatching actions
- Handling route parameters
- Coordinating business logic
- Communicating with facades

Presentational components are responsible for:

- Rendering data
- Receiving typed inputs
- Emitting user actions
- Remaining reusable and independent from application state

Example:

```text
catalogue-page.component
├── product-filter.component
├── product-sort.component
├── product-grid.component
│   └── product-card.component
└── pagination.component
```

### Facade Pattern

Components do not communicate directly with NgRx stores or HTTP services.

Each feature exposes a facade that provides a simple API for the UI layer.

```ts
@Injectable()
export class CartFacade {
  readonly items = this.store.selectSignal(selectCartItems);
  readonly total = this.store.selectSignal(selectCartTotal);
  readonly loading = this.store.selectSignal(selectCartLoading);

  constructor(private readonly store: Store) {}

  loadCart(): void {
    this.store.dispatch(CartActions.loadCart());
  }

  addProduct(productId: string): void {
    this.store.dispatch(CartActions.addProduct({ productId }));
  }

  removeProduct(productId: string): void {
    this.store.dispatch(CartActions.removeProduct({ productId }));
  }
}
```

Benefits:

- Components stay simple
- State implementation can change without rewriting UI components
- Business operations are easier to test
- Store selectors and actions are hidden from the presentation layer

### Repository Pattern

HTTP communication is isolated inside repository services.

```ts
export abstract class ProductRepository {
  abstract getProducts(query: ProductSearchQuery): Observable<PaginatedResult<Product>>;

  abstract getProductById(id: string): Observable<Product>;

  abstract getRelatedProducts(id: string): Observable<Product[]>;
}
```

The concrete API implementation:

```ts
@Injectable()
export class ApiProductRepository implements ProductRepository {
  private readonly http = inject(HttpClient);

  getProducts(query: ProductSearchQuery): Observable<PaginatedResult<Product>> {
    return this.http.get<PaginatedResult<Product>>('/api/products', {
      params: buildHttpParams(query),
    });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }

  getRelatedProducts(id: string): Observable<Product[]> {
    return this.http.get<Product[]>(`/api/products/${id}/related`);
  }
}
```

This separation allows API implementations to be replaced with mocks, local storage, or another back end.

---

## State Management Strategy

The application uses different state-management tools depending on the type of state.

### Local Component State

Angular Signals are used for simple UI state:

- Open and closed menus
- Selected tabs
- Form visibility
- Loading indicators local to a component
- Selected images
- Temporary UI preferences

```ts
readonly selectedImageIndex = signal(0);
readonly isDescriptionExpanded = signal(false);
```

### Feature State

NgRx is used for complex shared feature state:

- Product catalogue
- Shopping cart
- Authentication
- Checkout
- Orders
- User profile
- Administration

### Server State

Data returned from the API is normalized and managed through feature stores.

The application avoids duplicating the same server data across multiple components.

### URL State

Search, filters, sorting, and pagination are stored in query parameters.

Example:

```text
/products?category=laptops&minPrice=500&sort=price-asc&page=2
```

This makes filtered views:

- Shareable
- Bookmarkable
- Restorable after refresh
- Compatible with browser navigation

---

## Reactive Programming

RxJS is used for asynchronous workflows and event composition.

Examples include:

- Debounced search
- Request cancellation
- Authentication refresh
- Route parameter handling
- Combining filters
- Loading related products
- Checkout workflows

Product search example:

```ts
readonly searchResults$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((searchTerm) =>
    this.productRepository.searchProducts(searchTerm).pipe(
      catchError(() => of([]))
    )
  )
);
```

`switchMap` cancels the previous API request when the user enters a new search value.

---

## Routing

All major features are lazy loaded.

```ts
export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page.component').then(
        (component) => component.HomePageComponent,
      ),
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./features/catalogue/catalogue.routes').then((routes) => routes.CATALOGUE_ROUTES),
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then((routes) => routes.CART_ROUTES),
  },
  {
    path: 'checkout',
    canActivate: [authenticationGuard],
    loadChildren: () =>
      import('./features/checkout/checkout.routes').then((routes) => routes.CHECKOUT_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () =>
      import('./features/administration/administration.routes').then(
        (routes) => routes.ADMINISTRATION_ROUTES,
      ),
  },
];
```

Route guards are used for:

- Authentication
- Role-based access
- Unsaved checkout changes
- Administrative permissions

---

## API Communication

The application uses typed API contracts and centralized HTTP handling.

### HTTP Interceptors

Interceptors are responsible for:

- Adding access tokens
- Adding correlation identifiers
- Handling API errors
- Refreshing expired tokens
- Tracking request duration
- Retrying selected requests

```ts
export const authenticationInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthenticationService);
  const token = authService.accessToken();

  const authenticatedRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authenticatedRequest);
};
```

### Error Handling

API errors are transformed into application-specific error models.

```ts
export interface ApplicationError {
  code: string;
  message: string;
  validationErrors?: Record<string, string[]>;
  correlationId?: string;
}
```

The application provides:

- Global error notifications
- Inline form validation
- Retry actions
- Dedicated error pages
- Logging with correlation IDs
- User-friendly messages

---

## Forms

The application uses strongly typed reactive forms.

```ts
interface ShippingAddressForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  street: FormControl<string>;
  city: FormControl<string>;
  postalCode: FormControl<string>;
  country: FormControl<string>;
}
```

Forms include:

- Reusable validators
- Async validation
- Cross-field validation
- Server validation errors
- Accessible error messages
- Disabled submission during requests
- Unsaved changes protection

---

## Performance Optimization

The project includes several performance-focused techniques:

- Lazy-loaded routes
- OnPush change detection
- Signals for efficient UI updates
- `trackBy` or Angular tracking expressions
- Deferred loading for non-critical content
- Image optimization
- Route-level code splitting
- Virtual scrolling for large lists
- Request cancellation
- Memoized selectors
- Cached API responses
- Prefetching important routes
- Skeleton loading
- Optimized production builds

Example:

```html
@for (product of products(); track product.id) {
<app-product-card [product]="product" (addToCart)="addToCart($event)" />
}
```

Non-critical sections can be deferred:

```html
@defer (on viewport) {
<app-related-products [productId]="productId()" />
} @placeholder {
<app-product-grid-skeleton />
}
```

---

## Search Engine Optimization

The application can use server-side rendering or prerendering for public store pages.

SEO features include:

- Dynamic page titles
- Dynamic meta descriptions
- Canonical URLs
- Open Graph metadata
- Structured product data
- Semantic HTML
- Server-rendered product pages
- Sitemap generation
- Robots configuration

---

## Accessibility

The project follows accessibility best practices.

Implemented areas include:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible forms
- Proper labels
- ARIA attributes where required
- Focus management in dialogs
- Accessible error messages
- Sufficient contrast
- Screen-reader-friendly navigation

---

## Security

The application demonstrates front-end security practices such as:

- Route protection
- Role-based authorization
- Token expiration handling
- Refresh-token flow
- Avoiding sensitive data in local storage
- Input validation
- Output escaping
- Content Security Policy compatibility
- Secure HTTP-only cookie support
- Prevention of open redirects
- Protection against duplicate submissions

Authorization is always treated as a back-end responsibility. Front-end guards improve user experience but are not considered a security boundary.

---

## Testing Strategy

The project follows a testing pyramid.

### Unit Tests

Used for:

- Reducers
- Selectors
- Effects
- Facades
- Validators
- Utility functions
- Pipes
- Services

### Component Tests

Used for:

- Product cards
- Filters
- Forms
- Cart components
- Checkout steps
- Error states
- Loading states

### Integration Tests

Used for:

- Component and facade interaction
- Router behavior
- HTTP communication
- Authentication flows
- Store effects

### End-to-End Tests

Playwright tests cover:

- Product search
- Product filtering
- Add-to-cart flow
- Cart quantity updates
- Checkout process
- Login and logout
- Protected routes
- Admin product creation

Example test scenario:

```ts
test('user can add a product to the cart', async ({ page }) => {
  await page.goto('/products');

  await page.getByRole('article').first().getByRole('button', { name: 'Add to cart' }).click();

  await expect(page.getByTestId('cart-items-count')).toHaveText('1');
});
```

---

## Design System

Reusable UI components are documented in Storybook.

Examples include:

- Buttons
- Inputs
- Selects
- Dialogs
- Product cards
- Price components
- Rating components
- Badges
- Notifications
- Skeletons
- Pagination
- Empty states
- Error states

Design tokens are used for:

- Colours
- Typography
- Spacing
- Border radius
- Breakpoints
- Shadows
- Animation duration

---

## Styling Architecture

SCSS follows a structured organization.

```text
styles/
├── abstracts/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _functions.scss
│   └── _breakpoints.scss
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _global.scss
├── layout/
├── themes/
└── styles.scss
```

Component styles remain encapsulated and avoid unnecessary global selectors.

The project uses:

- Responsive design
- Mobile-first styling
- CSS custom properties
- SCSS mixins
- Consistent spacing
- Reusable design tokens
- Dark and light themes

---

## Code Quality

The project follows strict development rules:

- ESLint 10 flat configuration with Angular ESLint 22
- Angular template accessibility and modern control-flow checks
- Deterministic import and export sorting
- Type-only import enforcement
- Consistent class member ordering and blank lines between methods
- Prettier formatting for TypeScript, Angular HTML, SCSS, JSON, and Markdown
- Shared VS Code format-on-save and ESLint fix settings
- A single `npm run check` quality gate for linting, formatting, tests, and production build
- Strict TypeScript configuration
- No implicit `any`
- Typed API responses
- Small and focused functions
- Single-responsibility classes
- Immutable state updates
- Dependency inversion
- Early returns
- Clear naming
- No business logic inside templates
- No direct store access from presentational components
- No duplicated API logic
- No magic strings or numbers

---

## SOLID Principles

### Single Responsibility

Each component, service, facade, repository, and store has one clear responsibility.

### Open/Closed Principle

Features are extended through abstractions and configuration instead of modifying unrelated existing code.

### Liskov Substitution

Repository implementations follow shared contracts and can be replaced without affecting consumers.

### Interface Segregation

Small feature-specific interfaces are preferred over large shared models.

### Dependency Inversion

Business logic depends on repository abstractions rather than concrete HTTP implementations.

---

## Patterns Used

- Facade Pattern
- Repository Pattern
- Smart and Presentational Components
- Adapter Pattern
- Strategy Pattern
- Builder Pattern
- Dependency Injection
- Unidirectional Data Flow
- Feature Slices
- Container and Presenter Pattern

---

## Environment Configuration

Environment-specific values are provided through configuration.

```ts
export interface ApplicationConfig {
  apiUrl: string;
  production: boolean;
  enableLogging: boolean;
  paymentProvider: string;
}
```

Secrets are never committed to the repository.

---

## CI/CD

GitHub Actions validates each pull request.

The pipeline includes:

```text
Install dependencies
        ↓
Lint
        ↓
Type check
        ↓
Unit tests
        ↓
Production build
        ↓
End-to-end tests
        ↓
Docker image build
        ↓
Deployment
```

Branch protection can require:

- Successful pipeline execution
- Code review approval
- No unresolved comments
- Updated tests
- Conventional commit messages

---

## Git Workflow

The project uses feature branches.

```text
main
develop
feature/product-catalogue
feature/shopping-cart
feature/checkout
fix/cart-total-calculation
refactor/catalogue-state
```

Commit examples:

```text
feat(cart): add quantity update functionality
fix(auth): prevent duplicate refresh-token requests
refactor(catalogue): extract product repository
test(checkout): add shipping form integration tests
```

---

## Development Roadmap

### Phase 1 — Foundation

- Configure Angular project
- Configure ESLint and Prettier
- Create application shell
- Add routing
- Create design tokens
- Configure mock API

### Phase 2 — Product Catalogue

- Product listing
- Product filtering
- Product sorting
- Search
- Pagination
- Product details

### Phase 3 — Shopping Cart

- Cart state
- Cart persistence
- Price calculation
- Quantity management
- Stock validation

### Phase 4 — Authentication

- Login
- Registration
- Route guards
- Token interceptor
- Refresh-token flow

### Phase 5 — Checkout

- Shipping address
- Delivery method
- Payment method
- Order summary
- Order confirmation

### Phase 6 — User Account

- Profile
- Addresses
- Orders
- Wishlist

### Phase 7 — Administration

- Product management
- Inventory
- Orders
- Users
- Analytics

### Phase 8 — Production Readiness

- SSR or prerendering
- Accessibility audit
- Performance audit
- End-to-end tests
- CI/CD
- Docker deployment

---

## What This Project Demonstrates

ShoppyShop demonstrates the ability to:

- Design scalable Angular architecture
- Build complex reactive user interfaces
- Manage local and global application state
- Create reusable components
- Work with asynchronous APIs
- Apply RxJS operators correctly
- Implement secure authentication flows
- Optimize performance
- Write maintainable and testable code
- Apply SOLID principles and design patterns
- Build features using real production-style workflows
- Deliver a complete application from architecture to deployment

---

## Future Improvements

- Real payment-provider integration
- Product recommendation engine
- Real-time inventory updates
- WebSocket order notifications
- Internationalization
- Multi-currency support
- Offline mode
- PWA installation
- Advanced analytics dashboard
- Feature flags
- Micro-frontend experiment
- Full ASP.NET Core back end
- Kubernetes deployment

---

## Project Status

The project is under active development and is being built as a portfolio application to demonstrate professional Angular engineering skills, architectural decision-making, and real-world e-commerce development.

### Implemented Foundation

The current Angular 22 application includes:

- Accessible signal-based tabs with keyboard navigation
- Mock authentication session restoration and functional route guards
- Public catalogue browsing with session-aware sign-in and customer-only navigation
- Lazy product catalogue, filtering, details, and persistent basket flows
- Route-backed delivery, payment, and order-review checkout steps
- Mock payment tokenization that never persists raw card data
- MSW-backed order creation and refresh-safe order confirmation
- Protected purchase history with seeded orders and newly completed checkout orders
- Responsive application navigation with active states and basket count
- Vitest unit and integration coverage for UI, repositories, guards, and state services

NgRx remains intentionally deferred until a stable release officially supports Angular 22. State boundaries use facades and repository abstractions so NgRx can be introduced without rewriting page components.
