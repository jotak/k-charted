import { Datapoint, NamedTimeSeries } from '../../../common/types/Metrics';
import { VCLines, LegendInfo, VCLine, LegendItem, VCDataPoint, makeLegend, RichDataPoint, LineInfo, RawOrBucket, BucketDataPoint, VCSinglePoint } from '../types/VictoryChartInfo';
import { filterAndNameMetric, LabelsInfo } from '../../../common/utils/timeSeriesUtils';
import { ChartModel } from '../../../common/types/Dashboards';
import { Overlay, OverlayInfo } from '../types/Overlay';
import Colors from './colors';

export const toVCDatapoints = (dps: Datapoint[], name: string): VCDataPoint[] => {
  return dps.map(dp => {
      return {
        name: name,
        x: new Date(dp[0] * 1000),
        y: Number(dp[1]),
      };
    })
    .filter(dp => !isNaN(dp.y));
};

export const toVCSinglePoint = (dps: Datapoint[], name: string): VCSinglePoint | undefined => {
  if (dps.length === 0) {
    return undefined;
  }
  const last = dps.filter(dp => !isNaN(dp[1]))
    .reduce((p, c) => c[0] > p[0] ? c : p);
  if (last) {
    return {
      name: name,
      time: new Date(last[0] * 1000),
      x: 0, // placeholder
      y: Number(last[1]),
    };
  }
  return undefined;
};

export const toVCLine = <T extends LineInfo>(dps: VCDataPoint[], lineInfo: T): VCLine<VCDataPoint & T> => {
  const datapoints: (VCDataPoint & T)[] = dps.map(dp => ({ ...lineInfo, ...dp }));
  const legendItem: LegendItem = makeLegend(lineInfo.name, lineInfo.color, lineInfo.symbol);
  return {
    datapoints: datapoints,
    legendItem: legendItem,
    color: lineInfo.color
  };
};

const toVCLines = (ts: NamedTimeSeries[], unit: string, colors: Colors): VCLines<RichDataPoint> => {
  return ts.map(line => {
    const dps = toVCDatapoints(line.values, line.name);
    return toVCLine(dps, { name: line.name, unit: unit, color: colors.next() });
  });
};

const toSinglePointSeries = (ts: NamedTimeSeries[], unit: string, colors: Colors): VCLines<RichDataPoint> => {
  return ts.map(line => ({ line: line, point: toVCSinglePoint(line.values, line.name) }))
    .sort((a, b) => {
      if (a.point) {
        if (b.point) {
          return a.point.time.getTime() - b.point.time.getTime()
        }
        return -1;
      }
      return 1;
    })
    .map(o => toVCLine(o.point ? [o.point] : [], { name: o.line.name, unit: unit, color: colors.next() }));
};

export const getDataSupplier = (chart: ChartModel, labels: LabelsInfo, colors: string[]): (() => VCLines<RichDataPoint>) => {
  return () => {
    const c = new Colors(colors);
    const filtered = filterAndNameMetric(chart.metrics, labels);
    if (chart.xAxis === 'series') {
      return toSinglePointSeries(filtered, chart.unit, c);
    }
    return toVCLines(filtered, chart.unit, c);
  };
};

export const buildLegendInfo = (items: LegendItem[], chartWidth: number): LegendInfo => {
  // Very arbitrary rules to try to get a good-looking legend. There's room for enhancement.
  // Box size in pixels per item
  // Note that it is based on longest string in characters, not pixels
  let boxSize = 110;
  const longest = items.map(it => it.name).reduce((a, b) => a.length > b.length ? a : b, '').length;
  if (longest >= 30) {
    boxSize = 400;
  } else if (longest >= 20) {
    boxSize = 300;
  } else if (longest >= 10) {
    boxSize = 200;
  }
  const itemsPerRow = Math.max(1, Math.floor(chartWidth / boxSize));
  const nbRows = Math.ceil(items.length / itemsPerRow);

  return {
    height: 15 + 30 * nbRows,
    itemsPerRow: itemsPerRow
  };
};

