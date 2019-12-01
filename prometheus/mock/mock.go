package mock

import (
	"time"

	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/mock"

	"github.com/kiali/k-charted/prometheus"
)

type PromClientMock struct {
	mock.Mock
}

func (o *PromClientMock) FetchRange(metricName, labels, grouping, aggregator string, q *prometheus.MetricsQuery) prometheus.Metric {
	args := o.Called(metricName, labels, grouping, aggregator, q)
	return args.Get(0).(prometheus.Metric)
}

func (o *PromClientMock) FetchRateRange(metricName, labels, grouping string, q *prometheus.MetricsQuery) prometheus.Metric {
	args := o.Called(metricName, labels, grouping, q)
	return args.Get(0).(prometheus.Metric)
}

func (o *PromClientMock) FetchHistogramRange(metricName, labels, grouping string, q *prometheus.MetricsQuery) prometheus.Histogram {
	args := o.Called(metricName, labels, grouping, q)
	return args.Get(0).(prometheus.Histogram)
}

func (o *PromClientMock) GetMetricsForLabels(labels []string) ([]string, error) {
	args := o.Called(labels)
	return args.Get(0).([]string), args.Error(1)
}

func (o *PromClientMock) GetStandardDev(metricName, labels, timeRange string, t time.Time) (model.Vector, error) {
	args := o.Called(metricName, labels, timeRange, t)
	return args.Get(0).(model.Vector), args.Error(1)
}
