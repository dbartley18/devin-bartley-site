"use client";

/**
 * Powerlevel10k-style terminal prompt.
 * Uses CSS clip-path for pixel-perfect sharp angled separators (no bleed).
 * MesloLGS NF for text and Nerd Font icons inside segments.
 */

interface Segment {
  text: string;
  icon?: string;
  bg: string;
}

const ANGLE = 12; // px — width of the sharp angled tail

export function P10kPrompt({ segments }: { segments: Segment[] }) {
  return (
    <div className="flex items-center font-nerd text-[13px] font-bold leading-none">
      {segments.map((seg, i) => {
        const isFirst = i === 0;
        const isLast = i === segments.length - 1;

        // clip-path creates the sharp angle:
        // - left side: straight if first, angled inset if not
        // - right side: always angled point
        const clipPath = isFirst
          ? `polygon(0 0, calc(100% - ${ANGLE}px) 0, 100% 50%, calc(100% - ${ANGLE}px) 100%, 0 100%)`
          : `polygon(0 0, calc(100% - ${ANGLE}px) 0, 100% 50%, calc(100% - ${ANGLE}px) 100%, 0 100%, ${ANGLE}px 50%)`;

        return (
          <div
            key={i}
            className="flex items-center whitespace-nowrap text-white"
            style={{
              backgroundColor: seg.bg,
              clipPath,
              paddingLeft: isFirst ? 12 : ANGLE + 8,
              paddingRight: ANGLE + 8,
              paddingTop: 6,
              paddingBottom: 6,
              marginLeft: isFirst ? 0 : -ANGLE,
              position: "relative",
              zIndex: segments.length - i,
            }}
          >
            {seg.icon && <span className="mr-1.5">{seg.icon}</span>}
            <span>{seg.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Section header styled as a p10k prompt line.
 * Rainbow color segments with sharp powerline angles.
 */
export function P10kSectionHeader({
  icon,
  title,
  tags,
}: {
  icon: string;
  title: string;
  tags?: { text: string; icon?: string }[];
}) {
  const colors = [
    "var(--color-p10k-blue)",
    "var(--color-p10k-green)",
    "var(--color-p10k-cyan)",
    "var(--color-p10k-yellow)",
    "var(--color-p10k-purple)",
    "var(--color-p10k-red)",
  ];

  const segments: Segment[] = [
    { text: title, icon, bg: colors[0] },
    ...(tags ?? []).map((tag, i) => ({
      text: tag.text,
      icon: tag.icon,
      bg: colors[(i + 1) % colors.length],
    })),
  ];

  return (
    <div className="mb-0">
      <P10kPrompt segments={segments} />
      {/* Connector line — bridges the header to the card below */}
      <div
        className="ml-6 h-3 w-px"
        style={{ backgroundColor: colors[0] }}
      />
    </div>
  );
}
