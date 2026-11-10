# SplitCart

Get matched with UMass students ordering from the same store, hit the free shipping minimum together, and split the cost.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with any `.edu` email. Nothing is sent yet, it's all local.
To get the demo carts back, open the account menu (top right) and hit "Reset demo carts".

## How it works

1. Sign up with a `.edu` email, Venmo handle, area, and optionally a phone number.
2. Tell us what you're ordering: the store, your total and when you want to order.
3. We match you with open carts from the same store. Same area and similar timing rank higher.
4. No match? Open your own cart and the next person ordering from that store gets matched to you.
5. People in the same cart can see each other's numbers to figure out the handoff.
6. Once the cart hits free shipping, the host checks out and everyone Venmos the host their share.

## Project layout

```
src/app/            pages (landing, /carts, /match, /carts/[id])
src/components/     UI pieces and the useApp store hook
src/lib/match.ts    matching and ranking
src/lib/split.ts    who owes what
src/lib/repo.ts     data layer (localStorage for now)
src/lib/stores.ts   stores and their free shipping minimums
supabase/           draft database schema
```

## Stack

Next.js, Tailwind, Motion. Data lives in localStorage until we hook up Supabase.

## Not done yet

- Real sign-in and database (Supabase)
- In-app payments
- Notifications
