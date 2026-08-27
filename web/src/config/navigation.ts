import {
  LayoutDashboard,
  Ticket,
  MapPin,
  Bus,
  FileText,
  Settings,
  QrCode,
  HandCoins,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Optional badge label shown next to the item (e.g. "جديد"). */
  badge?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * مصدر روابط التنقل الوحيد — أي صفحة جديدة تُضاف هنا فقط.
 */
export const navigation: NavSection[] = [
  {
    label: "الرئيسية",
    items: [
      { title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "العمليات",
    items: [
      { title: "الحجوزات والتذاكر", href: "/bookings", icon: Ticket },
      { title: "بوابة الصعود", href: "/boarding", icon: QrCode },
      { title: "الرحلات والمسارات", href: "/trips", icon: MapPin },
      { title: "الأسطول والمقاعد", href: "/buses", icon: Bus },
      { title: "الوكلاء والعمولات", href: "/agents", icon: HandCoins },
      { title: "منفستو الرحلات", href: "/manifests", icon: ClipboardList },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { title: "التقارير المالية", href: "/financial", icon: FileText },
      { title: "الإعدادات", href: "/settings", icon: Settings },
    ],
  },
];
