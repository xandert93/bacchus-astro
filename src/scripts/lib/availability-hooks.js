// The two calls the enquiry form needs from the availability calendar. The
// calendar fills these in when it initialises; the form calls them later, on
// a reset or a chip change, so neither module has to import the other's
// internals or care which one ran first.
export const availabilityHooks = {
  // Clears the picked wedding date entirely (after a full form reset).
  reset: null,
  // Re-writes #date from the calendar's still-picked date (on switching the
  // event type back to Wedding).
  restoreField: null,
}
