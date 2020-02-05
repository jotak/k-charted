import * as React from 'react';
import { format as d3Format } from 'd3-format';
import { ChartVoronoiContainer, ChartTooltip } from '@patternfly/react-charts';
import { getFormatter } from '../../../common/utils/formatter';
import { CustomFlyout, CustomLabel } from './CustomFlyout';

export const createContainer = () => {
  const tooltip = <ChartTooltip flyoutComponent={<CustomFlyout/>} labelComponent={<CustomLabel/>} constrainToVisibleArea={true} />;
  return (
    <ChartVoronoiContainer
      labels={obj => `${obj.datum.name}: ${getFormatter(d3Format, obj.datum.unit)(obj.datum.actualY || obj.datum.y)}`}
      labelComponent={tooltip}
      // We blacklist "parent" as a workaround to avoid the VictoryVoronoiContainer crashing.
      // See https://github.com/FormidableLabs/victory/issues/1355
      voronoiBlacklist={['parent']}
    />
  );
};
