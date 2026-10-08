// A value as JSON, safe to put inside a script element in the page (the
// structured data, or data a component's script reads). JSON.stringify alone
// isn't: a string containing the closing tag would end the element early and
// the rest would be read as HTML. Escaping every "<" as \u003c, which JSON
// reads back as the same character, makes that impossible.
export const toScriptJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c")
