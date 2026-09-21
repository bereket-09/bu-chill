"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { BreadcrumbItem, Breadcrumbs, Link } from "@heroui/react";
import { usePathname } from "next/navigation";
import { FaGithub } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const pathName = usePathname();

  return (
    <footer
      className={cn(
        "bottom-0 flex w-full flex-col items-center justify-center gap-3 p-4 text-center select-none",
        className,
      )}
    >
      <h6 className="text-xs sm:text-sm text-white/70">{siteConfig.description}</h6>

      <div className="flex items-center gap-4 text-white/60">
        <Link isExternal href={siteConfig.socials.github} color="foreground" title="GitHub Repository">
          <FaGithub size={22} className="hover:text-white transition-colors" />
        </Link>
        <Link
          isExternal
          href={siteConfig.socials.buymeacoffee || "https://www.buymeacoffee.com/bereket.zelalem"}
          title="Buy Me a Coffee / Donate"
          className="text-[#FFDD00] hover:text-[#ffe338] transition-colors"
        >
          <SiBuymeacoffee size={22} />
        </Link>
      </div>

      <Breadcrumbs
        separator="•"
        itemClasses={{
          separator: "px-2 text-white/30",
          item: "text-xs text-white/60 hover:text-white transition-colors",
        }}
      >
        {siteConfig.navItems.map(({ label, href }) => (
          <BreadcrumbItem key={href} isCurrent={pathName === href} href={href}>
            {label}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <div className="flex items-center gap-3 text-[11px] text-white/40">
        <Link href="/terms" className="text-white/40 hover:text-white transition-colors text-[11px]">
          Terms
        </Link>
        <span>•</span>
        <Link href="/privacy" className="text-white/40 hover:text-white transition-colors text-[11px]">
          Privacy
        </Link>
        <span>•</span>
        <Link href="/dmca" className="text-white/40 hover:text-white transition-colors text-[11px]">
          DMCA
        </Link>
        <span>•</span>
        <Link href="/support" className="text-white/40 hover:text-white transition-colors text-[11px]">
          Help & Support
        </Link>
      </div>

      <p className="text-xs text-white/40">
        &copy; {new Date().getFullYear()} Be Chill &bull; Free Ultra HD Cinema Streaming
      </p>
    </footer>
  );
};

export default Footer;
