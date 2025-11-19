export interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  codeSnippet?: string;
}

export interface MockDataRow {
  [key: string]: string | number | boolean | null;
}

export enum Tab {
  GUIDE = 'GUIDE',
  SIMULATOR = 'SIMULATOR',
  DEPLOY = 'DEPLOY'
}

export interface QueryResult {
  sql: string;
  data: MockDataRow[];
  error?: string;
}