// toBuckets accumulates datapoints into bukets.
// The result is still a (smaller) list of VCDataPoints, but with Y value being an array of values instead of a single value.
// This data structure is required by VictoryBoxPlot object.
export const toBuckets = <T extends LineInfo>(nbuckets: number, datapoints: VCDataPoint[], lineInfo: T, timeWindow?: [Date, Date]): (T & BucketDataPoint)[] => {
  if (datapoints.length === 0) {
    return [];
  }
  // xBuilder will preserve X-axis type when building buckets (either dates or raw numbers)
  const xBuilder: (x: number) => number | Date = typeof datapoints[0].x === 'object'
    ? x => new Date(x)
    : x => x;

  let min = 0;
  let max = 0;
  if (timeWindow) {
    min = timeWindow[0].getTime();
    max = timeWindow[1].getTime();
  } else {
    const times = datapoints.map(dp => Number(dp.x));
    min = Math.min(...times);
    max = Math.max(...times);
  }
  const bucketSize = (1 + max - min) / nbuckets;
  // Create $nbuckets buckets at regular intervals with preset / static content $dpInject
  const buckets: (T & BucketDataPoint)[] = Array.from({ length: nbuckets }, (_, idx) => {
    const start = Math.floor(min + idx * bucketSize);
    const end = Math.floor(start + bucketSize - 1);
    return {
      ...lineInfo,
      start: xBuilder(start),
      end: xBuilder(end),
      x: xBuilder(Math.floor(start + bucketSize / 2)),
      y: []
    };
  });
  datapoints.forEach(dp => {
    // Get bucket index from timestamp
    const idx = Math.floor((Number(dp.x) - min) / bucketSize);
    // This index might be out of range when a timeWindow is provided, so protect against that
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].y.push(dp.y);
    }
  });
  return buckets.filter(b => b.y.length > 0);
};

export const toOverlay = <T extends LineInfo>(info: OverlayInfo<T>, dps: VCDataPoint[]): Overlay<T> => {
  return {
    info: info,
    vcLine: toVCLine(dps, info.lineInfo)
  };
};

const createDomainConverter = <T extends LineInfo>(dps: RawOrBucket<T>[], pxlSize: number, numFunc: (dp: RawOrBucket<T>) => number) => {
  // Clicked position in screen coordinate (relative to svg element) are transformed in domain-data coordinate
  //  This is assuming a linear scale and no data padding
  const values = dps.map(dp => numFunc(dp));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return {
    asPixels: (domain: number) => pxlSize * (domain - min) / range
  };
};

// findClosestDatapoint will search in all datapoints which is the closer to the given position in pixels
//  This is done by converting screen coords into domain coords, then finding the least distance between this converted point and all the datapoints.
export const findClosestDatapoint = <T extends LineInfo>(flatDP: RawOrBucket<T>[], posX: number, posY: number, width: number, height: number): RawOrBucket<T> | undefined => {
  if (width <= 0 || height <= 0 || flatDP.length === 0) {
    return undefined;
  }
  // reversed y coords
  posY = height - posY;
  const xNumFunc: (dp: RawOrBucket<T>) => number = typeof flatDP[0].x === 'object' ? dp => (dp.x as Date).getTime() : dp => dp.x as number;
  // yFunc: When datapoint is a bucket, use the min value to locate position
  // This is for consistency, as it's also the min that seems to be used for tooltips / voronoi (I'd prefer median otherwise)
  const yFunc = (dp: RawOrBucket<T>) => Array.isArray(dp.y) ? Math.min(...dp.y) : dp.y;
  const xConv = createDomainConverter(flatDP, width, xNumFunc);
  const yConv = createDomainConverter(flatDP, height, yFunc);

  type DataPointDistance = {
    dp: RawOrBucket<T>,
    dist: number
  };
  return flatDP.reduce((p: DataPointDistance | null, c: RawOrBucket<T>) => {
    const newDist: DataPointDistance = {
      dp: c,
      dist: Math.abs(posX - xConv.asPixels(xNumFunc(c))) + Math.abs(posY - yConv.asPixels(yFunc(c)))
    };
    return (p === null || newDist.dist < p.dist) ? newDist : p;
  }, null)!.dp;
};
