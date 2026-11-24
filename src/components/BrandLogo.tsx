export function BrandLogo({
  href,
  ariaLabel,
}: {
  href: string;
  ariaLabel: string;
}) {
  return (
    <a className="logo" href={href} aria-label={ariaLabel}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M0 37 14 2h12l14 35H28L20 14 12 37Z" fill="#ffd21c" />
        <path d="M18 25h4l3 8H15Z" fill="#101814" />
      </svg>
      <span>AdRover</span>
    </a>
  );
}
