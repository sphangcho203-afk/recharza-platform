import type { SVGProps } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Clock3,
  CreditCard,
  Gamepad2,
  Gift,
  Globe,
  Headset,
  Home,
  LayoutGrid,
  Menu,
  MonitorPlay,
  PackageCheck,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";

export type StorefrontIconName =
  | "account"
  | "arrow"
  | "cart"
  | "check"
  | "chevron-down"
  | "clock"
  | "close"
  | "games"
  | "gift"
  | "globe"
  | "grid"
  | "home"
  | "menu"
  | "mobile"
  | "pc"
  | "package"
  | "receipt"
  | "search"
  | "shield"
  | "sparkles"
  | "star"
  | "support"
  | "topup"
  | "track"
  | "wallet"
  | "card";

type StorefrontIconProps = SVGProps<SVGSVGElement> & {
  name: StorefrontIconName;
};

const icons = {
  account: User,
  arrow: ArrowRight,
  cart: ShoppingCart,
  check: BadgeCheck,
  "chevron-down": ChevronDown,
  clock: Clock3,
  close: X,
  games: Gamepad2,
  gift: Gift,
  globe: Globe,
  grid: LayoutGrid,
  home: Home,
  menu: Menu,
  mobile: Smartphone,
  pc: MonitorPlay,
  package: PackageCheck,
  receipt: Receipt,
  search: Search,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  support: Headset,
  topup: Zap,
  track: Truck,
  wallet: Wallet,
  card: CreditCard,
} as const;

export function StorefrontIcon({
  name,
  className = "h-5 w-5",
  ...props
}: StorefrontIconProps) {
  const Icon = icons[name];
  return (
    <Icon
      aria-hidden="true"
      className={className}
      strokeWidth={1.8}
      {...props}
    />
  );
}
