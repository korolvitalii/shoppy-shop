# ShoppyShop

ShoppyShop is a responsive e-commerce application for browsing products and completing a simulated purchase journey. It uses a mocked API, so the project runs locally without a separate back end.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

Use the demo account to access customer features:

- Email: `demo@shoppyshop.test`
- Password: `ShoppyShop123!`

## Key features

- Responsive product catalogue and detailed product pages
- Search suggestions, category filters, sorting, and price filters
- Persistent favourites and shopping basket
- Multi-step checkout with delivery, mock payment, review, and confirmation
- Customer login, protected routes, and purchase history
- English and Polish interface
- Light and dark themes
- Accessible navigation, dialogs, forms, loading states, and error feedback
- Mock API powered by Mock Service Worker

## Quality checks

```bash
npm run check
```

The project uses Angular, TypeScript, RxJS, Signals, SCSS, Vitest, ESLint, and Prettier.
