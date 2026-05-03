import { forwardRef, useEffect, useMemo, useState } from "react";
import { Instagram, Facebook, Mail, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

/* ---------- Discord icon ---------- */
const DiscordIcon = forwardRef<SVGSVGElement, { className?: string }>(({ className = "" }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.6 13.6 0 0 0-.69 1.42 18.27 18.27 0 0 0-5.736 0A13 13 0 0 0 9.44 3 19.79 19.79 0 0 0 5.68 4.369C2.063 9.79 1.075 15.072 1.57 20.28a19.95 19.95 0 0 0 6.06 3.06 14.7 14.7 0 0 0 1.296-2.107 12.95 12.95 0 0 1-2.04-.98c.171-.125.339-.255.5-.388a14.22 14.22 0 0 0 12.226 0c.163.133.331.263.5.388-.652.388-1.336.717-2.04.98a14.7 14.7 0 0 0 1.296 2.107 19.95 19.95 0 0 0 6.06-3.06c.585-6.07-.99-11.302-4.111-15.911ZM8.78 17.21c-1.182 0-2.156-1.085-2.156-2.42 0-1.337.955-2.422 2.156-2.422 1.2 0 2.176 1.085 2.156 2.422 0 1.335-.956 2.42-2.156 2.42Zm6.44 0c-1.182 0-2.156-1.085-2.156-2.42 0-1.337.954-2.422 2.156-2.422 1.2 0 2.175 1.085 2.156 2.422 0 1.335-.955 2.42-2.156 2.42Z" />
  </svg>
));

DiscordIcon.displayName = "DiscordIcon";

/* ============================================================
   GROUND HEIGHT — single source of truth.
   All trees, animals, rocks sit at bottom: GROUND_TOP px
   (where the grass surface is).
============================================================ */
const GROUND_HEIGHT = 140;       // total dirt+grass strip
const GROUND_SURFACE = GROUND_HEIGHT - 8; // grass blade tops
const PROP_BASE = GROUND_SURFACE + 2;     // trees plant just above the dirt line, on grass
const SMALL_PROP_BASE = GROUND_SURFACE;
const CAMPFIRE_BASE = GROUND_HEIGHT - 20;
const ANIMAL_BASE = GROUND_SURFACE - 18;

/* ============================================================
   PIXEL CLOUD (clean, no weird outline)
============================================================ */
const PixelCloud = ({ scale = 1 }: { scale?: number }) => (
  <svg
    width={64 * scale}
    height={28 * scale}
    viewBox="0 0 16 7"
    style={{ shapeRendering: "crispEdges" }}
    aria-hidden="true"
  >
    {/* main body — single tone, simple silhouette */}
    <g fill="hsl(var(--cloud))">
      {/* rounded top bumps */}
      <rect x="3" y="2" width="4" height="1" />
      <rect x="9" y="2" width="4" height="1" />
      {/* body fills evenly to remove gaps/notches */}
      <rect x="2" y="3" width="12" height="1" />
      <rect x="1" y="4" width="14" height="2" />
      <rect x="2" y="6" width="12" height="1" />
    </g>
  </svg>
);

/* ============================================================
   PIXEL MOUNTAINS — clean stair-stepped triangles, snow caps
============================================================ */
const PixelMountains = ({ bottomPx }: { bottomPx: number }) => {
  const mountains = [
    { cx: 24, peak: 20, halfBase: 18 },
    { cx: 74, peak: 28, halfBase: 24 },
    { cx: 124, peak: 23, halfBase: 20 },
    { cx: 168, peak: 18, halfBase: 16 },
  ];
  const W = 200;
  const H = 36;
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomPx,
        width: "100%",
        height: 220,
        shapeRendering: "crispEdges",
        zIndex: 1,
      }}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {mountains.map((m, idx) => {
        const rects: JSX.Element[] = [];
        const step = 2; // pixel size
        for (let s = 0; s <= m.halfBase; s += step) {
          const h = Math.round((s / m.halfBase) * m.peak);
          // Tall in the middle, short at the edges (proper triangle)
          const heightFromBase = m.peak - h + 2;
          const colHeight = m.peak - heightFromBase + 2 + h; // unused placeholder
          const triHeight = h + 2;
          // left side
          rects.push(
            <rect
              key={`L${idx}-${s}`}
              x={m.cx - m.halfBase + s}
              y={H - triHeight}
              width={step}
              height={triHeight}
              fill="hsl(var(--mtn-back))"
            />
          );
          // right side
          rects.push(
            <rect
              key={`R${idx}-${s}`}
              x={m.cx + m.halfBase - s - step}
              y={H - triHeight}
              width={step}
              height={triHeight}
              fill="hsl(var(--mtn-back))"
            />
          );
        }
        // shading on right side
        for (let s = 0; s <= m.halfBase; s += step) {
          const h = Math.round((s / m.halfBase) * m.peak);
          const triHeight = h + 2;
          rects.push(
            <rect
              key={`Rs${idx}-${s}`}
              x={m.cx + m.halfBase - s - step}
              y={H - triHeight}
              width={step}
              height={2}
              fill="hsl(var(--border) / 0.18)"
            />
          );
        }
        // snow cap — sit on the actual stepped peak so it doesn't float.
        // Peak column is the last column drawn (s = halfBase rounded down to a step).
        // snow cap — sits exactly on the stepped peak.
        // Top column (s = halfBase) spans [cx-2, cx+2] (4px wide).
        const topY = H - (m.peak + 2);
        rects.push(
          <rect key={`sc-tip-${idx}`} x={m.cx - 2} y={topY} width={4} height={2} fill="hsl(var(--mtn-back-snow))" />,
          <rect key={`sc-2-${idx}`} x={m.cx - 3} y={topY + 2} width={6} height={2} fill="hsl(var(--mtn-back-snow))" />,
          <rect key={`sc-3-${idx}`} x={m.cx - 4} y={topY + 4} width={8} height={2} fill="hsl(var(--mtn-back-snow))" />
        );
        return <g key={idx}>{rects}</g>;
      })}
    </svg>
  );
};

