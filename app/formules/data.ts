// Objets pour les formules

// je le fait en dur ici pcq trop galere pour recup les donnes dans ce format exact depuis la DB desoler prochain dev <3
export const Formules = [
  {
    id: [
      "8bf377d7-dcee-4354-9f58-3b2bb41279c2",
      "5dd67b0b-fd52-498b-8f07-aa20d48188d4",
      "fb22b714-4186-48b2-8b53-731a2c6025ee",
    ],
    name: "MAT PILATES - YOGA - BARRE ",
    image:
      "/img/formule barre.webp",
    prices: [
      { type: "Découverte", price: "180 dhs" },
      { type: "1 class", price: "220 dhs" },
      { type: "5 class", price: "990 dhs" },
      { type: "10 class", price: "1870 dhs" },
      { type: "20 class", price: "3520 dhs" },
    ],
  },
  {
    id: "1f479ba6-ed11-4063-a37c-13ff013c82b1",
    name: "REFORMER",
    image:
      "/img/formule reformer.webp",
    prices: [
      { type: "Découverte", price: "250 dhs" },
      { type: "1 class", price: "300 dhs" },
      { type: "5 class", price: "1300 dhs" },
      { type: "10 class", price: "2490 dhs" },
      { type: "20 class", price: "4680 dhs" },
    ],
  },
  {
    id: "c824458b-b098-4826-a29d-d0fc145f1187",
    name: "LAGREE MICROPRO",
    image:
      "/img/formule lagree micropro.webp",
    prices: [
      { type: "Découverte", price: "300 dhs" },
      { type: "1 class", price: "350 dhs" },
      { type: "5 class", price: "1500 dhs" },
      { type: "10 class", price: "2870 dhs" },
      { type: "20 class", price: "5250 dhs" },
    ],
  },
];

export const Packs = [
  {
    id: "8f24470c-5323-4c9f-a508-ea598b86fe8f",
    name: "Encore Start",
    courseCount: 5,
    description: "Immersion pour se reconnecter à son corps.",
    price: 1500,
    features: ["Lagree (2 max)", "Pilate Reformer", "Yoga Mat", "Barre"],
  },
  {
    id: "362fa431-1790-4488-9b8c-9589392e44f7",
    name: "Encore Flow",
    courseCount: 10,
    description: "Rythme régulier pour progresser et ancrer sa pratique.",
    price: 2900,
    features: ["Lagree (5 max)", "Pilate Reformer", "Yoga Mat", "Barre"],
  },
  {
    id: "b1a68f39-c129-401c-b181-2c2f566ca984",
    name: "Encore Focus",
    courseCount: 20,
    description: "Approfondissement des postures et précision maximale.",
    price: 5400,
    features: ["Lagree (10 max)", "Pilate Reformer", "Yoga Mat", "Barre"],
  },
  {
    id: "4086f475-2882-499d-b054-fefb913fa6d9",
    name: "Encore Elevate",
    courseCount: 20,
    description: "Engagement total et une transformation en profondeur.",
    price: 7800,
    features: ["Lagree (15 max)", "Pilate Reformer", "Yoga Mat", "Barre"],
  },
];
