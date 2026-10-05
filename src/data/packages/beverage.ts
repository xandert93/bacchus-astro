// Beverage: four categories chosen together, not ranked alternatives —
// it is added alongside whichever meal format a couple picks. The catalogue
// prints no prices; the figures here come from the client quote, which is
// why the page carries a warning note about them. Corkage is deliberately
// not shown: the quote gives an amount without saying per bottle or per
// person.
import type { PackageTier } from "./types"

export const BEVERAGE_TIERS: PackageTier[] = [
  {
    id: "local-wine",
    name: "Local Wine",
    eyebrow: "Beverage",
    price: "€30",
    priceUnit: "per person",
    description:
      "Maltese and Gozitan wines, free flow, with beer, soft drinks and juices alongside.",
    intro:
      "Wine packages are based on free flow wine, beer, water, soft drinks and juices, and service of coffee and tea with dessert.",
    groups: [
      {
        title: "Maltese Package",
        items: [
          {
            name: "1919 D.O.K",
            meta: "Chardonnay, Girgentina · Marsovin, Malta",
            note: "A dry, rounded smooth white wine of character with ripe citrus flavours and an elegant long finish.",
          },
          {
            name: "1919 D.O.K",
            meta: "Gellewza, Merlot · Marsovin, Malta",
            note: "A complex, smooth full bodied red wine with plenty of ripe, velvety tannins and a very pleasant, long lingering finish.",
          },
          {
            name: "1919 D.O.K",
            meta: "Gellewza, Grenache, Shiraz · Marsovin, Malta",
            note: "A dry, medium to full bodied wine with an engaging freshness, round texture and flavours of pomegranate and orange rind with a long-lasting sophisticated aftertaste.",
          },
        ],
      },
      {
        title: "Gozitan Package",
        items: [
          {
            name: "Victoria Heights D.O.K",
            meta: "Chardonnay · Delicata, Malta",
            note: "A fruity, full-flavoured dry white wine with flavours suggestive of ripe citrus fruit and the netted melon.",
          },
          {
            name: "Victoria Heights D.O.K",
            meta: "Merlot · Delicata, Malta",
            note: "A rounded merlot which boasts a sweet, fruited palate of red berries and plum. The tannins are supple and ripe.",
          },
          {
            name: "Victoria Heights D.O.K",
            meta: "Shiraz Rosé · Delicata, Malta",
            note: "A dry rosé which offers bright floral aromas and flavours of red summer fruits and spice.",
          },
        ],
      },
      {
        title: "Included With Every Wine Package",
        items: [
          { name: "Beer — Cisk, Cisk Excel, Heineken" },
          {
            name: "Soft drinks — Pepsi, Kinnie, 7-Up, Miranda, Diet Pepsi, Diet Kinnie, Diet 7-Up",
          },
          { name: "Juices — orange, apple, cranberry, pineapple" },
        ],
      },
    ],
  },
  {
    id: "foreign-wine",
    name: "Foreign Wine",
    eyebrow: "Beverage",
    price: "€35",
    priceUnit: "per person",
    description:
      "Italian and French wines, free flow, with beer, soft drinks and juices alongside.",
    intro:
      "Wine packages are based on free flow wine, beer, water, soft drinks and juices, and service of coffee and tea with dessert.",
    groups: [
      {
        title: "Italian Package",
        items: [
          {
            name: "Gavi Di Gavi ‘La Giustiniana’ D.O.C.G",
            meta: "Cortese · Terre Antich, Italy",
            note: "Straw yellow with greenish reflections. Aroma: thin, persistent, a hint of green apple. Taste: acidulous, with an almond aftertaste.",
          },
          {
            name: "Chianti ‘Villa Chigi’ D.O.C.G",
            meta: "Sangiovese · Poggio Bonelli, Italy",
            note: "Bright ruby red with purple hues. Soft and well-balanced on the palate with recurring fruity undertones. Geranium, pepper and cherry feature on the nose, with some slightly vinous notes.",
          },
          {
            name: "Diantha Rosé",
            meta: "Malvasia, Nero d’Avola · Cantine Pellegrino, Sicily",
            note: "A bright pale pink wine with fruity notes of wild strawberries and pomegranate, blended with floral hints of orange blossom and jasmine.",
          },
        ],
      },
      {
        title: "French Package",
        items: [
          {
            name: "Chablis A.O.C",
            meta: "Unoaked Chardonnay · Domaine Passy Le Clou, France",
            note: "A classic, unoaked Chardonnay characterised by bright citrus, green apple and white peach notes, paired with a distinct mineral, stony finish.",
          },
          {
            name: "Saint-Émilion A.O.C",
            meta: "Merlot, Cabernet Sauvignon, Cabernet Franc · Château La Pointe Bouquey, France",
            note: "A soft and well-balanced wine with aromas of red fruits, cedar wood and vanilla; layers of fruit on the palate are rounded off by silky, already integrated tannins.",
          },
          {
            name: "Sancerre Rosé A.O.C",
            meta: "Pinot Noir · Domaine de la Garenne, France",
            note: "Fresh and fruity, featuring a ‘fruit basket’ of red berries (raspberry, cherry) and citrus like grapefruit or lemon peel.",
          },
        ],
      },
      {
        title: "Included With Every Wine Package",
        items: [
          { name: "Beer — Cisk, Cisk Excel, Heineken" },
          {
            name: "Soft drinks — Pepsi, Kinnie, 7-Up, Miranda, Diet Pepsi, Diet Kinnie, Diet 7-Up",
          },
          { name: "Juices — orange, apple, cranberry, pineapple" },
        ],
      },
    ],
  },
  {
    id: "bar-options",
    name: "Bar Options",
    eyebrow: "Beverage",
    price: "from €12",
    priceUnit: "per person",
    description:
      "A full open bar, a reduced one, or corkage on your own wines and spirits.",
    intro:
      "Every bar option includes the bar set-up, ice, glasses, standard garnish and barmen, a welcome drink on arrival and a congratulatory drink at the cutting of the cake.",
    groups: [
      {
        title: "Open Bar — Spirits",
        items: [
          { name: "J&B" },
          { name: "Jameson" },
          { name: "Johnnie Walker Red Label" },
          { name: "Jack Daniels" },
          { name: "Smirnoff" },
          { name: "Gordon’s Gin" },
          { name: "Gordon’s Pink Gin" },
          { name: "Bacardi Rum" },
          { name: "Captain Morgan Spiced Rum" },
          { name: "Aperol" },
          { name: "Campari" },
          { name: "Martini Rosso" },
          { name: "Martini Dry" },
          { name: "Martini Bianco" },
          { name: "Averna" },
          { name: "Jägermeister" },
          { name: "Amaretto" },
          { name: "Malibu" },
          { name: "Baileys" },
          { name: "Tequila" },
          { name: "Blue Curacao" },
          { name: "Passoa" },
          { name: "Henessey" },
        ],
      },
      {
        title: "Open Bar — Wine, Beer & Mixers",
        items: [
          { name: "Wine — foreign white, red and rosé, and Prosecco" },
          { name: "Beer — Cisk, Cisk Excel, Heineken" },
          {
            name: "Mixers — Pepsi, Kinnie, 7-Up, Miranda, Diet Pepsi, Diet Kinnie, Diet 7-Up, tonic water, soda water, ginger ale, still and sparkling water",
          },
          { name: "Juices — orange, apple, cranberry, pineapple" },
        ],
      },
      {
        title: "Open Bar, Excluding Spirits & Wine",
        items: [
          { name: "A smaller bar package, same set-up and service" },
          { name: "Beer — Cisk, Cisk Excel, Heineken" },
          {
            name: "Mixers — Pepsi, Kinnie, 7-Up, Miranda, Diet Pepsi, Diet Kinnie, Diet 7-Up, tonic water, soda water, ginger ale, still and sparkling water",
          },
          { name: "Juices — orange, apple, cranberry, pineapple" },
        ],
      },
      {
        title: "Corkage",
        items: [
          {
            name: "Wines and spirits may be brought in, with a corkage fee covering bar set-up, ice, glasses, standard garnish and barmen",
          },
        ],
      },
      {
        title: "Premium Upgrades",
        items: [
          {
            name: "Upgrades and tailored beverage options are available on request",
          },
        ],
      },
      {
        title: "Bar & Table Ratios",
        items: [
          { name: "One bar per 250 guests" },
          { name: "One bistro table per 50 guests" },
          {
            name: "A supplement applies to any additions falling outside these ratios",
          },
        ],
      },
    ],
  },
  {
    id: "themed-bars",
    name: "Themed Bars",
    eyebrow: "Beverage",
    price: "On request",
    description:
      "Cocktails, whiskey, gin, rum, a champagne tower or a cigar bar — added alongside your bar package.",
    intro:
      "Themed bars do not form part of the open bar package. The brands below are the standard selection; a fuller list of premium spirits and alternative cocktails is available on request. Each themed bar includes the bar set-up, ice, glasses, garnishes and barmen.",
    groups: [
      {
        title: "Cocktail Bar",
        subhead: "Service of five craft cocktails",
        items: [
          { name: "Rosemary & Orange Moscow Mule" },
          { name: "Maple Smokey Whiskey Sour" },
          { name: "Piña Colada Roja" },
          { name: "Vanilla & Ginger Martini" },
          { name: "Peppermint Spritz" },
        ],
      },
      {
        title: "Whiskey Bar",
        subhead: "Service of five premium whiskies",
        items: [
          { name: "Singleton (Speyside) 12yrs" },
          { name: "Glenfiddich (Speyside) 12yrs" },
          { name: "Talisker (Skye) 12yrs" },
          { name: "Lagavulin (Islay) 12yrs" },
          { name: "Glenmorangie (Highlands) 12yrs" },
          { name: "Yamazaki (Suntory) 12yrs" },
        ],
      },
      {
        title: "Gin Bar",
        subhead: "Service of five premium gins",
        items: [
          { name: "Beefeater" },
          { name: "Hendricks" },
          { name: "Tanqueray" },
          { name: "Roku" },
          { name: "Malfy" },
        ],
      },
      {
        title: "Rum Bar",
        subhead: "Service of five premium rums",
        items: [
          { name: "Havana Club" },
          { name: "Bumbu" },
          { name: "Ron Barceló" },
          { name: "Mount Gay Black Barrel" },
          { name: "Angostura" },
          { name: "Sailor Jerry Spiced Rum" },
        ],
      },
      {
        title: "Champagne Tower",
        items: [
          {
            name: "A celebratory champagne, cascaded from the top to the base of a stacked glass tower",
          },
        ],
      },
      {
        title: "Cigar Bar",
        items: [{ name: "A choice of cigars for guests to enjoy" }],
      },
      {
        title: "Welcome & Celebratory Drink",
        items: [
          {
            name: "A glass of prosecco on arrival, or following the cutting of the cake",
          },
          { name: "A choice of canapés may be included" },
        ],
      },
    ],
  },
]
