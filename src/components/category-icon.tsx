import {
  Baby, Banknote, Beer, BookOpen, Briefcase, Bike, Cake, Car, CarTaxiFront, CircleEllipsis, Coffee, Coins,
  CreditCard, Dumbbell, Film, Flame, Fuel, Gamepad2, Gift, GraduationCap, Hammer, Handshake, Heart,
  HeartHandshake, House, KeyRound, Landmark, Laptop, Lightbulb, type LucideIcon, Music, Package, PawPrint,
  Percent, PiggyBank, Pill, Pizza, Plane, Receipt, Scissors, Shirt, ShoppingCart, Smartphone, Sofa,
  Sparkles, SprayCan, Sprout, Stethoscope, Ticket, TramFront, Utensils, Wallet, Wifi, Wine, Zap,
} from "lucide-react"

import type { CategoryColor, CategoryIconName } from "@/lib/category-style"
import { cn } from "@/lib/utils"

export const ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  "shopping-cart": ShoppingCart, beer: Beer, coffee: Coffee, pizza: Pizza, utensils: Utensils, pill: Pill,
  package: Package, shirt: Shirt, "paw-print": PawPrint, "spray-can": SprayCan, house: House, sofa: Sofa,
  laptop: Laptop, hammer: Hammer, lightbulb: Lightbulb, wifi: Wifi, sprout: Sprout, flame: Flame,
  stethoscope: Stethoscope, sparkles: Sparkles, scissors: Scissors, dumbbell: Dumbbell, briefcase: Briefcase,
  "graduation-cap": GraduationCap, ticket: Ticket, plane: Plane, car: Car, "key-round": KeyRound,
  "car-taxi-front": CarTaxiFront, "tram-front": TramFront, baby: Baby, gift: Gift, handshake: Handshake,
  "heart-handshake": HeartHandshake, landmark: Landmark, zap: Zap, "credit-card": CreditCard, wallet: Wallet,
  banknote: Banknote, "piggy-bank": PiggyBank, percent: Percent, coins: Coins, "book-open": BookOpen,
  "gamepad-2": Gamepad2, film: Film, smartphone: Smartphone, music: Music, fuel: Fuel, receipt: Receipt,
  bike: Bike, wine: Wine, cake: Cake, heart: Heart, "circle-ellipsis": CircleEllipsis,
}

const SIZES = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-xl [&_svg]:size-5",
  lg: "size-12 rounded-2xl [&_svg]:size-6",
}

// Decorative: always rendered next to the category name, so hidden from screen readers.
export function CategoryIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string
  color: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const Icon = ICON_COMPONENTS[icon as CategoryIconName] ?? CircleEllipsis
  return (
    <span
      aria-hidden
      style={{ "--c": `var(--cat-${color as CategoryColor}, var(--cat-slate))` } as React.CSSProperties}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-[color-mix(in_oklab,var(--c)_14%,transparent)] text-[var(--c)] [&_svg]:stroke-[2]",
        SIZES[size],
        className,
      )}
    >
      <Icon />
    </span>
  )
}
