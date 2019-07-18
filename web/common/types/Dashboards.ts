import { TimeSeries, Histogram } from './Metrics';
import { PromLabel, LabelDisplayName } from './Labels';

export interface DashboardModel {
  title: string;
  charts: ChartModel[];
  aggregations: AggregationModel[];
}

export type SpanValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type ChartType = 'area' | 'line' | 'bar';

export interface ChartModel {
  name: string;
  unit: string;
  spans: SpanValue;
  chartType?: ChartType;
  min?: number;
  max?: number;
  metric?: TimeSeries[];
  histogram?: Histogram;
  error?: string;
}

export interface AggregationModel {
  label: PromLabel;
  displayName: LabelDisplayName;
}
