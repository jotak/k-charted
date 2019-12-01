package business

import (
	"fmt"
	"testing"
	"time"

	"github.com/kiali/k-charted/config/extconfig"
	"github.com/kiali/k-charted/log"
	"github.com/kiali/k-charted/prometheus"
	"github.com/stretchr/testify/assert"
)

var logger = log.NewSafeAdapter(log.LogAdapter{
	Errorf: func(s string, args ...interface{}) {
		fmt.Printf(s+"\n", args...)
	},
	Infof: func(s string, args ...interface{}) {
		fmt.Printf(s+"\n", args...)
	},
})

func TestFindStdDevIncreases(t *testing.T) {
	assert := assert.New(t)

	client, _ := prometheus.NewClient(extconfig.PrometheusConfig{
		URL: "http://prometheus-istio-system.127.0.0.1.nip.io/",
	})

	now := time.Now()
	labels := buildLabels("mesh-arena", map[string]string{"app": "stadium"})
	res1 := FindStdDevIncreases(client, logger, labels, now)

	labels = `{source_workload_namespace="mesh-arena",destination_app="stadium"}`
	res2 := FindStdDevIncreases(client, logger, labels, now)

	logger.Infof("Found large increase in standard deviations (1): %v", res1)
	logger.Infof("Found large increase in standard deviations (2): %v", res2)

	assert.True(false)
}
