export function LeafArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 240"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M23 235C61 193 119 131 155 8" />
        <path d="M60 187C12 178 15 144 16 125c34 8 50 24 44 62ZM80 160c-42-11-42-43-40-63 33 11 47 27 40 63ZM103 129C69 115 65 83 72 61c28 16 40 35 31 68ZM123 92c-30-15-29-43-23-67 29 16 35 39 23 67ZM143 48c-12-21-5-36 14-44 5 19 3 32-14 44ZM69 176c6-38 30-55 68-57-9 33-30 54-68 57ZM94 142c7-35 32-45 66-43-13 29-35 42-66 43ZM117 107c10-28 31-40 66-32-11 26-37 38-66 32ZM135 68c8-23 27-37 57-29-14 24-33 31-57 29" />
        <path d="m23 141 30 40m-4-70 28 41m3-75 20 44m8-81 13 43m-45 85 48-35m-24 1 45-26m-22-8 45-19m-28-19 39-16" />
      </g>
    </svg>
  );
}
