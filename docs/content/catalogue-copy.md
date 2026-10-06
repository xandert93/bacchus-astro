# Catalogue copy

How menu and package text from the client's PDF catalogue is turned into site
copy, and every change made to it so far.

---

## The rule

**The catalogue says _what_ is offered. It is not the authority on how it is
spelled.** It contains real, repeated errors, so "copied from the PDF" is never
on its own a reason to leave a string alone. Every package page gets a proofing
pass.

**Never rebuild a list from a text extraction of the PDF.** Extraction silently
drops every accented character and sometimes whole words ("Goat's Cheese",
"Gavi Di Gavi" and "Gordon's Gin" all vanished). Read the rendered pages.

---

## House style

1. **British English.** "Savouries", not "SAVORIES"; "Caramelised", not
   "Caramelized". Malta's official English is British. Settled for every page;
   don't reopen it word by word.

2. **Restore accents on foreign words, Maltese included.** "Saint-Émilion",
   "Château", "Piña Colada", "Shiraz Rosé", "Sancerre Rosé", "Ġbejna" (the
   Maltese cheeselet).

3. **Fix outright misspellings; leave ambiguous proper nouns as printed.**
   - Fixed: "SANWHICHES" → "Sandwiches", "Pine Not Roll" → "Pine Nut Roll",
     "Macaroons" → "Macarons", "Rosmary" → "Rosemary", "Parmeggiano" →
     "Parmigiano".
   - Left as printed, because either could be intentional: "Terre Antich",
     "Henessey".
   - Also left as printed: the Whiskey and Rum bars say "service of five" but
     list six each.

4. **Rewording is a higher bar than spelling.** Changes so far, both flagged to
   the client as changes rather than corrections:
   - "Vegetable Stir Fried" → "Stir-Fried Vegetables" (every other item in that
     Stations list is a noun phrase).
   - "Barbeque Table" → "BBQ Table", on request. The image key uses it too.

**Send all of the above to the client for approval**, including the fixes that
look unarguable. Telling them what changed reads better than them finding it.

---

## Marking facts that aren't confirmed

- **Bronze note** (`.package-menu-note`): confirmed catalogue copy.
- **Oxblood note** (`.package-menu-note-warning`): unconfirmed or contested.
  Oxblood is the sitewide "illustrative / unconfirmed" colour. On dark
  backgrounds it uses `--oxblood-on-dark` (about 5.1:1 on `--ink`; plain
  `--oxblood` is about 1.6:1 and effectively invisible).

Three oxblood notes are live:

1. **Banquet pricing**: the prices are shown, with a callout stating the
   conflict. Keep it until the conflict is settled (see
   `client-facts.md`).
2. **High Tea vegetarian marks**: the catalogue marks (V) throughout Reception
   and Banquet but never in High Tea, so the page shows none and says why.
   Guessing from dish names could mislabel a dish for a guest with a dietary
   need. The allergen legend's "(V) vegetarian" line is removed too. Restore
   both together once confirmed.
3. **Beverage pricing**: the catalogue has no prices, so the figures come from
   the quote. Corkage is left out because the quote doesn't give its unit.

---

## Mechanics

- **One string can live in several places**: the visible text, the lightbox
  caption data, sometimes a title attribute and the image alt. Change all of
  them.
- **Formatted text wraps across lines**, so a plain find-and-replace can miss
  occurrences and still look like it worked. Change each occurrence by hand,
  then search for the old spelling afterwards.
- **Each package's data file** (`src/data/packages/`) lists the changes made
  to that package at the top.
