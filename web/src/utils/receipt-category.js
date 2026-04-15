const PREDEFINED_CATEGORY_RULES = [
  {
    name: "Supermarkt",
    keywords: [
      "spar",
      "billa",
      "hofer",
      "lidl",
      "penny",
      "dm",
      "mueller",
      "einkauf",
      "lebensmittel",
      "supermarkt",
      "aldi",
      "merkur",
    ],
  },
  {
    name: "Gastronomie",
    keywords: [
      "restaurant",
      "gasthaus",
      "cafe",
      "kaffee",
      "mcdonald",
      "burger",
      "pizza",
      "imbiss",
      "essen",
      "lieferando",
      "kebap",
      "bar",
    ],
  },
  {
    name: "Mobilität",
    keywords: [
      "tank",
      "shell",
      "omv",
      "bp",
      "diesel",
      "benzin",
      "ubahn",
      "bahn",
      "zug",
      "taxi",
      "uber",
      "park",
      "garage",
      "oebb",
      "wiener linien",
    ],
  },
  {
    name: "Gesundheit",
    keywords: [
      "apotheke",
      "arzt",
      "medizin",
      "medikament",
      "drogerie",
      "krankenhaus",
      "teststreifen",
      "sanitaet",
    ],
  },
  {
    name: "Wohnen",
    keywords: [
      "miete",
      "strom",
      "gas",
      "wasser",
      "internet",
      "hausverwaltung",
      "ikea",
      "obi",
      "hornbach",
      "baumarkt",
      "moebel",
    ],
  },
  {
    name: "Bildung",
    keywords: [
      "schule",
      "buch",
      "skript",
      "kurs",
      "udemy",
      "studium",
      "lern",
      "nachhilfe",
      "copyshop",
    ],
  },
  {
    name: "Freizeit",
    keywords: [
      "kino",
      "netflix",
      "spotify",
      "museum",
      "ticket",
      "konzert",
      "sport",
      "fitness",
      "urlaub",
      "hotel",
    ],
  },
  {
    name: "Shopping",
    keywords: [
      "amazon",
      "zalando",
      "h&m",
      "kleidung",
      "schuhe",
      "elektro",
      "media markt",
      "saturn",
      "shop",
      "bestellung",
    ],
  },
];

const DEFAULT_CATEGORY = "Sonstiges";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getValueCandidates(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((entry) => getValueCandidates(entry));
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => getValueCandidates(entry));
  }
  return [];
}

export const PREDEFINED_CATEGORIES = [
  ...PREDEFINED_CATEGORY_RULES.map((entry) => entry.name),
  DEFAULT_CATEGORY,
];

export function classifyReceiptCategory(receipt = {}) {
  const searchableValues = [
    receipt?.merchant,
    receipt?.title,
    receipt?.transaktion,
    receipt?.location,
    receipt?.location_name,
    receipt?.category_name,
    receipt?.ocrText,
    receipt?.filename,
    receipt?.items,
    receipt?.metadata,
    receipt?.raw,
  ];

  const text = normalizeText(getValueCandidates(searchableValues).join(" "));
  if (!text) return DEFAULT_CATEGORY;

  let bestCategory = DEFAULT_CATEGORY;
  let bestScore = 0;

  for (const rule of PREDEFINED_CATEGORY_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (text.includes(normalizeText(keyword))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = rule.name;
    }
  }

  return bestScore > 0 ? bestCategory : DEFAULT_CATEGORY;
}

export function resolveReceiptCategoryLabel(receipt = {}) {
  const explicit = [
    receipt?.category_name,
    receipt?.categoryLabel,
    receipt?.category?.name,
    receipt?.category?.label,
    receipt?.category?.attributes?.name,
    receipt?.category?.data?.attributes?.name,
  ].find((entry) => typeof entry === "string" && entry.trim().length > 0);

  if (explicit) return explicit;

  if (typeof receipt?.category === "string" && receipt.category.trim().length > 0) {
    return receipt.category;
  }

  return classifyReceiptCategory({
    ...receipt,
    raw: receipt,
  });
}

export function enrichReceiptsWithCategories(receipts = []) {
  return (receipts || []).map((receipt) => {
    const categoryLabel = resolveReceiptCategoryLabel(receipt);
    return {
      ...receipt,
      categoryLabel,
    };
  });
}
