export type AnalyticsPost = {
	telegramMessageId: number;
	publishedAt: string;
	text: string;
	theme: string;
	format: string;
	views: number;
	engagementRate: number;
	score: number;
	tier: string;
};

export type ChannelRecommendation = {
	prio: 'high' | 'med' | 'low';
	title: string;
	body: string;
	basis: string;
};

export type ChannelDataset = {
	meta: { handle: string; period: string; generated: string };
	summary: {
		totalPosts: number;
		avgViews: number;
		avgEr: number;
		topPostViews: number;
		growth: number;
	};
	themeHues: Record<string, number>;
	heatmap: Record<string, number[]>;
	months: Array<{ month: string; views: number }>;
	formatNames: Record<string, string>;
	tierMeta: Record<string, { rank: number; label: string; hue: number }>;
	recommendations: Array<{ group: string; items: ChannelRecommendation[] }>;
};

export type DistributionGroup = {
	title: string;
	total: number;
	items: Array<{ name: string; n: number; share: number; accent?: boolean }>;
};

export type Breakdown = {
	title: string;
	rows: Array<{
		label?: string;
		pattern?: string;
		n: number;
		avg: number;
		med: number;
		er?: number | null;
		hi?: boolean;
	}>;
	note?: string;
};

export type StructuresDataset = {
	meta: {
		totalPostsInChannel: number;
		afterFilter: number;
		uniqueCombinations: number;
		patternsWith5plus: number;
		sample: number;
	};
	distributions: Record<string, DistributionGroup>;
	flags: Array<{ key: string; label: string; n: number; total: number; accent: string }>;
	patterns: Array<{
		n: number;
		title: string;
		length: string;
		structure: string;
		posts: number;
		avgViews: number;
		avgEr: number;
		featured?: boolean;
		examples: Array<{ id: number; v: number; er: number; text: string }>;
		note: string;
		ehScore: number | null;
	}>;
	emailHero: {
		formula: string;
		formulaShort: string;
		formulaQuote: string;
		structure: Array<{ name: string; fn: string }>;
		principles: string[];
		mistakes: string[];
		headlines: Array<{ n: number; type: string; desc: string }>;
	};
	gaps: Array<{ title: string; body: string }>;
	antipatterns: Array<{ title: string; body: string }>;
	keyMetrics: { avgViews: number; medViews: number; avgEr: number; medEr: number };
	cta: {
		title: string;
		rows: Array<{ label: string; n: number; avg: number; med: number; er: number }>;
		note: string;
	};
	byZachin: Breakdown;
	byBody: Breakdown;
	byLength: Breakdown;
	topByMedian: Breakdown;
	templates: Array<{
		n: number;
		title: string;
		tag: string;
		structure: string[];
		headline: string;
		example: string;
	}>;
	recommendations: Array<{
		n: number;
		prio: 'high' | 'med' | 'low';
		title: string;
		body: string;
		meta: string;
	}>;
};

export type ExpertiseThesis = {
	node: string;
	status: '✅' | '⚠️' | '❌';
	best_post_id: number | null;
	views: number | null;
	er: number | null;
	note: string;
	tg_format: string;
	tg_description: string;
	insta_format: string;
	insta_description: string;
};

export type ExpertiseDataset = {
	summary: { total: number; closed: number; weak: number; empty: number; off_map: number };
	sections: Array<{
		title: string;
		total: number;
		closed: number;
		weak: number;
		empty: number;
		subsections: Array<{ title: string; theses: ExpertiseThesis[] }>;
	}>;
	top_sections_gaps: string[];
	top_potential: string[];
};

export type PostsDashboardData = {
	posts: AnalyticsPost[];
	channel: ChannelDataset;
	structures: StructuresDataset;
	expertise: ExpertiseDataset;
	generatedAt: string | null;
};
