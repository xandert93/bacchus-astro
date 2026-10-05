// High Tea: an afternoon table in three tiers (Jasmine, Hibiscus, Tulip).
// The catalogue marks no dish here as vegetarian, unlike Reception and
// Banquet, so none is marked — inferring it from dish names risks
// mislabelling food for a guest with a dietary requirement. No dish
// photography yet: black "photo to follow" tiles.
import type { PackageTier } from "./types"

export const HIGH_TEA_TIERS: PackageTier[] = [
  {
    id: "jasmine",
    name: "Jasmine",
    eyebrow: "High Tea",
    price: "€35",
    priceUnit: "per person",
    description:
      "The lightest of the three — five dainty sandwiches, two hot savouries, scones and a short table of sweets.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Cured Salmon Sandwich", initials: "CS" },
      { name: "Strawberry & Foamed Cream Scones", initials: "SC" },
      { name: "Almond Cake", initials: "AC" },
    ],
    groups: [
      {
        title: "Dainty Sandwiches",
        items: [
          { name: "Serrano Ham, Aged Smoked Cheese, Tomato Relish" },
          { name: "Roasted Cajun Chicken, Crispy Pancetta, Guacamole Roll" },
          { name: "Cured Salmon, Dill Yoghurt, Sliced Cucumber, Salmon Roe" },
          { name: "Roast Beef Brisket, Horseradish Cream, Truffle" },
          { name: "Grilled Aubergine, Hummus Spread, Fig Salsa Roll" },
        ],
      },
      {
        title: "Hot Savouries",
        items: [{ name: "Feta & Spinach Puffs" }, { name: "Beef Trellis" }],
      },
      {
        title: "Hot Sweets",
        items: [
          { name: "Strawberry & Foamed Cream Scones" },
          { name: "Banana Bread, Walnut Cremieux & Dehydrated Banana" },
        ],
      },
      {
        title: "Heavenly Sweets",
        items: [
          { name: "Cherry & Coconut Lamingtons" },
          { name: "Assorted Macarons" },
          { name: "Coffee, Chocolate & Walnut Cake" },
          { name: "Hazelnut & Sheep Ricotta Cannolo" },
          { name: "Almond Cake" },
        ],
      },
    ],
  },
  {
    id: "hibiscus",
    name: "Hibiscus",
    eyebrow: "High Tea",
    price: "€45",
    priceUnit: "per person",
    description:
      "Two more sandwiches, three hot savouries, home-made rolls and a fuller sweet table.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Grouper Mousse Sandwich", initials: "GM" },
      { name: "Porcini Quiche", initials: "PQ" },
      { name: "Date & Ginger Tea Loaf", initials: "DL" },
    ],
    groups: [
      {
        title: "Dainty Sandwiches",
        items: [
          { name: "Serrano Ham, Aged Smoked Cheese, Tomato Relish" },
          { name: "Roasted Cajun Chicken, Crispy Pancetta, Guacamole Roll" },
          { name: "Cured Salmon, Dill Yoghurt, Sliced Cucumber, Salmon Roe" },
          { name: "Roast Beef Brisket, Horseradish Cream, Truffle" },
          { name: "Grilled Aubergine, Hummus Spread, Fig Salsa Roll" },
          { name: "Brie, Fruit Compote, Crispy Onions" },
          { name: "Grouper Mousse, Tartare Cream, Fried Leeks" },
        ],
      },
      {
        title: "Hot Savouries",
        items: [
          { name: "Pancetta & Caramelised Onion Quiche" },
          { name: "Asparagus & Porcini Quiche" },
          { name: "Pecorino & Guanciale Muffins" },
        ],
      },
      {
        title: "Homemade Rolls",
        items: [
          { name: "Lamb, Mint & Feta Rolls" },
          { name: "Traditional Pigs in Blankets" },
        ],
      },
      {
        title: "Hot Sweets",
        items: [
          { name: "Strawberry & Foamed Cream Scones" },
          { name: "Banana Bread, Walnut Cremieux & Dehydrated Banana" },
        ],
      },
      {
        title: "Heavenly Sweets",
        items: [
          { name: "Cherry & Coconut Lamingtons" },
          { name: "Assorted Macarons" },
          { name: "Carrot & Tahini Muffins" },
          { name: "Date & Ginger Tea Loaf" },
          { name: "Coffee, Chocolate & Walnut Cake" },
          { name: "Hazelnut & Sheep Ricotta Cannolo" },
          { name: "Almond Cake" },
        ],
      },
    ],
  },
  {
    id: "tulip",
    name: "Tulip",
    eyebrow: "High Tea",
    price: "€55",
    priceUnit: "per person",
    description:
      "The full table — seven savouries including quiches and open pies, three rolls, and every sweet on the list.",
    dishesLabel: "Signature dishes",
    dishes: [
      { name: "Lamb, Mint & Feta Rolls", initials: "LR" },
      { name: "Zucchini & Chevre Open Pie", initials: "ZC" },
      { name: "Ricotta Cannolo", initials: "RC" },
    ],
    groups: [
      {
        title: "Dainty Sandwiches",
        items: [
          { name: "Serrano Ham, Aged Smoked Cheese, Tomato Relish" },
          { name: "Roasted Cajun Chicken, Crispy Pancetta, Guacamole Roll" },
          { name: "Cured Salmon, Dill Yoghurt, Sliced Cucumber, Salmon Roe" },
          { name: "Roast Beef Brisket, Horseradish Cream, Truffle" },
          { name: "Grilled Aubergine, Hummus Spread, Fig Salsa Roll" },
          { name: "Brie, Fruit Compote, Crispy Onions" },
          { name: "Grouper Mousse, Tartare Cream, Fried Leeks" },
        ],
      },
      {
        title: "Hot Savouries",
        items: [
          { name: "Pancetta & Caramelised Onion Quiche" },
          { name: "Asparagus & Porcini Quiche" },
          { name: "Pecorino & Guanciale Muffins" },
          { name: "Feta & Spinach Puffs" },
          { name: "Bell Pepper & Dill Quiche" },
          { name: "Butternut Squash Pie" },
          { name: "Zucchini & Chevre Open Pie" },
        ],
      },
      {
        title: "Homemade Rolls",
        items: [
          { name: "Lamb, Mint & Feta Rolls" },
          { name: "Chicken Curry, Capsicum & Pine Nut Roll" },
          { name: "Traditional Pigs in Blankets" },
        ],
      },
      {
        title: "Hot Sweets",
        items: [
          { name: "Strawberry & Foamed Cream Scones" },
          { name: "Banana Bread, Walnut Cremieux & Dehydrated Banana" },
        ],
      },
      {
        title: "Heavenly Sweets",
        items: [
          { name: "Cherry & Coconut Lamingtons" },
          { name: "Assorted Macarons" },
          { name: "Carrot & Tahini Muffins" },
          { name: "Date & Ginger Tea Loaf" },
          { name: "Coffee, Chocolate & Walnut Cake" },
          { name: "Hazelnut & Sheep Ricotta Cannolo" },
          { name: "Almond Cake" },
        ],
      },
    ],
  },
]
