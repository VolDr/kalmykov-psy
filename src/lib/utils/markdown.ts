export type MarkdownPart = string | { text: string; href: string } | { text: string; bold: true };

/**
 * Parse markdown-style links [text](url) and bold text **text** from a string
 * @param text - String containing markdown links and bold text
 * @returns Array of strings, link objects, and bold objects
 */
export function parseMarkdownLinks(text: string): MarkdownPart[] {
	const parts: MarkdownPart[] = [];
	// Combined regex for links and bold text
	const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
	let lastIndex = 0;
	let match;

	while ((match = markdownRegex.exec(text)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			parts.push(text.substring(lastIndex, match.index));
		}

		// Check if it's a link or bold text
		if (match[1] && match[2]) {
			// It's a link [text](url)
			parts.push({ text: match[1], href: match[2] });
		} else if (match[3]) {
			// It's bold text **text**
			parts.push({ text: match[3], bold: true as const });
		}

		lastIndex = match.index + match[0].length;
	}

	// Add remaining text
	if (lastIndex < text.length) {
		parts.push(text.substring(lastIndex));
	}

	return parts.length > 0 ? parts : [text];
}

/**
 * Check if a URL is external (starts with http:// or https://)
 */
export function isExternalUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}
