// Banquet: a six-course seated dinner in three tiers (Orchid, Dahlia,
// Sunflower). PRICES ARE CONTESTED: the client quote says these figures,
// separate client correspondence says banqueting starts around €135 per
// person. The page states the conflict under the tier cards; keep it there
// until Bacchus confirms which governs. No dish photography yet: the
// signature dishes render as black "photo to follow" tiles.
import type { PackageTier } from "./types"

export const BANQUET_TIERS: PackageTier[] = [
  {
    id: "orchid",
    name: "Orchid",
    eyebrow: "Banquet",
    price: "€65",
    priceUnit: "per person",
    description:
      "The opening banquet tier — carpaccio and ceviche to start, house pasta and risotto, then beef or grey meagre.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Beef Carpaccio", initials: "BC" },
      { name: "Aquarello Risotto", initials: "AR" },
      { name: "Dark Chocolate & Chilli Tart", initials: "DC" },
    ],
    groups: [
      {
        title: "Welcome Drink & Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Smoked Salmon & Lobster Blinis" },
        ],
      },
      {
        title: "Starter Course",
        items: [
          { name: "Beef Carpaccio & Textures of Parmesan" },
          { name: "Octopus Carpaccio, Apple & Radish Salad & Apple Jelly" },
        ],
      },
      {
        title: "Intermediate Course",
        items: [
          { name: "Liguria Trofie, Beef Brisket & Goat's Cheese Fondue" },
          { name: "Aquarello Risotto, Squid Ink & Slow-Cooked Octopus" },
        ],
      },
      {
        title: "Main Course",
        items: [
          { name: "Shin of Beef, Bone Marrow Custard & Espagnole Sauce" },
          { name: "Grey Meagre, Seasonal Chutney, Lemon & Ginger Beurre Blanc" },
        ],
      },
      {
        title: "Dessert Course",
        items: [
          { name: "Dark Chocolate & Chilli Tart & Biscotto Ice-Cream" },
          { name: "Baked & Glazed White Chocolate Cheesecake & Strawberry Sorbet" },
        ],
      },
      {
        title: "Celebratory Drink & Wedding Cake",
        items: [{ name: "Wedding Cake — one tier per one hundred guests" }],
      },
    ],
  },
  {
    id: "dahlia",
    name: "Dahlia",
    eyebrow: "Banquet",
    price: "€85",
    priceUnit: "per person",
    description:
      "A richer middle tier — terrine and scallop ceviche, home-made tortellini and lasagna, striploin or sea bass.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Scallop Ceviche", initials: "SC" },
      { name: "Duck Tortellini", initials: "DT" },
      { name: "Beef Striploin", initials: "BS" },
    ],
    groups: [
      {
        title: "Welcome Drink & Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Smoked Salmon & Lobster Blinis" },
        ],
      },
      {
        title: "Starter Course",
        items: [
          { name: "Chicken Terrine with Apricot & Pistachio" },
          { name: "Scallop Ceviche, Pickled Radish & Textures of Orange" },
        ],
      },
      {
        title: "Intermediate Course",
        items: [
          { name: "Home-Made Duck Tortellini, Parmesan & Jus" },
          { name: "Home-Made Lasagna 'Bianca' with Chicken & Pancetta" },
        ],
      },
      {
        title: "Main Course",
        items: [
          { name: "Beef Striploin, Sunchoke & Béarnaise" },
          { name: "Steamed Smoky Sea Bass, Aubergine, Black Olives & Chevre" },
        ],
      },
      {
        title: "Dessert Course",
        items: [
          { name: "Brioche, Gianduja Mousse & Walnut Streusel" },
          {
            name: "Ricotta Tart, Pistachio Cream, Seasonal Berry Compote & Green Tea",
          },
        ],
      },
      {
        title: "Celebratory Drink & Wedding Cake",
        items: [{ name: "Wedding Cake — one tier per one hundred guests" }],
      },
    ],
  },
  {
    id: "sunflower",
    name: "Sunflower",
    eyebrow: "Banquet",
    price: "€95",
    priceUnit: "per person",
    description:
      "Our most lavish banquet — prawn crudo and beef tartare, truffle agnolotti or lobster ravioli, fillet with foie gras.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Prawn Crudo", initials: "PC" },
      { name: "Lobster Ravioli", initials: "LR" },
      { name: "Beef Fillet", initials: "BF" },
    ],
    groups: [
      {
        title: "Welcome Drink & Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Smoked Salmon & Lobster Blinis" },
        ],
      },
      {
        title: "Starter Course",
        items: [
          { name: "Prawn Crudo, Seasonal Fruit & Prosciutto di San Daniele" },
          { name: "Beef Tartare, Brown Butter Hollandaise & Croutons" },
        ],
      },
      {
        title: "Intermediate Course",
        items: [
          { name: "Home-Made Black Truffle Agnolotti" },
          { name: "Home-Made Lobster Ravioli & Prawn Bisque" },
        ],
      },
      {
        title: "Main Course",
        items: [
          { name: "Beef Fillet, Foie Gras, Truffle & Jus" },
          { name: "Tuna Steak, Cannellini Puree & Pickled Vegetables" },
        ],
      },
      {
        title: "Dessert Course",
        items: [
          { name: "Symphony of Valrhona Chocolate" },
          { name: "Le Grand Opera — a Bacchus classic" },
        ],
      },
      {
        title: "Celebratory Drink & Wedding Cake",
        items: [{ name: "Wedding Cake — one tier per one hundred guests" }],
      },
    ],
  },
]
