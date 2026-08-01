/* Puzzle data.
 *
 * `clue.parts` is the clue rendered as a sequence of runs. Each run carries a
 * `type` which controls the highlight colour once the matching hint is opened:
 *   fodder     -> mc-yellow   (#FFF2B1)
 *   indicator  -> mc-pink     (#F5D1FD)
 *   definition -> mc-blue     (#D5E8FF)
 *   null       -> no highlight (linkwords, punctuation, enumeration)
 */
window.PUZZLE = {
  date: '2 August, 2026',
  byline: 'By Member: you!',
  par: 2,
  answer: 'GIRLFRIEND',
  enumeration: [10],
  clue: {
    parts: [
      { text: 'Wild', type: 'indicator' },
      { text: ' ' },
      { text: 'girl finder', type: 'fodder' },
      { text: ' ends up as ' },
      { text: 'your partner', type: 'definition' },
      { text: ' (10)' },
    ],
  },
  hints: [
    {
      id: 'definition',
      label: 'definition',
      reveals: 'definition',
      text:
        "Our definition here is 'your partner'. Every cryptic clue hides a " +
        'straight definition at one end or the other, and this one sits right ' +
        'at the tail.',
    },
    {
      id: 'indicator',
      label: 'indicator',
      reveals: 'indicator',
      text:
        "This clue's indicator is 'wild'. It's an anagram indicator, guiding us " +
        'to take the letters of a neighbouring word or phrase and rearrange ' +
        "them into a new order. 'ends up as' is just a linkword joining the " +
        'wordplay to the definition, and it does no work of its own.',
    },
    {
      id: 'fodder',
      label: 'fodder',
      reveals: 'fodder',
      text:
        "This clue's fodder is 'girl finder'. We'll use these letters, all ten " +
        'of them, which is a neat match for our enumeration, to construct the ' +
        "answer, jumbled up as the clue's indicator demands.",
    },
  ],
};
