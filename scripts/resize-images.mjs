import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, readFile } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = resolve(__dirname, '../static');

// [file, maxWidth, maxHeight, quality]
// Sizes are 2x the displayed dimensions for Retina support
const targets = [
	// Mobile photos: displayed 460x185 → need 920x370 at 2x
	{ file: 'you_1_m.webp', w: 920, h: 380, q: 82 },
	{ file: 'you_2_m.webp', w: 920, h: 380, q: 82 },
	{ file: 'you_3_m.webp', w: 920, h: 380, q: 82 },
	// Icons: displayed 40x40 → need 80x80 at 2x
	{ file: 'willpower.webp', w: 80, h: 80, q: 80 },
	{ file: 'vacation.webp', w: 80, h: 80, q: 80 },
	{ file: 'time_management.webp', w: 80, h: 80, q: 80 },
	// Decorative: small displayed sizes
	{ file: 'heart_1.webp', w: 48, h: 48, q: 75 },
	{ file: 'arrow_3.webp', w: 140, h: 140, q: 75 },
	{ file: 'arrow_1.webp', w: 112, h: 120, q: 75 },
	{ file: 'star_1.webp', w: 60, h: 60, q: 75 },
	{ file: 'star_2.webp', w: 64, h: 64, q: 75 },
	{ file: 'star_3.webp', w: 60, h: 60, q: 75 },
];

for (const { file, w, h, q } of targets) {
	const path = resolve(staticDir, file);
	const originalData = await readFile(path);
	const meta = await sharp(originalData).metadata();
	const originalSize = Math.round(originalData.length / 1024);

	const newData = await sharp(originalData)
		.resize(w, h, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: q })
		.toBuffer();

	const newSize = Math.round(newData.length / 1024);

	if (newSize < originalSize) {
		await writeFile(path, newData);
		console.log(`✓ ${file}: ${meta.width}x${meta.height} → ${w}x${h}, ${originalSize}KB → ${newSize}KB`);
	} else {
		console.log(`~ ${file}: already optimal (${originalSize}KB), skipped`);
	}
}
