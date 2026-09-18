import { cn } from "@/utils/helpers";
import { Tooltip } from "@heroui/react";
import Link from "next/link";

interface ActionButtonProps {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  href = "",
  children,
  onClick,
  tooltip,
  disabled,
  className,
}) => {
  const Button = (
    <Tooltip content={tooltip} isDisabled={disabled || !tooltip} showArrow placement="bottom">
      <button
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "pointer-events-auto flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/15 text-white shadow-xl transition-all p-2.5",
          {
            "hover:scale-105 hover:border-white/30 text-white": !disabled,
            "cursor-not-allowed opacity-40 hover:scale-100": disabled,
          },
          className
        )}
      >
        {children}
      </button>
    </Tooltip>
  );

  return href ? (
    <Link href={href} className="pointer-events-auto flex items-center">
      {Button}
    </Link>
  ) : (
    Button
  );
};

export default ActionButton;
