// ─────────────────────────────────────────────────────────────────────────────
//  Seasonal verse suggestions (the five bubbles under the search bar).
//
//  Edit freely: change the verses, the labels, or add a new season.
//  - `when(date, dates)` decides if the season is active. `dates` holds this
//    year's movable feasts (easter, goodFriday, palmSunday, ashWednesday, ...).
//  - Seasons are checked top to bottom; the first match wins, so put the most
//    specific days (like Good Friday) above the broader seasons (like Lent).
//  - `verses` should have five entries: { ref, label }.
//  - Preview any season on the home page with ?date=2026-12-20
// ─────────────────────────────────────────────────────────────────────────────

const between = (d, start, end) => d >= start && d <= end;
const md = (year, month, day) => new Date(year, month - 1, day);

export const SEASONS = [
  {
    id: 'good-friday',
    name: 'Good Friday',
    when: (d, x) => between(d, x.goodFriday, x.holySaturday),
    verses: [
      { ref: 'John 3:16', label: 'God so loved the world' },
      { ref: 'Romans 5:8', label: 'Christ died for us' },
      { ref: 'John 15:13', label: 'Greater love' },
      { ref: 'Isaiah 53:5', label: 'By his stripes' },
      { ref: '1 John 4:10', label: 'Herein is love' },
    ],
  },
  {
    id: 'holy-week',
    name: 'Holy Week',
    when: (d, x) => between(d, x.palmSunday, x.maundyThursday),
    verses: [
      { ref: 'Matthew 21:9', label: 'Hosanna!' },
      { ref: 'Psalm 118:26', label: 'Blessed is he that cometh' },
      { ref: 'John 13:34', label: 'Love one another' },
      { ref: 'Luke 22:19', label: 'In remembrance of me' },
      { ref: 'John 15:13', label: 'Greater love' },
    ],
  },
  {
    id: 'easter',
    name: 'Easter',
    when: (d, x) => between(d, x.easter, x.ascension),
    verses: [
      { ref: 'Matthew 28:6', label: 'He is risen!' },
      { ref: 'John 11:25', label: 'The resurrection and the life' },
      { ref: '1 Corinthians 15:57', label: 'Victory in Jesus' },
      { ref: '2 Corinthians 5:17', label: 'All things new' },
      { ref: 'Psalm 118:24', label: 'This is the day' },
    ],
  },
  {
    id: 'pentecost',
    name: 'Pentecost',
    when: (d, x) => between(d, x.ascension, x.pentecost),
    verses: [
      { ref: 'Acts 2:4', label: 'Filled with the Holy Spirit' },
      { ref: 'Acts 1:8', label: 'Ye shall receive power' },
      { ref: 'Galatians 5:22-23', label: 'Fruit of the Spirit' },
      { ref: 'John 14:26', label: 'The Comforter' },
      { ref: 'Romans 15:13', label: 'The God of hope' },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    when: (d) => between(d, md(d.getFullYear(), 12, 24), md(d.getFullYear(), 12, 31)) ||
      between(d, md(d.getFullYear(), 1, 1), md(d.getFullYear(), 1, 6)),
    verses: [
      { ref: 'Luke 2:11', label: 'A Saviour is born' },
      { ref: 'Luke 2:10', label: 'Good tidings of great joy' },
      { ref: 'Luke 2:14', label: 'Glory to God' },
      { ref: 'Matthew 1:23', label: 'God with us' },
      { ref: 'Isaiah 9:6', label: 'Unto us a child is born' },
    ],
  },
  {
    id: 'advent',
    name: 'Advent',
    when: (d, x) => between(d, x.adventStart, md(d.getFullYear(), 12, 23)),
    verses: [
      { ref: 'Isaiah 9:6', label: 'Prince of Peace' },
      { ref: 'Isaiah 7:14', label: 'Immanuel' },
      { ref: 'John 1:5', label: 'The light shineth' },
      { ref: 'Psalm 130:5', label: 'I wait for the Lord' },
      { ref: 'Romans 15:13', label: 'The God of hope' },
    ],
  },
  {
    id: 'lent',
    name: 'Lent',
    when: (d, x) => between(d, x.ashWednesday, x.palmSunday),
    verses: [
      { ref: 'Psalm 51:10', label: 'Create in me a clean heart' },
      { ref: 'Matthew 4:4', label: 'Not by bread alone' },
      { ref: 'Joel 2:13', label: 'Turn to the Lord' },
      { ref: 'Psalm 119:105', label: 'A lamp unto my feet' },
      { ref: 'Matthew 6:21', label: 'Where your treasure is' },
    ],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    when: (d, x) => between(d, addDays(x.thanksgiving, -10), addDays(x.thanksgiving, 3)),
    verses: [
      { ref: 'Psalm 107:1', label: 'Give thanks, for he is good' },
      { ref: '1 Thessalonians 5:18', label: 'In every thing give thanks' },
      { ref: 'Psalm 100:4', label: 'Enter his gates with thanksgiving' },
      { ref: 'James 1:17', label: 'Every good gift' },
      { ref: 'Psalm 9:1', label: 'With my whole heart' },
    ],
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    when: (d, x) => between(d, addDays(x.mothersDay, -6), x.mothersDay),
    verses: [
      { ref: 'Proverbs 31:28', label: 'Her children call her blessed' },
      { ref: 'Proverbs 31:25', label: 'Strength and honour' },
      { ref: 'Exodus 20:12', label: 'Honour thy mother' },
      { ref: 'Isaiah 66:13', label: 'As a mother comforts' },
      { ref: '1 John 4:7', label: 'Love is of God' },
    ],
  },
  {
    id: 'fathers-day',
    name: "Father's Day",
    when: (d, x) => between(d, addDays(x.fathersDay, -6), x.fathersDay),
    verses: [
      { ref: 'Psalm 103:13', label: 'Like as a father' },
      { ref: 'Exodus 20:12', label: 'Honour thy father' },
      { ref: 'Proverbs 22:6', label: 'Train up a child' },
      { ref: '1 John 3:1', label: 'What manner of love' },
      { ref: 'Proverbs 3:5', label: 'Trust in the Lord' },
    ],
  },
  {
    id: 'back-to-school',
    name: 'Back to School',
    when: (d) => between(d, md(d.getFullYear(), 8, 10), md(d.getFullYear(), 9, 10)),
    verses: [
      { ref: 'Joshua 1:9', label: 'Be strong and of a good courage' },
      { ref: 'Philippians 4:13', label: 'I can do all things' },
      { ref: 'James 1:5', label: 'Ask God for wisdom' },
      { ref: 'Proverbs 3:5', label: 'Trust in the Lord' },
      { ref: 'Psalm 119:105', label: 'A lamp unto my feet' },
    ],
  },
  {
    // Fallback when no other season matches. Keep this one last.
    id: 'everyday',
    name: 'Favorite',
    when: () => true,
    verses: [
      { ref: 'John 3:16', label: 'God so loved the world' },
      { ref: 'Psalm 118:24', label: 'This is the day' },
      { ref: 'Philippians 4:13', label: 'I can do all things' },
      { ref: 'Proverbs 3:5', label: 'Trust in the Lord' },
      { ref: '1 John 4:19', label: 'He first loved us' },
    ],
  },
];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
