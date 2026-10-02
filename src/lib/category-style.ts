// Category appearance: a Lucide icon on a tinted tile. Emoji were dropped
// (ui-ux-pro-max `no-emoji-icons`): they render differently per OS and some,
// like ☕ or 🍽️, are near-invisible on Android. Keys are stored in the DB.

export const CATEGORY_COLORS = [
  "blue", "indigo", "violet", "pink", "red", "orange", "amber", "green", "teal", "sky", "slate",
] as const
export type CategoryColor = (typeof CATEGORY_COLORS)[number]

export const CATEGORY_ICONS = [
  "shopping-cart", "beer", "coffee", "pizza", "utensils", "pill", "package", "shirt",
  "paw-print", "spray-can", "house", "sofa", "laptop", "hammer", "lightbulb", "wifi",
  "sprout", "flame", "stethoscope", "sparkles", "scissors", "dumbbell", "briefcase",
  "graduation-cap", "ticket", "plane", "car", "key-round", "car-taxi-front", "tram-front",
  "baby", "gift", "handshake", "heart-handshake", "landmark", "zap", "credit-card",
  "wallet", "banknote", "piggy-bank", "percent", "coins", "book-open", "gamepad-2",
  "film", "smartphone", "music", "fuel", "receipt", "bike", "wine", "cake", "heart",
  "circle-ellipsis",
] as const
export type CategoryIconName = (typeof CATEGORY_ICONS)[number]

export type CategoryStyle = { icon: CategoryIconName; color: CategoryColor }

const RULES: [RegExp, CategoryIconName, CategoryColor][] = [
  [/продукт/i, "shopping-cart", "green"],
  [/пиво|чипс/i, "beer", "amber"],
  [/сладост|кофе/i, "coffee", "orange"],
  [/фастфуд|суши/i, "pizza", "orange"],
  [/кафе|ресторан/i, "utensils", "orange"],
  [/аптек/i, "pill", "red"],
  [/расходник/i, "package", "slate"],
  [/одежд|обув/i, "shirt", "violet"],
  [/живот/i, "paw-print", "amber"],
  [/химия/i, "spray-can", "teal"],
  [/товары для дома/i, "house", "teal"],
  [/техник|мебел/i, "sofa", "slate"],
  [/электрон/i, "laptop", "indigo"],
  [/ремонт|строител/i, "hammer", "slate"],
  [/жкх|коммун/i, "lightbulb", "sky"],
  [/связь|интернет/i, "wifi", "sky"],
  [/сад/i, "sprout", "green"],
  [/взросл/i, "flame", "pink"],
  [/врач|медиц/i, "stethoscope", "red"],
  [/космет/i, "sparkles", "pink"],
  [/услуг/i, "scissors", "violet"],
  // "транспорт" contains "спорт", so it has to be matched first.
  [/транспорт/i, "tram-front", "blue"],
  [/активност|спорт|зал/i, "dumbbell", "indigo"],
  [/работа/i, "briefcase", "slate"],
  [/образован|курс/i, "graduation-cap", "indigo"],
  [/развлеч|отдых/i, "ticket", "violet"],
  [/путешеств/i, "plane", "sky"],
  [/каршер/i, "key-round", "blue"],
  [/автомоб/i, "car", "blue"],
  [/такси/i, "car-taxi-front", "amber"],
  [/дет/i, "baby", "pink"],
  [/подар/i, "gift", "pink"],
  [/окружа/i, "handshake", "teal"],
  [/благотвор/i, "heart-handshake", "red"],
  [/налог|штраф|пошлин/i, "landmark", "slate"],
  [/непредвид/i, "zap", "amber"],
  [/кредит|нежелат/i, "credit-card", "red"],
  [/зарплат|оклад/i, "wallet", "green"],
  [/подработ|фриланс/i, "banknote", "teal"],
  [/кэшб|процент|вклад/i, "percent", "sky"],
]

export function guessCategoryStyle(name: string, kind: "expense" | "income" = "expense"): CategoryStyle {
  const rule = RULES.find(([re]) => re.test(name))
  if (rule) return { icon: rule[1], color: rule[2] }
  return kind === "income" ? { icon: "coins", color: "green" } : { icon: "circle-ellipsis", color: "slate" }
}

export function isCategoryIcon(value: unknown): value is CategoryIconName {
  return typeof value === "string" && (CATEGORY_ICONS as readonly string[]).includes(value)
}

export function isCategoryColor(value: unknown): value is CategoryColor {
  return typeof value === "string" && (CATEGORY_COLORS as readonly string[]).includes(value)
}

// Screen-reader names for the icon picker.
export const ICON_LABELS: Record<CategoryIconName, string> = {
  "shopping-cart": "тележка", beer: "пиво", coffee: "кофе", pizza: "пицца", utensils: "приборы",
  pill: "таблетка", package: "коробка", shirt: "футболка", "paw-print": "лапа", "spray-can": "баллончик",
  house: "дом", sofa: "диван", laptop: "ноутбук", hammer: "молоток", lightbulb: "лампочка", wifi: "вайфай",
  sprout: "росток", flame: "огонь", stethoscope: "стетоскоп", sparkles: "блёстки", scissors: "ножницы",
  dumbbell: "гантель", briefcase: "портфель", "graduation-cap": "академическая шапка", ticket: "билет",
  plane: "самолёт", car: "машина", "key-round": "ключ", "car-taxi-front": "такси", "tram-front": "трамвай",
  baby: "ребёнок", gift: "подарок", handshake: "рукопожатие", "heart-handshake": "сердце в руках",
  landmark: "здание", zap: "молния", "credit-card": "карта", wallet: "кошелёк", banknote: "купюра",
  "piggy-bank": "копилка", percent: "процент", coins: "монеты", "book-open": "книга", "gamepad-2": "геймпад",
  film: "плёнка", smartphone: "телефон", music: "нота", fuel: "заправка", receipt: "чек", bike: "велосипед",
  wine: "бокал", cake: "торт", heart: "сердце", "circle-ellipsis": "другое",
}
