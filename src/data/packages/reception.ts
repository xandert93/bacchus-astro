// Reception: three tiers of canapés, flying buffet and desserts (Daisy,
// Lavender, Rose). The signature-dish tiles carry real photography.
import type { PackageTier } from "./types"

export const RECEPTION_TIERS: PackageTier[] = [
  {
    id: "daisy",
    name: "Daisy",
    eyebrow: "Reception",
    price: "€53",
    priceUnit: "per person",
    description:
      "An elegant opening tier — ten cold and ten hot canapés, a three-dish flying buffet, four desserts, coffee and the wedding cake.",
    dishesLabel: "Signature dishes",
    dishes: [
      {
        name: "Smoked Salmon & Lobster Blinis",
        category: "Cold Canapé",
        photo: {
          src: "reception-menu/dishes/daisy-salmon-lobster-blinis",
          alt: "Smoked Salmon & Lobster Blinis, a cold canapé from the Daisy tier",
        },
      },
      {
        name: "Lamb Koftas & Sumac Yogurt",
        category: "Hot Canapé",
        photo: {
          src: "reception-menu/dishes/daisy-lamb-koftas",
          alt: "Lamb Koftas & Sumac Yogurt, a hot canapé from the Daisy tier",
        },
      },
      {
        name: "Cassatelle",
        category: "Dessert",
        photo: {
          src: "reception-menu/dishes/daisy-cassatelle",
          alt: "Cassatelle, a Maltese ricotta pastry from the Daisy tier's dessert selection",
        },
      },
    ],
    groups: [
      {
        title: "Cold Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Smoked Salmon & Lobster Blinis" },
          { name: "Mixed Herb & Capsicum Barquettes", vegetarian: true },
          { name: "Curried Hummus & Chorizo Biscuit Spoons" },
          { name: "Asparagus Tartar & Dill Mayo Tartlets", vegetarian: true },
          { name: "Bresaola & Chevre Cylinders" },
          { name: "Caprese Brochette, Basil Pesto", vegetarian: true },
          { name: "Parma Ham & Confit Fruit Bruschetta" },
          { name: "Trio of Fajitas (chicken, beef, vegetable)", vegetarian: true },
          { name: "Smoked Duck & Mango Chutney Croustade" },
        ],
      },
      {
        title: "Hot Canapés",
        items: [
          { name: "Carbonara Frittata" },
          { name: "Feta Cheese and Spinach Strudel", vegetarian: true },
          { name: "Salmon Skewers, Coconut & Chili Sauce" },
          { name: "Pigs in Blankets & Pickled Mayo" },
          { name: "Polenta Fritters, Tomato & Feta Cheese", vegetarian: true },
          { name: "Lamb Koftas & Sumac Yogurt" },
          { name: "Whitebait Cakes & Remoulade" },
          { name: "Mediterranean Vegetables Quiche", vegetarian: true },
          { name: "Oriental Mix with Sweet & Sour Sauce", vegetarian: true },
          { name: "Beef Patty, Caramelised Onions & Gruyère" },
        ],
      },
      {
        title: "Flying Buffet",
        items: [
          { name: "Chicken Korma & Basmati Rice" },
          { name: "Pork Belly & Apple Mustard Sauce" },
          { name: "Gnocchi Cacio e Pepe", vegetarian: true },
        ],
      },
      {
        title: "Desserts",
        items: [
          { name: "Honey & Chocolate Fudge" },
          { name: "Lemon Curd Meringue" },
          { name: "Cassatelle" },
          { name: "Almond Frangipane" },
        ],
      },
      {
        title: "Coffee Station",
        items: [{ name: "Krustini" }, { name: "Flavoured Coffee" }],
      },
      {
        title: "Wedding Cake",
        items: [
          { name: "Assorted Petit Four" },
          {
            name: "Classic Tiered Wedding Cake — one tier per one hundred contracted guests",
          },
        ],
      },
    ],
  },
  {
    id: "lavender",
    name: "Lavender",
    eyebrow: "Reception",
    price: "€57",
    priceUnit: "per person",
    description:
      "A richer interpretation — the same generous structure, with each course made a touch more indulgent.",
    dishesLabel: "Signature dishes",
    dishes: [
      {
        name: "Potato Terrine, Fresh Octopus, Crispy Guanciale",
        category: "Cold Canapé",
        photo: {
          src: "reception-menu/dishes/lavender-octopus-terrine",
          alt: "Potato Terrine, Fresh Octopus, Crispy Guanciale, a cold canapé from the Lavender tier",
        },
      },
      {
        name: "Prawn Tempura & Dynamite Sauce",
        category: "Hot Canapé",
        photo: {
          src: "reception-menu/dishes/lavender-prawn-tempura",
          alt: "Prawn Tempura & Dynamite Sauce, a hot canapé from the Lavender tier",
        },
      },
      {
        name: "Sea Salt & Dark Chocolate Tart",
        category: "Dessert",
        photo: {
          src: "reception-menu/dishes/lavender-chocolate-tart",
          alt: "Sea Salt & Dark Chocolate Tart, a dessert from the Lavender tier",
        },
      },
    ],
    groups: [
      {
        title: "Cold Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Potato Terrine, Fresh Octopus, Crispy Guanciale" },
          { name: "Aubergine Caviar & Black Olive Tartlets", vegetarian: true },
          { name: "Sheep Cheese Croute" },
          { name: "Ricotta & Seasonal Fruit Barquettes", vegetarian: true },
          { name: "Parmesan & Pancetta Muffins" },
          {
            name: "Crispy Polenta, Mushroom Duxelles, Truffle Mayo",
            vegetarian: true,
          },
          { name: "Smoked Mussel & Hummus Shells" },
          { name: "Tofu Mille Feuille", vegetarian: true },
          { name: "Chicken Liver Pate & Salted Cashew Crostini" },
        ],
      },
      {
        title: "Hot Canapés",
        items: [
          { name: "Carbonara Frittata" },
          { name: "Lentil Patties, Gouda, Sauerkraut", vegetarian: true },
          { name: "Bolognese Doughnut" },
          { name: "Lamb & Mint Rolls" },
          { name: "Sun-Dried Tomato Panisse", vegetarian: true },
          { name: "Chicken Satay & Peanut Sauce" },
          { name: "Prawn Tempura & Dynamite Sauce" },
          { name: "Gorgonzola & Caramelised Apple Gougères", vegetarian: true },
          { name: "Chicken in Filo & Sweet Chili Sauce" },
          { name: "Meatball, Crispy Onions, Potato Puree & Smoked Gouda" },
        ],
      },
      {
        title: "Flying Buffet",
        items: [
          { name: "Seasonal Risotto", vegetarian: true },
          { name: "Calamari Fritti & Tartare Sauce" },
          { name: "Ricotta Gnudi, Slow-Cooked Tomato, Basil", vegetarian: true },
        ],
      },
      {
        title: "Desserts",
        items: [
          { name: "Mango Parfait" },
          { name: "Sea Salt & Dark Chocolate Tart" },
          { name: "Fresh Fruit Tartlets" },
          { name: "Chocolate & Orange Mousse" },
        ],
      },
      {
        title: "Coffee Station",
        items: [{ name: "Krustini" }, { name: "Flavoured Coffee" }],
      },
      {
        title: "Wedding Cake",
        items: [
          { name: "Assorted Petit Four" },
          {
            name: "Classic Tiered Wedding Cake — one tier per one hundred contracted guests",
          },
        ],
      },
    ],
  },
  {
    id: "rose",
    name: "Rose",
    eyebrow: "Reception",
    price: "€64",
    priceUnit: "per person",
    description:
      "Our most refined tier — foie gras, oysters and scallops meet a lavish flying buffet, desserts, coffee and cake.",
    dishesLabel: "Signature dishes",
    dishes: [
      {
        name: "Foie Gras & Smoked Duck Croustade",
        category: "Cold Canapé",
        photo: {
          src: "reception-menu/dishes/rose-foie-gras-croustade",
          alt: "Foie Gras & Smoked Duck Croustade, a cold canapé from the Rose tier",
        },
      },
      {
        name: "Oyster & Alsace Bacon",
        category: "Hot Canapé",
        photo: {
          src: "reception-menu/dishes/rose-oyster-bacon",
          alt: "Oyster & Alsace Bacon, a hot canapé from the Rose tier",
        },
      },
      {
        name: "Marinated Scallop & Ikura Crostini",
        category: "Cold Canapé",
        photo: {
          src: "reception-menu/dishes/rose-scallop-crostini",
          alt: "Marinated Scallop & Ikura Crostini, a cold canapé from the Rose tier",
        },
      },
    ],
    groups: [
      {
        title: "Cold Canapés",
        items: [
          { name: "Brie & Candied Walnuts Leaves", vegetarian: true },
          { name: "Red Prawn & Chorizo Roll" },
          { name: "Aubergine Caviar & Black Olive Tartlets", vegetarian: true },
          { name: "Parmesan & Parma Ham Eclairs" },
          { name: "Pani Puri", vegetarian: true },
          { name: "Smoked Tuna & Seabass Mousseline" },
          {
            name: "Crispy Polenta, Mushroom Duxelles, Truffle Mayo",
            vegetarian: true,
          },
          { name: "Marinated Scallop & Ikura Crostini" },
          { name: "Caesar Barquettes (classic & chicken)", vegetarian: true },
          { name: "Foie Gras & Smoked Duck Croustade" },
        ],
      },
      {
        title: "Hot Canapés",
        items: [
          { name: "Lasagna Frittata" },
          { name: "Feta Cheese and Spinach Strudel", vegetarian: true },
          { name: "Oyster & Alsace Bacon" },
          { name: "Lamb Kebab & Salsa Verde" },
          { name: "Latkes, Crème Fraiche, Apple Puree", vegetarian: true },
          { name: "Chicken Saltimbocca & Marsala Sauce" },
          { name: "Grey Meagre & Lemon Beurre Blanc" },
          { name: "Asparagus Clafoutis", vegetarian: true },
          { name: "Tsukune & Yakitori Tare" },
          { name: "Beef Brochette, Jus & Bearnaise Sauce" },
        ],
      },
      {
        title: "Flying Buffet",
        items: [
          { name: "Beccafico Ravioli, Lemon & Fennel Butter Sauce" },
          { name: "Beef Brisket & Manchego Fondue" },
          { name: "Ricotta Gnudi, Slow-Cooked Tomato, Basil", vegetarian: true },
        ],
      },
      {
        title: "Desserts",
        items: [
          { name: "Seasonal Cheesecake" },
          { name: "Apple Confit & Cinnamon Mousse" },
          { name: "Gianduja & Hazelnut Tart" },
          { name: "Goat Cheese, Pear, Shiso & Gavotte Biscuit" },
        ],
      },
      {
        title: "Coffee Station",
        items: [{ name: "Krustini" }, { name: "Flavoured Coffee" }],
      },
      {
        title: "Wedding Cake",
        items: [
          { name: "Assorted Petit Four" },
          {
            name: "Classic Tiered Wedding Cake — one tier per one hundred contracted guests",
          },
        ],
      },
    ],
  },
]
