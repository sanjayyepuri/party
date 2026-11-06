// Flatten dye filters once so browsers only scale a decoded image on resize.
// Run: node scripts/render-fall-spiral.cjs
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("../app/bouncer/node_modules/sharp");
const colors = [
  "#211d1c",
  "#5a5552",
  "#b4aea7",
  "#49312d",
  "#70645f",
  "#92908b",
  "#30302f",
  "#d1cbc1",
];
const fullTurn = Math.PI * 2;
const steps = 160;
const outerRadius = 880;
function point(radius, angle) {
  const twist = 5.4 * Math.pow(radius / outerRadius, 0.76);
  const theta = angle + twist;
  return `${(500 + Math.cos(theta) * radius).toFixed(2)},${(500 + Math.sin(theta) * radius).toFixed(2)}`;
}
const sections = colors
  .map((color, index) => {
    const outside = Array.from({ length: steps + 1 }, (_, step) =>
      point((step / steps) * outerRadius, (index / colors.length) * fullTurn),
    );
    const inside = Array.from({ length: steps + 1 }, (_, step) =>
      point(
        (1 - step / steps) * outerRadius,
        ((index + 1) / colors.length) * fullTurn,
      ),
    );
    return `<path d="M${outside.join(" L")} L${inside.join(" L")} Z" fill="${color}" stroke="${color}" stroke-width="2"/>`;
  })
  .join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1000 1000">
<defs>
<filter id="dye" filterUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
<feTurbulence type="fractalNoise" baseFrequency="0.006 0.008" numOctaves="4" seed="13" result="blooms"/>
<feDisplacementMap in="SourceGraphic" in2="blooms" scale="145" xChannelSelector="R" yChannelSelector="G"/>
<feGaussianBlur stdDeviation="2.4"/>
</filter>
<filter id="resist" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.025 0.032" numOctaves="4" seed="9"/>
<feColorMatrix type="matrix" values="0 0 0 0 .80  0 0 0 0 .78  0 0 0 0 .75  2.3 0 0 0 -.83"/>
<feGaussianBlur stdDeviation="1.8"/>
</filter>
<filter id="pigment" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.009 0.012" numOctaves="3" seed="31"/>
<feColorMatrix type="saturate" values="0"/>
</filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="27" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
</filter>
</defs>
<rect width="1000" height="1000" fill="#302b29"/>
<g filter="url(#dye)">${sections}</g>
<rect width="1000" height="1000" filter="url(#pigment)" opacity="0.28" style="mix-blend-mode:soft-light"/>
<rect width="1000" height="1000" filter="url(#resist)" opacity="0.30"/>
<rect width="1000" height="1000" filter="url(#grain)" opacity="0.065" style="mix-blend-mode:multiply"/>
</svg>`;
async function main() {
  const output = path.join(
    __dirname,
    "../app/bouncer/public/images/time-to-fall-spiral.webp",
  );
  await fs.mkdir(path.dirname(output), { recursive: true });
  const result = await sharp(Buffer.from(svg))
    .webp({ quality: 86 })
    .toFile(output);
  console.log(
    `Rendered ${result.width} × ${result.height} spiral (${result.size} bytes).`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
