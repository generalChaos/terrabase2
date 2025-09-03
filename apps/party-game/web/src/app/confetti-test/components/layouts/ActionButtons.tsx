interface ActionButton {
  onClick: () => void;
  label?: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  title?: string;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  className?: string;
}

export function ActionButtons({ buttons, className = "" }: ActionButtonsProps) {
  const getVariantClasses = (variant: ActionButton['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={`${getVariantClasses(button.variant)} text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-lg`}
          title={button.title}
        >
          {button.icon} {button.label}
        </button>
      ))}
    </div>
  );
}
