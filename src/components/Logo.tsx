export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="var(--red)" />
      <path d="M256 96c-56 84-120 160-120 228a120 120 0 0 0 240 0c0-68-64-144-120-228z" fill="#fff" />
      <circle cx="256" cy="330" r="34" fill="var(--red)" />
    </svg>
  );
}
