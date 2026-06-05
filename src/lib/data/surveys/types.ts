export interface SurveyOption {
	label: string;
	value: number;
	points?: number;
}

export interface SurveyQuestion {
	id: string;
	text: string;
	alternativeText?: string; // Alternative text based on condition
	textCondition?: (answers: Record<string, number>) => boolean; // Condition for alternative text
	type: 'radio' | 'checkbox' | 'textarea' | 'subheading';
	required?: boolean;
	optional?: boolean;
	tipText?: string;
	countInScore?: boolean;
	options?: SurveyOption[];
	showPoints?: boolean;
	conditionalDisplay?: {
		condition: (answers: Record<string, number>) => boolean;
	};
}

export interface InfoSection {
	title: string;
	type?: 'warning' | 'info' | 'alert';
	icon?: string;
	content:
		| string
		| {
				purpose?: string;
				bullets?: string[];
		  };
	expanded?: boolean;
}

export interface ScoringInterpretation {
	min: number;
	max: number;
	severity: string;
	recommendation: string;
	color: 'green' | 'yellow' | 'orange' | 'red' | 'darkred';
}

export interface SubscaleScoring {
	id: string;
	name: string;
	description?: string;
	questionIds: string[];
	displayMethod?: 'sum' | 'average'; // How to display the score (default: 'average')
	interpretation: Array<{
		min: number;
		max: number;
		severity: string;
		color: 'green' | 'yellow' | 'orange' | 'red' | 'darkred';
	}>;
	alternativeInterpretation?: Array<{
		min: number;
		max: number;
		severity: string;
		color: 'green' | 'yellow' | 'orange' | 'red' | 'darkred';
	}>;
	interpretationCondition?: (answers: Record<string, number>) => boolean;
}

export interface Warning {
	condition: (answers: Record<string, number>) => boolean;
	type: 'critical' | 'warning' | 'info';
	title: string;
	message: string;
}

export interface NextStepsInfo {
	advice?: string;
	criticalActions?: string[];
	management?: {
		title: string;
		table: Array<{
			score: string;
			severity: string;
			action: string;
		}>;
	};
}

export interface SurveyConfig {
	id: string;
	title: string;
	description: string;
	time: string;
	infoSections: Record<string, InfoSection>;
	questions: SurveyQuestion[];
	scoring: {
		method: 'sum' | 'average';
		maxScore: number;
		maxAverageScore?: number; // For 'average' method, the maximum possible average score
		excludeFromScore?: string[];
		interpretation: ScoringInterpretation[];
		subscales?: SubscaleScoring[];
	};
	warnings?: Warning[];
	nextSteps?: NextStepsInfo;
}
