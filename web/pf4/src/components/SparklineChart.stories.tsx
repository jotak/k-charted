import React from 'react';
import { storiesOf } from '@storybook/react';

import { generateRandomHistogramChart, emptyLabels } from '../types/__mocks__/Charts.mock';
import { SparklineChart } from './SparklineChart';
import { getDataSupplier } from '../utils/victoryChartsUtils';
import { VCLine, makeLegend, VCLines } from '../types/VictoryChartInfo';

import '@patternfly/react-core/dist/styles/base.css';

const now = Date.now();
const dates = [new Date(now - 12000), new Date(now - 8000), new Date(now - 4000), new Date(now - 2000), new Date(now)];
const buildLine = (info: any, values: number[]): VCLine => {
  return {
    datapoints: values.map((v, i) => {
      return {
        x: dates[i],
        y: v,
        ...info
      };
    }),
    legendItem: makeLegend(info.name, info.color),
    color: info.color
  };
};

const histo: VCLines = [
  buildLine({ name: 'p99', unit: 'ms', color: 'orange' }, [2, 3, 2, 5, 3]),
  buildLine({ name: 'p95', unit: 'ms', color: 'blue' }, [2, 2.6666, 2, 3, 2]),
  buildLine({ name: 'p50', unit: 'ms', color: 'green' }, [2, 2.5, 2, 2.5, 2]),
  buildLine({ name: 'avg', unit: 'ms', color: 'black' }, [1.599, 1.8444, 2, 3, 1.5])
];

const rps: VCLines = [
  buildLine({ name: 'RPS', unit: 'rps', color: 'blue' }, [2, 3, 2, 5, 3]),
  buildLine({ name: 'Error', unit: 'rps', color: 'red' }, [0, 0.6666, 0.1111, 0.9111, 0])
];

storiesOf('SparklineCharts', module)
  .add('histogram', () => {
    return (
      <div style={{ width: 300 }}>
        <SparklineChart
          name={'rt'}
          height={70}
          width={300}
          showLegend={true}
          padding={{ top: 5 }}
          tooltipFormat={dp => {
            const val = Math.floor(dp.y * 1000) / 1000;
            return `${(dp.x as Date).toLocaleTimeString()} - ${dp.name}: ${val} ms`;
          }}
          series={histo}
        />
      </div>
    );
  })
  .add('RPS', () => {
    return (
      <div style={{ width: 300 }}>
        <SparklineChart
          name={'rps'}
          height={41}
          width={300}
          showLegend={false}
          padding={{ top: 5 }}
          tooltipFormat={dp => `${(dp.x as Date).toLocaleTimeString()}\n${dp.y} RPS`}
          series={rps}
        />
      </div>
    );
  });
