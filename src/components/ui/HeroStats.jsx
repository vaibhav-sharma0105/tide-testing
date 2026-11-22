// A line of figures under a PageHero title ("113 partners | 5 types of partnership"), shared by the
// Publications and Partners pages. Each item is made with withValue() (./withValue.jsx); templates
// come from YAML.

/** `items`: nodes from withValue(); falsy entries are skipped; nothing is rendered when empty. */
export default function HeroStats({ items }) {
  const shown = items.filter(Boolean)
  if (shown.length === 0) return null
  return (
    <ul className="mt-8 flex flex-wrap items-center gap-y-2 font-body text-sm text-white/75 md:text-base">
      {shown.map((node, i) => (
        <li key={i} className={i > 0 ? 'ml-4 border-l border-white/25 pl-4' : ''}>{node}</li>
      ))}
    </ul>
  )
}