/* ============================================================
   PIXEL HILLS — stepped, with grass top
============================================================ */
const PixelHills = ({
  bottomPx,
  heightPx,
  fill,
  grassFill,
  seed = 0,
  amplitude = 8,
  baseHeight = 18,
}: {
  bottomPx: number;
  heightPx: number;
  fill: string;
  grassFill: string;
  seed?: number;
  amplitude?: number;
  baseHeight?: number;
}) => {
  const cells = 60;
  const cellW = 4;
  const totalW = cells * cellW;
  const totalH = baseHeight + amplitude + 4;

  const heights = useMemo(() => {
    return Array.from({ length: cells }, (_, i) => {
      const r =
        Math.sin((i + seed) * 0.55) * amplitude * 0.7 +
        Math.cos((i + seed) * 0.27) * amplitude * 0.5;
      return Math.max(6, Math.min(totalH, Math.round(baseHeight + r)));
    });
  }, [seed, amplitude, baseHeight, totalH]);

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomPx,
        width: "100%",
        height: heightPx,
        shapeRendering: "crispEdges",
        zIndex: 1,
      }}
      viewBox={`0 0 ${totalW} ${totalH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <g key={i}>
          <rect x={i * cellW} y={totalH - h} width={cellW} height={h} fill={fill} />
          <rect x={i * cellW} y={totalH - h} width={cellW} height={2} fill={grassFill} />
          {/* texture */}
          {(i + seed) % 4 === 0 && (
            <rect x={i * cellW + 1} y={totalH - h + 4} width={1} height={1} fill="hsl(0 0% 0% / 0.15)" />
          )}
          {(i + seed) % 6 === 2 && (
            <rect x={i * cellW + 2} y={totalH - h + 8} width={1} height={1} fill="hsl(0 0% 0% / 0.15)" />
          )}
        </g>
      ))}
    </svg>
  );
};

/* ============================================================
   GROUND — solid grass + dirt strip with texture
============================================================ */
const SolidGround = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: GROUND_HEIGHT,
      zIndex: 5,
    }}
  >
    <svg
      width="100%"
      height={GROUND_HEIGHT}
      viewBox={`0 0 200 ${GROUND_HEIGHT}`}
      preserveAspectRatio="none"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      aria-hidden="true"
    >
      {/* grass top layer */}
      <rect x="0" y="0" width="200" height="6" fill="hsl(var(--grass-light))" />
      <rect x="0" y="6" width="200" height="4" fill="hsl(var(--grass))" />
      <rect x="0" y="10" width="200" height="3" fill="hsl(var(--grass-dark))" />
      {/* grass blades poking up */}
      {Array.from({ length: 100 }).map((_, i) => {
        const x = i * 2 + (i % 3);
        const tall = i % 4 === 0;
        return (
          <rect
            key={`bl${i}`}
            x={x}
            y={tall ? -2 : -1}
            width="1"
            height={tall ? 3 : 2}
            fill={i % 2 ? "hsl(var(--grass-light))" : "hsl(var(--grass))"}
          />
        );
      })}
      {/* layered dirt so it feels grounded instead of noisy */}
      <rect x="0" y="13" width="200" height="16" fill="hsl(var(--dirt-light))" />
      <rect x="0" y="29" width="200" height="54" fill="hsl(var(--dirt))" />
      <rect x="0" y="83" width="200" height={GROUND_HEIGHT - 83} fill="hsl(var(--dirt-dark))" />

      {/* horizontal earth bands */}
      <rect x="0" y="28" width="200" height="2" fill="hsl(var(--dirt-dark) / 0.35)" />
      <rect x="0" y="56" width="200" height="2" fill="hsl(var(--dirt-dark) / 0.3)" />
      <rect x="0" y="88" width="200" height="2" fill="hsl(var(--dirt-light) / 0.22)" />

      {/* chunkier soil clusters to avoid diagonal moiré lines */}
      {([
        [10, 24, 4, 2, "hsl(var(--dirt-dark))"],
        [28, 38, 3, 2, "hsl(var(--stone))"],
        [46, 20, 5, 2, "hsl(var(--dirt-dark))"],
        [62, 48, 4, 2, "hsl(var(--dirt-light))"],
        [84, 30, 4, 3, "hsl(var(--stone))"],
        [104, 68, 5, 2, "hsl(var(--dirt-dark))"],
        [126, 36, 3, 2, "hsl(var(--stone))"],
        [145, 22, 4, 2, "hsl(var(--dirt-light))"],
        [164, 54, 5, 2, "hsl(var(--dirt-dark))"],
        [182, 74, 4, 2, "hsl(var(--stone))"],
        [18, 96, 4, 2, "hsl(var(--dirt-light))"],
        [40, 110, 6, 2, "hsl(var(--stone))"],
        [72, 98, 4, 2, "hsl(var(--dirt-dark))"],
        [94, 118, 5, 2, "hsl(var(--stone))"],
        [122, 104, 4, 2, "hsl(var(--dirt-light))"],
        [154, 116, 5, 2, "hsl(var(--dirt-dark))"],
        [176, 98, 3, 2, "hsl(var(--stone))"],
      ] as const).map(([x, y, width, height, fill], i) => (
        <g key={`soil-${i}`}>
          <rect x={x} y={y} width={width} height={height} fill={fill} />
          <rect x={x} y={y} width={width} height="1" fill="hsl(var(--mtn-back-snow) / 0.16)" />
        </g>
      ))}
    </svg>
  </div>
);

/* ============================================================
   PIXEL TREE — pine and round, clean shape, trunk grounded
   Rendered as a div with bottom = GROUND_SURFACE so trunk
   sits on the grass.
============================================================ */
const PixelTree = ({
  left,
  scale = 1,
  variant = 0,
}: {
  left: string;
  scale?: number;
  variant?: 0 | 1;
}) => {
  const trunk = "hsl(var(--tree-trunk))";
  const trunkLight = "hsl(var(--tree-trunk-light))";
  const leaf = "hsl(var(--tree-leaf))";
  const leafLight = "hsl(var(--tree-leaf-light))";
  const leafDark = "hsl(var(--grass-dark))";

  if (variant === 0) {
    // PINE
    return (
      <svg
        style={{
          position: "absolute",
          left,
          bottom: PROP_BASE,
          width: 36 * scale,
          height: 72 * scale,
          shapeRendering: "crispEdges",
          zIndex: 6,
        }}
        viewBox="0 0 18 36"
        aria-hidden="true"
      >
        {/* trunk runs up into the canopy so the wood and leaves are one attached tree */}
        <rect x="8" y="22" width="3" height="14" fill={trunk} />
        <rect x="8" y="22" width="1" height="14" fill={trunkLight} />
        {/* bark texture — knots and grain lines, same trunk shape */}
        <rect x="10" y="24" width="1" height="1" fill={leafDark} />
        <rect x="9" y="27" width="1" height="2" fill={leafDark} />
        <rect x="10" y="31" width="1" height="1" fill={leafDark} />
        <rect x="8" y="29" width="1" height="1" fill={trunkLight} />
        {/* canopy: overlapping pixel bands, no floating leaf chunks */}
        {[
          { y: 6, h: 6, w: 6 },
          { y: 11, h: 7, w: 10 },
          { y: 17, h: 8, w: 14 },
          { y: 24, h: 8, w: 18 },
        ].map((row, i) => {
          const x = 9 - row.w / 2;
          return (
            <g key={i}>
              <rect x={x} y={row.y} width={row.w} height={row.h} fill={leaf} />
              <rect x={x} y={row.y} width={row.w} height={1} fill={leafLight} />
              <rect x={x} y={row.y + row.h - 1} width={row.w} height={1} fill={leafDark} />
              <rect x={x + 1} y={row.y + 1} width={1} height={1} fill={leafLight} />
              <rect x={x + row.w - 2} y={row.y + row.h - 2} width={1} height={1} fill={leafDark} />
              {/* needle texture speckles, kept inside band so silhouette is unchanged */}
              {row.w >= 10 && (
                <>
                  <rect x={x + 2} y={row.y + 2} width={1} height={1} fill={leafDark} />
                  <rect x={x + row.w - 3} y={row.y + 1} width={1} height={1} fill={leafLight} />
                  <rect x={x + Math.floor(row.w / 2)} y={row.y + row.h - 2} width={1} height={1} fill={leafLight} />
                </>
              )}
              {row.w >= 14 && (
                <>
                  <rect x={x + 3} y={row.y + row.h - 2} width={1} height={1} fill={leafDark} />
                  <rect x={x + row.w - 4} y={row.y + 2} width={1} height={1} fill={leafDark} />
                </>
              )}
            </g>
          );
        })}
        {/* base roots drawn on top so the trunk visibly touches the ground */}
        <rect x="6" y="34" width="2" height="2" fill={trunk} />
        <rect x="11" y="34" width="2" height="2" fill={trunk} />
      </svg>
    );
  }

  // ROUND TREE
  return (
    <svg
      style={{
        position: "absolute",
        left,
        bottom: PROP_BASE,
        width: 38 * scale,
        height: 64 * scale,
        shapeRendering: "crispEdges",
        zIndex: 6,
      }}
      viewBox="0 0 19 32"
      aria-hidden="true"
    >
      {/* trunk extends into the canopy so it is visibly attached */}
      <rect x="8" y="16" width="3" height="16" fill={trunk} />
      <rect x="8" y="16" width="1" height="16" fill={trunkLight} />
      {/* bark grain — texture only, trunk shape unchanged */}
      <rect x="10" y="19" width="1" height="1" fill={leafDark} />
      <rect x="9" y="22" width="1" height="2" fill={leafDark} />
      <rect x="10" y="26" width="1" height="1" fill={leafDark} />
      <rect x="8" y="24" width="1" height="1" fill={trunkLight} />
      {/* canopy — round symmetrical pixel blob */}
      <rect x="5" y="6" width="9" height="19" fill={leaf} />
      <rect x="3" y="9" width="13" height="15" fill={leaf} />
      <rect x="6" y="3" width="7" height="3" fill={leaf} />
      <rect x="4" y="6" width="2" height="3" fill={leaf} />
      <rect x="13" y="6" width="2" height="3" fill={leaf} />
      <rect x="2" y="11" width="2" height="10" fill={leaf} />
      <rect x="15" y="11" width="2" height="10" fill={leaf} />
      {/* leaf-cluster texture — small dappled highlights and shadows scattered across canopy */}
      <rect x="6" y="5" width="2" height="1" fill={leafLight} />
      <rect x="9" y="4" width="2" height="1" fill={leafLight} />
      <rect x="5" y="8" width="1" height="2" fill={leafLight} />
      <rect x="8" y="7" width="1" height="1" fill={leafLight} />
      <rect x="3" y="11" width="1" height="2" fill={leafLight} />
      <rect x="6" y="11" width="1" height="1" fill={leafLight} />
      <rect x="10" y="9" width="1" height="1" fill={leafLight} />
      <rect x="7" y="14" width="1" height="1" fill={leafLight} />
      <rect x="4" y="15" width="1" height="1" fill={leafLight} />
      <rect x="11" y="13" width="2" height="2" fill={leafDark} />
      <rect x="14" y="11" width="1" height="3" fill={leafDark} />
      <rect x="13" y="16" width="2" height="3" fill={leafDark} />
      <rect x="3" y="17" width="2" height="2" fill={leafDark} />
      <rect x="7" y="20" width="5" height="1" fill={leafDark} />
      <rect x="9" y="18" width="1" height="1" fill={leafDark} />
      <rect x="6" y="16" width="1" height="1" fill={leafDark} />
      <rect x="2" y="13" width="1" height="2" fill={leafDark} />
      {/* fruit dots */}
      <rect x="7" y="11" width="1" height="1" fill="hsl(var(--flower-1))" />
      <rect x="12" y="9" width="1" height="1" fill="hsl(var(--flower-1))" />
      <rect x="5" y="14" width="1" height="1" fill="hsl(var(--flower-1))" />
      <rect x="10" y="16" width="1" height="1" fill="hsl(var(--flower-1))" />
      <rect x="6" y="30" width="2" height="2" fill={trunk} />
      <rect x="11" y="30" width="2" height="2" fill={trunk} />
    </svg>
  );
};

/* ---------- Bush ---------- */
const PixelBush = ({ left, scale = 1 }: { left: string; scale?: number }) => (
  <svg
    style={{
      position: "absolute",
      left,
      bottom: SMALL_PROP_BASE,
      width: 30 * scale,
      height: 16 * scale,
      shapeRendering: "crispEdges",
      zIndex: 7,
    }}
    viewBox="0 0 15 8"
    aria-hidden="true"
  >
    <rect x="0" y="3" width="15" height="5" fill="hsl(var(--tree-leaf))" />
    <rect x="2" y="1" width="11" height="3" fill="hsl(var(--tree-leaf))" />
    <rect x="4" y="0" width="7" height="2" fill="hsl(var(--tree-leaf))" />
    <rect x="3" y="2" width="2" height="1" fill="hsl(var(--tree-leaf-light))" />
    <rect x="8" y="1" width="2" height="1" fill="hsl(var(--tree-leaf-light))" />
    <rect x="0" y="7" width="15" height="1" fill="hsl(var(--grass-dark))" />
    <rect x="6" y="4" width="1" height="1" fill="hsl(var(--flower-2))" />
    <rect x="10" y="3" width="1" height="1" fill="hsl(var(--flower-1))" />
  </svg>
);

/* ---------- Rock ---------- */
const PixelRock = ({ left, scale = 1 }: { left: string; scale?: number }) => (
  <svg
    style={{
      position: "absolute",
      left,
      bottom: SMALL_PROP_BASE,
      width: 24 * scale,
      height: 14 * scale,
      shapeRendering: "crispEdges",
      zIndex: 7,
    }}
    viewBox="0 0 12 7"
    aria-hidden="true"
  >
    <rect x="1" y="3" width="10" height="4" fill="hsl(var(--stone))" />
    <rect x="2" y="2" width="8" height="1" fill="hsl(var(--stone))" />
    <rect x="3" y="1" width="5" height="1" fill="hsl(var(--stone))" />
    <rect x="2" y="2" width="4" height="1" fill="hsl(var(--mtn-back-snow) / 0.6)" />
    <rect x="4" y="3" width="2" height="1" fill="hsl(var(--mtn-back-snow) / 0.6)" />
    <rect x="8" y="5" width="2" height="1" fill="hsl(0 0% 0% / 0.3)" />
    <rect x="2" y="6" width="2" height="1" fill="hsl(0 0% 0% / 0.3)" />
  </svg>
);

/* ============================================================
   ANIMALS — all face RIGHT (same direction as walk animation)
   Sized in viewBox pixels, rendered crisply.
============================================================ */

/* FOX — facing right */
const Fox = () => {
  const F = "#e07a3a";
  const FL = "#f4a368";
  const W = "#fff8ee";
  const K = "#1a1a1a";
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 24 16"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      aria-hidden="true"
    >
      {/* tail (left side) */}
      <rect x="0" y="6" width="3" height="3" fill={F} />
      <rect x="1" y="5" width="3" height="2" fill={F} />
      <rect x="0" y="8" width="2" height="1" fill={W} />
      {/* body */}
      <rect x="3" y="7" width="9" height="5" fill={F} />
      <rect x="3" y="7" width="9" height="1" fill={FL} />
      <rect x="4" y="11" width="8" height="1" fill={W} />
      {/* legs (anchored to ground) */}
      <rect x="4" y="12" width="2" height="3" fill={F} />
      <rect x="9" y="12" width="2" height="3" fill={F} />
      <rect x="4" y="14" width="2" height="1" fill={K} />
      <rect x="9" y="14" width="2" height="1" fill={K} />
      {/* head (right side) */}
      <rect x="11" y="5" width="6" height="6" fill={F} />
      <rect x="11" y="5" width="6" height="1" fill={FL} />
      {/* snout pointing right */}
      <rect x="16" y="8" width="3" height="3" fill={W} />
      <rect x="18" y="8" width="1" height="1" fill={K} />
      {/* ears */}
      <rect x="11" y="3" width="2" height="2" fill={F} />
      <rect x="15" y="3" width="2" height="2" fill={F} />
      <rect x="11" y="4" width="1" height="1" fill={K} />
      <rect x="16" y="4" width="1" height="1" fill={K} />
      {/* eye */}
      <rect x="14" y="7" width="1" height="1" fill={K} />
    </svg>
  );
};

/* BUNNY — facing RIGHT (head right, tail left) */
const Bunny = () => {
  const W = "#f4f0e8";
  const D = "#cdc6b8";
  const K = "#1a1a1a";
  const P = "#f4a8b8";
  return (
    <svg
      width="36"
      height="32"
      viewBox="0 0 18 16"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      aria-hidden="true"
    >
      {/* tail puff (left) */}
      <rect x="1" y="9" width="2" height="2" fill={W} />
      {/* body */}
      <rect x="2" y="9" width="8" height="5" fill={W} />
      <rect x="2" y="9" width="8" height="1" fill={D} fillOpacity="0.4" />
      {/* feet */}
      <rect x="2" y="14" width="3" height="1" fill={W} />
      <rect x="6" y="14" width="3" height="1" fill={W} />
      {/* head (right) */}
      <rect x="9" y="6" width="7" height="6" fill={W} />
      <rect x="9" y="6" width="7" height="1" fill={D} fillOpacity="0.5" />
      {/* ears (long, pointing up, right side) */}
      <rect x="10" y="0" width="2" height="6" fill={W} />
      <rect x="14" y="0" width="2" height="6" fill={W} />
      <rect x="10" y="1" width="1" height="4" fill={P} />
      <rect x="14" y="1" width="1" height="4" fill={P} />
      {/* eye on right side of head */}
      <rect x="13" y="8" width="1" height="1" fill={K} />
      {/* nose at the tip of the face */}
      <rect x="15" y="9" width="1" height="1" fill={P} />
      {/* whisker */}
      <rect x="16" y="9" width="1" height="1" fill={D} />
    </svg>
  );
};

/* DEER — facing right */
const Deer = () => {
  const D = "#a06a3a";
  const DL = "#c4884a";
  const W = "#fff8ee";
  const K = "#1a1a1a";
  const A = "#e8d4a6";
  return (
    <svg
      width="56"
      height="48"
      viewBox="0 0 28 24"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      aria-hidden="true"
    >
      {/* tail (left) */}
      <rect x="0" y="11" width="2" height="2" fill={D} />
      <rect x="0" y="12" width="1" height="1" fill={W} />
      {/* body */}
      <rect x="2" y="11" width="13" height="6" fill={D} />
      <rect x="2" y="11" width="13" height="1" fill={DL} />
      {/* spots */}
      <rect x="5" y="13" width="1" height="1" fill={W} />
      <rect x="8" y="14" width="1" height="1" fill={W} />
      <rect x="11" y="13" width="1" height="1" fill={W} />
      <rect x="6" y="15" width="1" height="1" fill={W} />
      {/* legs grounded */}
      <rect x="2" y="17" width="2" height="6" fill={D} />
      <rect x="6" y="17" width="2" height="6" fill={D} />
      <rect x="10" y="17" width="2" height="6" fill={D} />
      <rect x="13" y="17" width="2" height="6" fill={D} />
      <rect x="2" y="22" width="2" height="1" fill={K} />
      <rect x="6" y="22" width="2" height="1" fill={K} />
      <rect x="10" y="22" width="2" height="1" fill={K} />
      <rect x="13" y="22" width="2" height="1" fill={K} />
      {/* neck */}
      <rect x="14" y="9" width="4" height="3" fill={D} />
      <rect x="14" y="9" width="4" height="1" fill={DL} />
      {/* head (right) */}
      <rect x="17" y="5" width="6" height="5" fill={D} />
      <rect x="17" y="5" width="6" height="1" fill={DL} />
      {/* snout */}
      <rect x="22" y="7" width="2" height="2" fill={W} />
      <rect x="23" y="8" width="1" height="1" fill={K} />
      {/* ear */}
      <rect x="16" y="4" width="2" height="2" fill={D} />
      {/* eye */}
      <rect x="20" y="7" width="1" height="1" fill={K} />
      {/* antlers */}
      <rect x="18" y="2" width="1" height="3" fill={A} />
      <rect x="21" y="2" width="1" height="3" fill={A} />
      <rect x="17" y="3" width="1" height="1" fill={A} />
      <rect x="22" y="3" width="1" height="1" fill={A} />
      <rect x="19" y="1" width="1" height="1" fill={A} />
      <rect x="20" y="1" width="1" height="1" fill={A} />
    </svg>
  );
};

/* BIRD — facing right */
const Bird = forwardRef<SVGSVGElement>((_, ref) => {
  const B = "#3a6db5";
  const BL = "#5a8de0";
  const W = "#fff";
  const Y = "#f4b942";
  const K = "#1a1a1a";
  return (
    <svg
      ref={ref}
      width="32"
      height="20"
      viewBox="0 0 16 10"
      style={{ shapeRendering: "crispEdges", display: "block" }}
      aria-hidden="true"
    >
      {/* tail (left) */}
      <rect x="1" y="4" width="2" height="2" fill={B} />
      <rect x="0" y="5" width="1" height="1" fill={B} />
      {/* body */}
      <rect x="3" y="3" width="7" height="4" fill={B} />
      <rect x="3" y="3" width="7" height="1" fill={BL} />
      <rect x="4" y="6" width="5" height="1" fill={W} />
      {/* head (right) */}
      <rect x="9" y="2" width="4" height="3" fill={B} />
      <rect x="9" y="2" width="4" height="1" fill={BL} />
      <rect x="11" y="3" width="1" height="1" fill={K} />
      {/* beak (right, pointing right) */}
      <rect x="13" y="3" width="2" height="1" fill={Y} />
      <rect x="13" y="4" width="1" height="1" fill={Y} />
      {/* feet */}
      <rect x="5" y="7" width="1" height="1" fill={Y} />
      <rect x="8" y="7" width="1" height="1" fill={Y} />
      {/* wing — animated */}
      <g className="flap">
        <rect x="5" y="2" width="5" height="2" fill={B} />
        <rect x="5" y="2" width="5" height="1" fill={BL} />
      </g>
    </svg>
  );
});

Bird.displayName = "Bird";

/* OWL — sits on a tree */
const Owl = () => (
  <svg width="22" height="26" viewBox="0 0 11 13" style={{ shapeRendering: "crispEdges" }} aria-hidden="true">
    <rect x="2" y="3" width="7" height="8" fill="#7a5a3a" />
    <rect x="2" y="3" width="7" height="1" fill="#a07a4a" />
    <rect x="1" y="4" width="2" height="2" fill="#7a5a3a" />
    <rect x="8" y="4" width="2" height="2" fill="#7a5a3a" />
    <rect x="3" y="5" width="2" height="2" fill="#fff" />
    <rect x="6" y="5" width="2" height="2" fill="#fff" />
    <rect x="4" y="6" width="1" height="1" fill="#1a1a1a" />
    <rect x="7" y="6" width="1" height="1" fill="#1a1a1a" />
    <rect x="5" y="7" width="1" height="1" fill="#f4b942" />
    <rect x="2" y="11" width="2" height="1" fill="#f4b942" />
    <rect x="7" y="11" width="2" height="1" fill="#f4b942" />
    {/* feather texture */}
    <rect x="3" y="9" width="1" height="1" fill="hsl(0 0% 0% / 0.3)" />
    <rect x="6" y="9" width="1" height="1" fill="hsl(0 0% 0% / 0.3)" />
  </svg>
);

/* ============================================================
   CAMPFIRE
============================================================ */
const Campfire = ({ leftPercent }: { leftPercent: string }) => (
  <div
    style={{
      position: "absolute",
      bottom: CAMPFIRE_BASE,
      left: leftPercent,
      width: 28,
      height: 33,
      zIndex: 8,
    }}
  >
    <div
      className="flame-glow"
      style={{ left: -86, top: -62 }}
      aria-hidden="true"
    />
    <svg
      width="28"
      height="33"
      viewBox="0 0 24 28"
      style={{ shapeRendering: "crispEdges", position: "relative", zIndex: 2 }}
      aria-hidden="true"
    >
      {/* stones */}
      <rect x="0" y="22" width="4" height="6" fill="hsl(var(--stone))" />
      <rect x="20" y="22" width="4" height="6" fill="hsl(var(--stone))" />
      <rect x="2" y="24" width="20" height="4" fill="hsl(var(--stone))" />
      <rect x="1" y="22" width="2" height="1" fill="hsl(var(--mtn-back-snow) / 0.6)" />
      <rect x="21" y="22" width="2" height="1" fill="hsl(var(--mtn-back-snow) / 0.6)" />
      <rect x="0" y="27" width="24" height="1" fill="hsl(0 0% 0% / 0.3)" />
      {/* logs */}
      <rect x="3" y="18" width="18" height="10" fill="hsl(var(--tree-trunk))" />
      <rect x="3" y="18" width="18" height="2" fill="hsl(var(--tree-trunk-light))" />
      <rect x="5" y="22" width="1" height="1" fill="hsl(0 0% 0% / 0.5)" />
      <rect x="11" y="22" width="1" height="1" fill="hsl(0 0% 0% / 0.5)" />
      <rect x="17" y="22" width="1" height="1" fill="hsl(0 0% 0% / 0.5)" />
      {/* flame */}
      <g className="flicker">
        <rect x="7" y="8" width="10" height="12" fill="hsl(var(--fire-3))" />
        <rect x="8" y="5" width="8" height="4" fill="hsl(var(--fire-3))" />
        <rect x="9" y="2" width="6" height="4" fill="hsl(var(--fire-1))" />
        <rect x="10" y="0" width="4" height="2" fill="hsl(var(--fire-1))" />
        <rect x="9" y="12" width="6" height="7" fill="hsl(var(--fire-1))" />
        <rect x="10" y="15" width="4" height="4" fill="hsl(var(--fire-2))" />
      </g>
      {/* soil lip burying the base into the ground */}
      <rect x="1" y="26" width="22" height="2" fill="hsl(var(--dirt-light))" />
      <rect x="5" y="26" width="2" height="1" fill="hsl(var(--grass-dark))" />
      <rect x="16" y="26" width="2" height="1" fill="hsl(var(--grass-dark))" />
    </svg>
  </div>
);

/* ============================================================
   MAIN SCENE
============================================================ */
export const CozyScene = () => {
  const [night, setNight] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", night);
  }, [night]);

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        top: Math.random() * 55,
        left: Math.random() * 100,
        delay: Math.random() * 2.4,
        big: i % 9 === 0,
        cross: i % 17 === 0,
      })),
    []
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden sky">
      {/* stars (only visible in night) */}
      <div className="stars">
        {stars.map((s, i) => (
          <span
            key={i}
            className={`star ${s.big ? "big" : ""} ${s.cross ? "cross" : ""}`}
            style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }}
          />
        ))}
        <div className="shooting-star" />
      </div>

      {/* sun / moon */}
      <div className="celestial" style={{ left: night ? "82%" : "10%" }}>
        <div className="sun" />
      </div>

      {/* clouds */}
      <div className="cloud" style={{ top: "8%", animationDuration: "80s" }}>
        <PixelCloud scale={1.4} />
      </div>
      <div className="cloud" style={{ top: "18%", animationDuration: "100s", animationDelay: "-30s" }}>
        <PixelCloud scale={1} />
      </div>
      <div className="cloud" style={{ top: "4%", animationDuration: "120s", animationDelay: "-60s" }}>
        <PixelCloud scale={1.7} />
      </div>
      <div className="cloud" style={{ top: "24%", animationDuration: "90s", animationDelay: "-15s" }}>
        <PixelCloud scale={0.85} />
      </div>

      {/* mountains far back */}
      <PixelMountains bottomPx={GROUND_HEIGHT + 90} />

      {/* parallax pixel hills (each behind the previous) */}
      <PixelHills
        bottomPx={GROUND_HEIGHT + 60}
        heightPx={130}
        fill="hsl(var(--hill-back))"
        grassFill="hsl(var(--grass))"
        seed={0}
        amplitude={10}
        baseHeight={22}
      />
      <PixelHills
        bottomPx={GROUND_HEIGHT + 30}
        heightPx={110}
        fill="hsl(var(--hill-mid))"
        grassFill="hsl(var(--grass))"
        seed={3}
        amplitude={9}
        baseHeight={20}
      />
      <PixelHills
        bottomPx={GROUND_HEIGHT}
        heightPx={90}
        fill="hsl(var(--hill-front))"
        grassFill="hsl(var(--grass-light))"
        seed={7}
        amplitude={7}
        baseHeight={16}
      />

      {/* SOLID GROUND on top of hills (so trees/animals plant on it) */}
      <SolidGround />

      {/* trees, bushes, rocks — all sit on grass surface */}
      <PixelTree left="3%" scale={1.1} variant={0} />
      <PixelTree left="11%" scale={0.9} variant={1} />
      <PixelBush left="18%" scale={1} />
      <PixelTree left="24%" scale={1} variant={0} />
      <PixelRock left="30%" scale={0.9} />

      <PixelTree left="58%" scale={1.05} variant={1} />
      <PixelBush left="66%" scale={1.2} />
      <PixelTree left="73%" scale={1.15} variant={0} />
      <PixelRock left="80%" scale={1} />
      <PixelTree left="86%" scale={0.95} variant={1} />
      <PixelTree left="94%" scale={1.1} variant={0} />

      {/* owl perched at the top of the tallest pine (left 3%, scale 1.1).
          Pine svg is 36*scale wide × 72*scale tall, sits at PROP_BASE.
          Center owl on trunk and rest it just below the canopy tip. */}
      <div
        style={{
          position: "absolute",
          left: `calc(3% + ${(36 * 1.1) / 2 - 11}px)`,
          bottom: PROP_BASE + 72 * 1.1 - 22,
          zIndex: 7,
        }}
      >
        <Owl />
      </div>

      {/* tufts and flowers on grass surface */}
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={`tuft${i}`}
          className="tuft"
          style={{
            left: `${(i * 3.7 + 1) % 100}%`,
             bottom: GROUND_SURFACE - 4,
          }}
        />
      ))}
      {[
        { l: "8%", c: "f1" },
        { l: "16%", c: "f2" },
        { l: "27%", c: "f3" },
        { l: "44%", c: "f1" },
        { l: "52%", c: "f2" },
        { l: "60%", c: "f3" },
        { l: "75%", c: "f1" },
        { l: "89%", c: "f2" },
      ].map((f, i) => (
        <span
          key={`fl${i}`}
          className={`flower ${f.c}`}
           style={{ left: f.l, bottom: GROUND_SURFACE - 2, zIndex: 5 }}
        />
      ))}

      {/* campfire */}
      <Campfire leftPercent="38%" />

      {/* smoke from campfire */}
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={`smoke${i}`}
          className="smoke"
          style={{
            left: `calc(38% + 20px)`,
             bottom: SMALL_PROP_BASE + 50,
            animationDelay: `${i * 1}s`,
            zIndex: 8,
          }}
        />
      ))}

      {/* fireflies */}
      {[
        { l: "32%", b: 80, d: "0s" },
        { l: "42%", b: 60, d: "1.5s" },
        { l: "48%", b: 90, d: "3s" },
        { l: "26%", b: 70, d: "2s" },
      ].map((f, i) => (
        <span
          key={`ff${i}`}
          className="firefly"
           style={{ left: f.l, bottom: f.b + SMALL_PROP_BASE, animationDelay: f.d }}
        />
      ))}

      {/* WALKING ANIMALS — bottom anchored to grass surface */}
      <div
        className="walker"
        style={{
           bottom: ANIMAL_BASE,
          animationDuration: "30s",
          animationDelay: "-5s",
          zIndex: 9,
        }}
      >
        <div className="bobber">
          <Fox />
        </div>
      </div>
      <div
        className="walker"
        style={{
           bottom: ANIMAL_BASE + 1,
          animationDuration: "38s",
          animationDelay: "-18s",
          zIndex: 9,
        }}
      >
        <div className="bobber">
          <Bunny />
        </div>
      </div>
      <div
        className="walker"
        style={{
           bottom: ANIMAL_BASE - 1,
          animationDuration: "46s",
          animationDelay: "-30s",
          zIndex: 9,
        }}
      >
        <div className="bobber">
          <Deer />
        </div>
      </div>

      {/* FLYING BIRDS */}
      <div className="flyer" style={{ top: "22%", animationDelay: "-3s", zIndex: 4 }}>
        <Bird />
      </div>
      <div
        className="flyer"
        style={{ top: "14%", animationDelay: "-12s", transform: "scale(0.8)", zIndex: 4 }}
      >
        <Bird />
      </div>

      {/* night toggle */}
      <button
        onClick={() => setNight((n) => !n)}
        className="social-btn pixel-font absolute right-5 top-5 z-20 flex items-center gap-2 bg-card px-3 py-3 text-[9px] text-card-foreground"
        style={{ border: "3px solid hsl(var(--border))" }}
        aria-label="toggle night mode"
      >
        {night ? <Sun size={12} /> : <Moon size={12} />}
        {night ? "day" : "night"}
      </button>

      {/* HELLO SIGN */}
      <section className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-6 px-4">
        <div className="sign-sway flex flex-col items-center">
          <div className="flex w-44 justify-between px-3">
            <span className="block h-5 w-[3px]" style={{ background: "hsl(var(--border))" }} />
            <span className="block h-5 w-[3px]" style={{ background: "hsl(var(--border))" }} />
          </div>
          <div
            className="pixel-font relative px-7 py-5"
            style={{
              color: "hsl(45 80% 92%)",
              border: "4px solid hsl(var(--tree-trunk))",
              boxShadow:
                "inset 0 0 0 2px hsl(var(--tree-trunk) / 0.7), 6px 6px 0 0 hsl(var(--border))",
              backgroundColor: "hsl(var(--tree-trunk))",
              backgroundImage: [
                // horizontal plank seams only
                "repeating-linear-gradient(0deg, transparent 0 22px, hsl(25 50% 12%) 22px 24px, hsl(var(--tree-trunk-light)/0.5) 24px 25px, transparent 25px 26px)",
                // soft horizontal grain streaks
                "repeating-linear-gradient(0deg, hsl(var(--tree-trunk-light)/0.22) 0 1px, transparent 1px 4px)",
                // base vertical shading
                "linear-gradient(180deg, hsl(var(--tree-trunk-light)) 0%, hsl(var(--tree-trunk)) 100%)",
              ].join(","),
            }}
          >
            <h1 className="text-center text-base leading-relaxed sm:text-xl md:text-2xl">
              hello, i'm james!
            </h1>
            <span className="absolute left-1 top-1 h-2 w-2" style={{ background: "hsl(var(--border))" }} />
            <span className="absolute right-1 top-1 h-2 w-2" style={{ background: "hsl(var(--border))" }} />
            <span className="absolute left-1 bottom-1 h-2 w-2" style={{ background: "hsl(var(--border))" }} />
            <span className="absolute right-1 bottom-1 h-2 w-2" style={{ background: "hsl(var(--border))" }} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {[
            { 
              name: "instagram", 
              Icon: Instagram, 
              color: "340 70% 70%", 
              href: "https://www.instagram.com/jims.alc/" 
            },
            { 
              name: "facebook", 
              Icon: Facebook, 
              color: "215 80% 65%", 
              href: "https://www.facebook.com/JamesAlcarde11042008/" 
            },
            { 
              name: "gmail", 
              Icon: Mail, 
              color: "5 75% 60%", 
              onClick: () => {
                navigator.clipboard.writeText("jamesalcarde11042008@gmail.com");
                toast.success("Email copied to clipboard!");
              }
            },
            { 
              name: "discord", 
              Icon: DiscordIcon, 
              color: "235 60% 65%", 
              href: "https://discordapp.com/users/1500537862402212084" 
            },
          ].map(({ name, Icon, color, href, onClick }) => {
            const isLink = !!href;
            const commonProps = {
              key: name,
              onClick,
              "aria-label": name,
              className: "social-btn pixel-font flex h-12 w-12 items-center justify-center pixel-shadow sm:h-14 sm:w-14",
              style: {
                background: `hsl(${color})`,
                border: "3px solid hsl(var(--border))",
                color: "hsl(var(--border))",
                backgroundImage:
                  "repeating-linear-gradient(45deg, hsl(0 0% 100% / 0.12) 0 2px, transparent 2px 6px)",
              },
            };

            if (isLink) {
              return (
                <a
                  {...commonProps}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              );
            }

            return (
              <button {...commonProps} type="button">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            );
          })}
        </div>

        <p className="pixel-font text-center text-[8px] text-foreground/80 sm:text-[10px]">
          — welcome to my cozy corner —
        </p>
      </section>
    </main>
  );
};

export default CozyScene;
