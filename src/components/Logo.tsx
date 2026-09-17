import logoUrl from '../assets/propora-mark-transparent.png';

/**
 * Propora brand mark — official artwork with the black background
 * keyed out to transparency, rendered in the topbar tile.
 */
export default function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <img src={logoUrl} alt="Propora logo" width={size} height={size} className="logo-img" />
  );
}
