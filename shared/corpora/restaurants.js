// Dublin restaurants, from the expensive-food database (149 curated, 5,862
// dishes). Picked to SPAN the price range — a corpus of 44 expensive rooms
// answers "is this a treat?" identically 44 times.
//
// `tags` are only for the offline stub; the live model reads name and subtitle.
export default {
  id: 'restaurants',
  name: 'Dublin restaurants',
  credit: 'from your own dublin_food.db',
  examples: [
    'would work for a first date',
    'you could bring your parents here',
    'could take twelve people at short notice',
    'is somewhere you go for the food, not the room',
    'you would be embarrassed to suggest this',
    'is worth crossing the city for',
  ],
  pairWith: 'is expensive',
  items: [
 {
  "id": "r0",
  "name": "Ryleigh's Rooftop Steakhouse",
  "sub": "D01 XR83 · ★4.5 · top dish €130",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r1",
  "name": "Isabelle's Restaurant",
  "sub": "D02 HP70 · ★4.3 · top dish €110",
  "tags": [
   "restaurant",
   "expensive"
  ]
 },
 {
  "id": "r2",
  "name": "Pickle Restaurant",
  "sub": "D02 N998 · ★4.5 · top dish €120",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r3",
  "name": "The Grayson",
  "sub": "D02 VY49 · ★4.3 · top dish €110",
  "tags": [
   "restaurant",
   "expensive",
   "formal"
  ]
 },
 {
  "id": "r4",
  "name": "Rosa Madre",
  "sub": "D02 YT38 · ★4.5 · top dish €140",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r5",
  "name": "The Dunmore",
  "sub": "D06 AY77 · ★4.6 · top dish €105",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r6",
  "name": "BANG Dublin",
  "sub": "Dublin · ★4.7 · top dish €130",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r7",
  "name": "Davy Byrnes",
  "sub": "Dublin · ★4.5 · top dish €115",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r8",
  "name": "F.X. Buckley Steakhouse Pembroke Street",
  "sub": "Dublin 2 · ★4.6 · top dish €130",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r9",
  "name": "The Bull & Castle",
  "sub": "Dublin 2 · ★4.5 · top dish €130",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r10",
  "name": "The Butcher Grill",
  "sub": "Dublin 6 · ★4.7 · top dish €140",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r11",
  "name": "Bar Italia Ristorante",
  "sub": "D01 CA21 · ★4.5 · top dish €80",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r12",
  "name": "Hawksmoor Dublin",
  "sub": "D02 C850 · ★4.4 · top dish €90",
  "tags": [
   "restaurant",
   "expensive"
  ]
 },
 {
  "id": "r13",
  "name": "Mister S",
  "sub": "D02 P029 · ★4.7 · top dish €75",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r14",
  "name": "Hang Dai Chinese",
  "sub": "D02 T275 · ★4.5 · top dish €70",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r15",
  "name": "Mama Yo",
  "sub": "D02 X788 · ★4.2 · top dish €73",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r16",
  "name": "Suertudo",
  "sub": "D06 HR84 · ★4.1 · top dish €65",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r17",
  "name": "The Pig’s Ear Dublin",
  "sub": "Dublin · ★4.4 · top dish €82",
  "tags": [
   "restaurant",
   "midrange",
   "formal"
  ]
 },
 {
  "id": "r18",
  "name": "1900 Restaurant",
  "sub": "Dublin 2 · ★4.5 · top dish €99",
  "tags": [
   "restaurant",
   "expensive",
   "acclaimed"
  ]
 },
 {
  "id": "r19",
  "name": "FIRE Steakhouse Dublin",
  "sub": "Dublin 2 · ★4.4 · top dish €68",
  "tags": [
   "restaurant",
   "midrange",
   "formal"
  ]
 },
 {
  "id": "r20",
  "name": "Orwell Road Restaurant",
  "sub": "Dublin 6 · ★4.8 · top dish €89",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r21",
  "name": "Gleesons of Booterstown",
  "sub": "Booterstown · ★4.4 · top dish €40",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r22",
  "name": "The Vintage Kitchen",
  "sub": "D02 NX03 · ★4.7 · top dish €47",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r23",
  "name": "Pichet",
  "sub": "D02 T998 · ★4.7 · top dish €44",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r24",
  "name": "Gigi",
  "sub": "D06 X3Y6 · ★4.7 · top dish €44",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r25",
  "name": "Bloom Brasserie",
  "sub": "Dublin · ★4.6 · top dish €45",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed"
  ]
 },
 {
  "id": "r26",
  "name": "Café en Seine",
  "sub": "Dublin · ★4.4 · top dish €46",
  "tags": [
   "restaurant",
   "midrange",
   "formal"
  ]
 },
 {
  "id": "r27",
  "name": "Il Corvo",
  "sub": "Dublin · ★4.3 · top dish €41",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r28",
  "name": "NoLIta",
  "sub": "Dublin · ★4.2 · top dish €52",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r29",
  "name": "The Winding Stair",
  "sub": "Dublin 1 · ★4.4 · top dish €42",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r30",
  "name": "Pearl Brasserie",
  "sub": "Dublin 2 · ★4.7 · top dish €48",
  "tags": [
   "restaurant",
   "midrange",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r31",
  "name": "l'Gueuleton",
  "sub": "Dublin 2 · ★4.3 · top dish €45",
  "tags": [
   "restaurant",
   "midrange"
  ]
 },
 {
  "id": "r32",
  "name": "Terrace Cafe",
  "sub": "Dublin 2 · ★4.0 · top dish €35",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r33",
  "name": "Diwali Restaurant",
  "sub": "D02 HH93 · ★4.1 · top dish €28",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r34",
  "name": "The Cellar Bar",
  "sub": "D02 KF79 · ★4.5 · top dish €30",
  "tags": [
   "restaurant",
   "cheap",
   "acclaimed",
   "formal"
  ]
 },
 {
  "id": "r35",
  "name": "Salamanca",
  "sub": "D02 R856 · ★4.2 · top dish €20",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r36",
  "name": "Montys of Kathmandu",
  "sub": "D02 WP30 · ★4.4 · top dish €33",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r37",
  "name": "The Legal Eagle",
  "sub": "D07 HP40 · ★4.5 · top dish €28",
  "tags": [
   "restaurant",
   "cheap",
   "acclaimed"
  ]
 },
 {
  "id": "r38",
  "name": "Mehek Indian Restaurant",
  "sub": "Dublin · ★4.5 · top dish €29",
  "tags": [
   "restaurant",
   "cheap",
   "acclaimed"
  ]
 },
 {
  "id": "r39",
  "name": "Indie Spice Grill",
  "sub": "Dublin · ★4.4 · top dish €24",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r40",
  "name": "Badam Indian and Nepalese Cuisine",
  "sub": "Dublin 3 · ★4.7 · top dish €27",
  "tags": [
   "restaurant",
   "cheap",
   "acclaimed"
  ]
 },
 {
  "id": "r41",
  "name": "Daata Sandymount",
  "sub": "Dublin 4 · ★4.8 · top dish €28",
  "tags": [
   "restaurant",
   "cheap",
   "acclaimed"
  ]
 },
 {
  "id": "r42",
  "name": "La Peniche",
  "sub": "D04 F242 · ★4.4 · top dish €5",
  "tags": [
   "restaurant",
   "cheap"
  ]
 },
 {
  "id": "r43",
  "name": "Pete's of Sandymount",
  "sub": "Dublin 4 · ★4.2 · top dish €13",
  "tags": [
   "restaurant",
   "cheap"
  ]
 }
],
};
