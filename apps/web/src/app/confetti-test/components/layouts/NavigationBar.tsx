import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

interface NavigationBarProps {
  items: NavItem[];
}

export function NavigationBar({ items }: NavigationBarProps) {
  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <Link 
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg transition-colors text-sm ${
            item.isActive 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </div>
  );
}
