// The sixteen Reception stations: tables and towers layered onto any
// Reception tier, each priced per person. Two things here are OURS, not
// the catalogue's, and the page says so in its own notes:
//   • the six categories (and the order they put the stations in) — the
//     catalogue lists all sixteen flat;
//   • every vegetarian mark — the catalogue marks none on the stations, so
//     each is inferred from the dish name and unconfirmed by Bacchus;
//   • Pasta Table's shortened dish names ("Slow-Cooked Beef" for the
//     catalogue's "Slow-Cooked Beef & Parsley", and so on), an editorial
//     change still to be signed off. The prototype had drifted into two
//     versions of this card, one shortened and one not; this is the
//     shortened one, the version its notes describe.
// The photographs are AI-generated stand-ins (approved 2026-09-24 as a
// one-off), also labelled as such on the page.
import type { PackageMenuItem } from "./types"

export interface StationCategory {
  id: string
  // Full name, on the card eyebrow and as the tab's accessible label.
  label: string
  // The one word that fits on a tab.
  shortLabel: string
}

export interface Station {
  // The catalogue's numbering; the "add to selection" state keys off it.
  number: number
  category: string
  name: string
  price: string
  priceUnit: string
  // src is a key from src/lib/images.ts.
  photo: { src: string; alt: string }
  items: PackageMenuItem[]
  servingNote: string
}

export const STATION_CATEGORIES: StationCategory[] = [
  { id: "boards", label: "Boards & Cured", shortLabel: "Boards" },
  { id: "sea", label: "Fruits of the Sea", shortLabel: "Sea" },
  { id: "fire", label: "Grill & Roast", shortLabel: "Fire" },
  { id: "afield", label: "Across Asia", shortLabel: "Asia" },
  { id: "italian", label: "Pasta & Pizza", shortLabel: "Italy" },
  { id: "sweet", label: "To Finish", shortLabel: "Sweet" },
]

