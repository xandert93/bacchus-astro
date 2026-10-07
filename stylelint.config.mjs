// Stylelint: checks the CSS rules Prettier can't, in .css files and in the
// <style> blocks of .astro files. Prettier decides layout but never ADDS a
// blank line, so the house rule "a blank line between CSS rules" lives here.
// Run with `npm run lint` (with ESLint), and `npm run lint:fix` adds the
// missing lines itself.

/** @type {import("stylelint").Config} */
export default {
  overrides: [
    {
      // postcss-html reads the <style> blocks out of a component file.
      files: ["**/*.astro"],
      customSyntax: "postcss-html",
    },
  ],

  rules: {
    // A blank line before every rule, except the first inside a block, and
    // except straight after the comment that introduces it.
    "rule-empty-line-before": [
      "always",
      { except: ["first-nested"], ignore: ["after-comment"] },
    ],

    // The same for @media, @keyframes and the like.
    "at-rule-empty-line-before": [
      "always",
      {
        except: ["first-nested", "blockless-after-same-name-blockless"],
        ignore: ["after-comment"],
      },
    ],

    // And before a comment, so a comment stays attached to the rule (or the
    // group of properties) it describes, not the one above it.
    "comment-empty-line-before": [
      "always",
      { except: ["first-nested"], ignore: ["after-comment", "stylelint-commands"] },
    ],
  },
}
