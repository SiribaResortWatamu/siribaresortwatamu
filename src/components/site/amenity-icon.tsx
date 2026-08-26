import {
  Baby,
  Bath,
  Binoculars,
  Car,
  ChefHat,
  Coffee,
  Dumbbell,
  Flame,
  Fan,
  Leaf,
  ParkingCircle,
  Plane,
  PawPrint,
  Refrigerator,
  ShieldCheck,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Trees,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Amenities are CMS records, so the owner picks an icon by name from this
 * list in the admin form. Anything unrecognised falls back to a neutral
 * mark rather than rendering nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  bath: Bath,
  binoculars: Binoculars,
  car: Car,
  "chef-hat": ChefHat,
  coffee: Coffee,
  dumbbell: Dumbbell,
  fan: Fan,
  flame: Flame,
  leaf: Leaf,
  parking: ParkingCircle,
  "paw-print": PawPrint,
  plane: Plane,
  palmtree: Trees,
  refrigerator: Refrigerator,
  "shield-check": ShieldCheck,
  shirt: Shirt,
  snowflake: Snowflake,
  sparkles: Sparkles,
  sun: Sun,
  trees: Trees,
  tv: Tv,
  utensils: Utensils,
  waves: Waves,
  wifi: Wifi,
  wind: Wind,
  zap: Zap,
};

/** Names offered in the admin amenity form. */
export const AMENITY_ICON_NAMES = Object.keys(ICONS).sort();

export function AmenityIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} strokeWidth={1.4} className={className} />;
}
