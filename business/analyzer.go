package business

import (
	"time"

	"github.com/kiali/k-charted/log"
	"github.com/kiali/k-charted/prometheus"
)

type Pair struct {
	Past float64 `json:"past"`
	Last float64 `json:"last"`
}

// FindStdDevIncreases compares the standard deviation over [T-30m, T] with standard deviation over [T-5m, T] to detect unusual changes;
//	this is performed for every available metric with the supplied labels set.
func FindStdDevIncreases(promClient prometheus.ClientInterface, logger log.LogAdapter, labels string, t time.Time) map[string]Pair {
	ret := make(map[string]Pair)
	metrics, err := promClient.GetMetricsForLabels([]string{labels})
	if err != nil {
		logger.Errorf("Error: analyzeSuspiciousRateAtTimestamp failed, cannot load metrics for labels: %s. Error was: %v", labels, err)
		return nil
	}
	minusFive := t.Add(-5 * time.Minute)
	pastTrend := "[30m:]"
	curTrend := "[5m:]"
	for _, metric := range metrics {
		logger.Tracef("Analyzing metric %s ...", metric)
		var past, last float64
		v0, err0 := promClient.GetStandardDev(metric, labels, pastTrend, minusFive)
		if err0 != nil {
			logger.Errorf("Error: %s", err0)
		} else if len(v0) == 0 {
			logger.Tracef("No past trend")
		} else {
			past = float64(v0[0].Value)
			logger.Tracef("Past trend standard deviation: %.2f", past)
		}
		v1, err1 := promClient.GetStandardDev(metric, labels, curTrend, t)
		if err1 != nil {
			logger.Errorf("Error: %s", err1)
		} else if len(v1) == 0 {
			logger.Tracef("No current value")
		} else {
			last = float64(v1[0].Value)
			logger.Tracef("Current standard deviation: %.2f", last)
		}
		if last > past*1.5 {
			ret[metric+labels] = Pair{Past: past, Last: last}
		}
	}
	return ret
}
