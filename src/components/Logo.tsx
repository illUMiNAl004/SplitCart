// Traced from public/brand/split-cart-logo.png. Replace with the real SVG export.
export function LogoMark({ size = 28, color = "var(--color-lime)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="270 190 740 680" fill={color} aria-hidden>
      <path
        d="M302 224 C385 216 462 236 494 306 L548 566 C563 642 580 672 628 672 L948 672"
        fill="none"
        stroke={color}
        strokeWidth={44}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M512 328 L720 328 C742 328 744 342 738 362 C724 412 737 452 757 512 C772 562 747 592 700 597 C660 602 630 603 590 604 L562 604 L506 344 Z" />
      <path d="M790 330 C830 329 880 328 958 328 C988 328 1006 356 998 386 L951 560 C941 590 921 602 901 602 L806 602 C790 602 784 590 789 570 C797 530 790 490 776 450 C761 405 756 346 790 330 Z" />
      <circle cx="630" cy="792" r="54" />
      <circle cx="896" cy="792" r="54" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-xl font-semibold tracking-tight">splitcart</span>
    </span>
  );
}
