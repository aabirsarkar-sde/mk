# Minute Cryptic

A pixel-faithful rebuild of the Minute Cryptic play screen, loaded with one clue:

> Wild girl finder ends up as your partner (10)

`WILD` is the anagram indicator, `GIRL FINDER` is the fodder, `your partner` is the
definition — the ten letters shuffle into **GIRLFRIEND**.

## Run it

Open `index.html` in a browser. No build step, no dependencies, no network calls —
the fonts are bundled.

## Files

| file | what's in it |
| --- | --- |
| `index.html` | markup: header, clue card, grid, hint dots, actions, keyboard, sheet |
| `styles.css` | all styling; the palette and metrics are documented at the top |
| `app.js` | grid/typing, hint flow, check logic, `localStorage` progress |
| `puzzle.js` | the puzzle: clue runs, enumeration, answer, par, hint copy |
| `fonts/`, `fonts.css` | Mulish + Sansita, self-hosted (latin + latin-ext) |

## Where the design came from

The visual tokens are taken from the live site's stylesheet rather than eyeballed:

- `mc-blue #D5E8FF` · `mc-blue-dark #ADD3FF` · `mc-pink #F5D1FD` · `mc-yellow #FFF2B1`
  `mc-green #BEFAC4` · `mc-red #FFA7A7` · `mc-gray #9F9F9F` · `mc-secondary #596170`
- `font-sans` is **Mulish**, `font-serif` is **Sansita** (the bold-italic used on
  *hints*, *check* and *par*)
- house button style: `3px` black border, fully rounded, `3px 3px 0 0` hard shadow,
  press state nudges `2px 2px` and drops the shadow
- content column is `640px` (their `w-tablet`), keyboard is `react-simple-keyboard`
  defaults with white keys

Spacing and type sizes were measured off the reference screenshots (screenshot px ×
0.756 = CSS px, for a 2× capture of a 1512-wide window).

## Playing

Type with the on-screen or physical keyboard; arrows move, backspace deletes, Enter
checks. The three hints are definition, indicator and fodder; each one highlights its
span in the clue in the matching colour and burns a dot. Par is the
number of hints the clue is expected to take; scoring is golf-style, so fewer is
better. Progress is kept in `localStorage`.

## Adding a puzzle

Everything puzzle-specific lives in `puzzle.js`. Split the clue into runs and tag each
with `fodder`, `indicator`, `definition`, or nothing for linkwords; set `enumeration`
(e.g. `[6, 1]` renders six joined cells, a gap, then one), `answer`, and `par`.
# mk