// In display order: grouped by category, not by number.
export const STATIONS: Station[] = [
  {
    number: 1,
    category: "boards",
    name: "Charcuterie Table",
    price: "€10.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/charcuterie-table",
      alt: "A board of Parma ham, bresaola, salami and chorizo with grissini and crackers",
    },
    items: [
      { name: "Parma ham" },
      { name: "Bresaola" },
      { name: "Salame Napoli" },
      { name: "Mortadella" },
      { name: "Chorizo" },
    ],
    servingNote: "Served with crackers, Grissini & freshly baked bread.",
  },
  {
    number: 2,
    category: "boards",
    name: "Fromagerie Table",
    price: "€12.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/fromagerie-table",
      alt: "Wedges of Parmigiano, blue stilton, red Leicester, Maasdam and camembert with crackers",
    },
    items: [
      { name: "Parmigiano Reggiano" },
      { name: "Red Leicester", vegetarian: true },
      { name: "Blue Stilton" },
      { name: "Cheddar", vegetarian: true },
      { name: "Maasdam", vegetarian: true },
      { name: "Camembert" },
    ],
    servingNote: "Served with crackers, Grissini & freshly baked bread.",
  },
  {
    number: 3,
    category: "boards",
    name: "Salumerie Table",
    price: "€12.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/salumerie-table",
      alt: "A platter of cured meats and cheeses carried through the hall",
    },
    items: [
      { name: "Parmigiano Reggiano" },
      { name: "Camembert" },
      { name: "Maasdam", vegetarian: true },
      { name: "Parma ham" },
      { name: "Bresaola" },
      { name: "Salame Napoli" },
    ],
    servingNote: "Served with crackers, Grissini & freshly baked bread.",
  },
  {
    number: 4,
    category: "boards",
    name: "Maltese Table",
    price: "€9.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/maltese-table",
      alt: "Terracotta bowls of bigilla, butter beans, sundried tomatoes, Ġbejniet, olives, octopus and Maltese sausage",
    },
    items: [
      { name: "Bigilla", vegetarian: true },
      { name: "Butter Beans", vegetarian: true },
      { name: "Sundried Tomatoes", vegetarian: true },
      { name: "Pickled Onions", vegetarian: true },
      { name: "Ġbejna" },
      { name: "Marinated Octopus" },
      { name: "Maltese Sausage" },
    ],
    servingNote: "Served with crackers, Grissini & freshly baked bread.",
  },
  {
    number: 5,
    category: "sea",
    name: "Oyster Royale",
    price: "€9.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/oyster-royale",
      alt: "Fresh oysters on crushed ice with three dressings",
    },
    items: [
      { name: "Lemon & Sea Salt" },
      { name: "Beef & Horseradish Jelly" },
      { name: "Coconut & Pomegranate Mignonette" },
    ],
    servingNote:
      "Fresh Gillardeau oysters, shucked to order, two per person, prepared three ways.",
  },
  {
    number: 6,
    category: "sea",
    name: "Lobster Fantasy",
    price: "€20.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/lobster-fantasy",
      alt: "Grilled lobster halves in the shell, glazed and served on a platter",
    },
    items: [
      { name: "Lemon & Sea Salt" },
      { name: "Classic Thermidor" },
      { name: "Garlic Butter" },
    ],
    servingNote: "Grilled lobster in the shell, half per person, prepared three ways.",
  },
  {
    number: 7,
    category: "fire",
    name: "BBQ Table",
    price: "€12.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/bbq-table",
      alt: "Steak, tuna and chicken cooked over open flame on the grill",
    },
    items: [
      { name: "Tagliata, Rocket & Parmesan" },
      { name: "Chicken Thigh & Marry Me Sauce" },
      { name: "Tuna & Chimichurri" },
    ],
    servingNote: "An open-flame selection of grilled meat and fish.",
  },
  {
    number: 13,
    category: "fire",
    name: "Porchetta Table",
    price: "€8.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/porchetta-table",
      alt: "Roast pork belly carved into slices on a wooden board",
    },
    items: [
      { name: "Focaccia", vegetarian: true },
      { name: "Roasted Baby Potato", vegetarian: true },
      { name: "Mixed Salad", vegetarian: true },
      { name: "Roasted Pork Belly" },
      { name: "Apple Sauce", vegetarian: true },
    ],
    servingNote: "Carved tableside, in front of your guests.",
  },
  {
    number: 8,
    category: "afield",
    name: "Indian Table",
    price: "€9.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/indian-table",
      alt: "Copper pots of curry with naan bread and basmati rice",
    },
    items: [
      { name: "Pork Vindaloo" },
      { name: "Beef Madras" },
      { name: "Lamb Rogan Josh" },
      { name: "Chicken Tikka Masala" },
      { name: "Curried Vegetables with Mango & Coconut", vegetarian: true },
    ],
    servingNote: "Served with naan bread and basmati rice.",
  },
  {
    number: 9,
    category: "afield",
    name: "Chinese Table",
    price: "€9.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/chinese-table",
      alt: "Steamed dumplings, fried rice and noodles served in bowls",
    },
    items: [
      { name: "Lemon Chicken" },
      { name: "Sweet & Sour Pork" },
      { name: "Black Bean Beef" },
      { name: "Stir-Fried Vegetables", vegetarian: true },
      { name: "Dumplings" },
    ],
    servingNote: "Served with prawn crackers, rice and noodles.",
  },
  {
    number: 10,
    category: "afield",
    name: "Japanese Table",
    price: "€15.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/japanese-table",
      alt: "Sushi, sashimi and gyoza arranged on a slate board with soy sauce",
    },
    items: [
      { name: "Sushi" },
      { name: "Sashimi" },
      { name: "Gyoza" },
      { name: "Gyudon Beef" },
      { name: "Teriyaki Pork" },
      { name: "Karaage Chicken" },
    ],
    servingNote: "Served with sushi rice, soy sauce, wakame & pickled ginger.",
  },
  {
    number: 11,
    category: "italian",
    name: "Pasta Table",
    price: "€8.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/pasta-table",
      alt: "Spaghetti finished tableside inside a hollowed parmesan wheel",
    },
    items: [
      { name: "Carbonara" },
      { name: "Garganelli, Two-Cheese & Black Olives", vegetarian: true },
      { name: "Lasagna Bianca, Pancetta & Chicken" },
      { name: "Slow-Cooked Beef" },
      { name: "Paccheri, Prawn & Cherry Tomatoes" },
      { name: "Truffle Mushroom Risotto", vegetarian: true },
    ],
    servingNote: "Choice of three, one finished live in a parmesan wheel.",
  },
  {
    number: 12,
    category: "italian",
    name: "Pizza Table",
    price: "€6.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/pizza-table",
      alt: "Freshly baked pizzas on wooden boards",
    },
    items: [
      { name: "Margherita", vegetarian: true },
      { name: "Marinara", vegetarian: true },
      { name: "Diavola" },
      { name: "Quattro Formaggi", vegetarian: true },
      { name: "Capricciosa" },
    ],
    servingNote: "Choice of three.",
  },
  {
    number: 14,
    category: "sweet",
    name: "Macaron Tower",
    price: "€2.50",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/macaron-tower",
      alt: "A tiered tower of pastel macarons",
    },
    items: [
      { name: "Chocolate", vegetarian: true },
      { name: "Vanilla", vegetarian: true },
      { name: "Strawberry", vegetarian: true },
      { name: "Hazelnut", vegetarian: true },
      { name: "Pistachio", vegetarian: true },
    ],
    servingNote: "Built around any flavour — our classics, shown here.",
  },
  {
    number: 15,
    category: "sweet",
    name: "Crêpe Table",
    price: "€6.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/crepe-table",
      alt: "A chef folding a crêpe beside bowls of berries, chocolate, nuts and syrup",
    },
    items: [
      { name: "Fresh Fruit", vegetarian: true },
      { name: "Assorted Nuts", vegetarian: true },
      { name: "Chocolate Crispies", vegetarian: true },
      { name: "Mini Marshmallows" },
      { name: "Clotted Cream", vegetarian: true },
      { name: "Maple Syrup", vegetarian: true },
      { name: "Nutella", vegetarian: true },
    ],
    servingNote: "Crêpe Suzette or plain, with a spread of condiments.",
  },
  {
    number: 16,
    category: "sweet",
    name: "Doughnut Wall",
    price: "€6.00",
    priceUnit: "per person",
    photo: {
      src: "reception-menu/stations/doughnut-wall",
      alt: "A wall of iced and sprinkled doughnuts on wooden pegs",
    },
    items: [
      { name: "Strawberry Jam", vegetarian: true },
      { name: "Coconut", vegetarian: true },
      { name: "Vanilla Frosted", vegetarian: true },
      { name: "Cream", vegetarian: true },
      { name: "White Chocolate", vegetarian: true },
      { name: "Caramel", vegetarian: true },
    ],
    servingNote: "Built around any flavour — our classics, shown here.",
  },
]
