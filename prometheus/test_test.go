package prometheus

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func test_in() (string, error) {
	return "", fmt.Errorf("error!!")
}

func test() (b error) {
	a, b := test_in()
	if b != nil {
		return
	}
	b = fmt.Errorf("aaa%s", a)
	return
}

func TestGetStandardDev(t *testing.T) {
	assert := assert.New(t)

	err := test()
	assert.Equal("aaa", err)
}
