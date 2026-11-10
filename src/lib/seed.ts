import type { Cart, Member } from "./types";

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

// 555-01xx numbers are reserved for fiction
const PHONES: Record<string, string> = {
  "u-rose": "4135550101",
  "u-maya": "4135550102",
  "u-alex": "4135550103",
  "u-jordan": "4135550104",
  "u-sam": "4135550106",
  "u-nina": "4135550107",
  "u-dev": "4135550108",
};

const m = (userId: string, name: string, venmo: string, itemsTotal: number, itemsNote?: string): Member => ({
  userId,
  name,
  venmo,
  phone: PHONES[userId],
  itemsTotal,
  itemsNote,
  paid: false,
  joinedAt: ago(1),
});

// Demo carts. Rose and Alex are the personas from our deck.
export function seedCarts(): Cart[] {
  const carts: Cart[] = [
    {
      id: "c-target-sw",
      storeId: "target",
      hostId: "u-rose",
      area: "Southwest",
      deadline: inHours(3),
      minPeople: 2,
      status: "open",
      members: [
        m("u-rose", "Rose", "rose-umass", 14.5, "Command strips + desk lamp"),
        m("u-maya", "Maya", "maya-k", 9.9, "Shampoo"),
      ],
      createdAt: ago(2),
    },
    {
      id: "c-hm-central",
      storeId: "hm",
      hostId: "u-alex",
      area: "Central",
      deadline: inHours(6),
      minPeople: 2,
      status: "open",
      members: [
        m("u-alex", "Alex", "alex-j", 24.99, "Basic tees x2"),
        m("u-jordan", "Jordan", "jordanlee", 17.99, "Beanie"),
        m("u-priya", "Priya", "priya-s", 12, "Socks pack"),
      ],
      createdAt: ago(3),
    },
    {
      id: "c-sephora-sylvan",
      storeId: "sephora",
      hostId: "u-sam",
      area: "Sylvan",
      deadline: inHours(0.75),
      minPeople: 2,
      status: "open",
      members: [
        m("u-sam", "Sam", "samwise", 32, "Moisturizer"),
        m("u-nina", "Nina", "nina-r", 22, "Lip balm + cleanser"),
      ],
      createdAt: ago(5),
    },
    {
      id: "c-uniqlo-oh",
      storeId: "uniqlo",
      hostId: "u-dev",
      area: "Orchard Hill",
      deadline: inHours(26),
      minPeople: 3,
      status: "open",
      members: [m("u-dev", "Dev", "dev-p", 49.9, "Ultra light down vest")],
      createdAt: ago(1),
    },
  ];
  // hosts pay up front, so they start as paid
  return carts.map((c) => ({ ...c, members: c.members.map((x, i) => (i === 0 ? { ...x, paid: true } : x)) }));
}
