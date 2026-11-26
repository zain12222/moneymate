import React from 'react';
import {
  Bus,
  Film,
  GraduationCap,
  HeartPulse,
  Package,
  Receipt,
  ShoppingBag,
  Smartphone,
  User,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { ExpenseCategory } from '../types';
import { CATEGORY_COLORS } from '../utils/currency';

export const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  Food: Utensils,
  Transport: Bus,
  University: GraduationCap,
  Shopping: ShoppingBag,
  'Mobile & Internet': Smartphone,
  Entertainment: Film,
  Personal: User,
  Bills: Receipt,
  Health: HeartPulse,
  Other: Package,
};

interface CategoryBadgeProps {
  category: ExpenseCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const Icon = CATEGORY_ICONS[category] ?? Package;
  const color = CATEGORY_COLORS[category] ?? '#64748b';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}40`,
        color,
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{category}</span>
    </span>
  );
};

interface CategoryIconBoxProps {
  category: ExpenseCategory;
  className?: string;
}

export const CategoryIconBox: React.FC<CategoryIconBoxProps> = ({
  category,
  className = 'w-10 h-10',
}) => {
  const Icon = CATEGORY_ICONS[category] ?? Package;
  const color = CATEGORY_COLORS[category] ?? '#64748b';

  return (
    <div
      className={`${className} rounded-xl flex items-center justify-center shrink-0 border`}
      style={{
        backgroundColor: `${color}16`,
        borderColor: `${color}35`,
        color,
      }}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
};
