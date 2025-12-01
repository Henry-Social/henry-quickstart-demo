# Henry Quickstart Demo

A minimal Next.js app demonstrating the complete Henry API quickstart flow.

## Features

This demo showcases:

- Product Search – Search for products from supported merchants
- Product Details – Get detailed information including variants and pricing
- Add to Cart – Add products with selected variants to cart
- Checkout – Create checkout session and redirect to Henry's hosted checkout

## Setup

1. **Install dependencies:**

```bash
bun install
```

2. **Configure environment variables:**

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Henry API key.

3. **Run the development server:**

```bash
bun dev
```

4. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

The app demonstrates the complete flow from the quickstart guide:

1. **Search Products** - Enter a search query (e.g., "nike shoes")
2. **View Details** - Click on any product to fetch detailed information
3. **Buy Now** - Click the buy button to add to cart and create checkout
4. **Complete Purchase** - You'll be redirected to Henry's checkout page

## Architecture

```
app/
├── page.tsx                    # Main UI with search, display, and buy flow
├── api/henry/                  # API routes that proxy to Henry API
│   ├── products/
│   │   ├── search/route.ts    # Product search endpoint
│   │   └── details/route.ts   # Product details endpoint
│   └── cart/
│       ├── add/route.ts       # Add to cart endpoint
│       └── checkout/route.ts  # Create checkout endpoint
```

## Key Files

- `app/page.tsx` - Complete UI implementation matching the quickstart guide
- `app/api/henry/*` - Backend API routes that use the Henry TypeScript SDK to call Henry APIs
- Each API route authenticates with Henry via a server-side API key

## Mock User System

The app generates a random user ID for each session to simulate user authentication without requiring a full auth system.

## Environment Variables

- `HENRY_API_KEY` - Your Henry API key (required)
- `HENRY_ENV` - Target environment: `sandbox` or `production` (defaults to `sandbox`)
- `HENRY_SDK_BASE_URL` - Optional override for the SDK base URL (advanced)

## Testing

1. Search for products like "nike shoes" or "running shoes"
2. Click on any product to see details
3. Click "Buy Now with Henry" to complete the flow
4. You'll be redirected to Henry's checkout page in a new tab
