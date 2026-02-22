package executor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewQueryID(t *testing.T) {
	// Generate multiple IDs
	id1 := NewQueryID()
	id2 := NewQueryID()
	id3 := NewQueryID()

	// All should have the correct prefix
	assert.Contains(t, id1, "qry_")
	assert.Contains(t, id2, "qry_")
	assert.Contains(t, id3, "qry_")

	// All should be unique
	assert.NotEqual(t, id1, id2)
	assert.NotEqual(t, id2, id3)
	assert.NotEqual(t, id1, id3)

	// All should have consistent length (qry_ = 4, xid = 20)
	assert.Len(t, id1, 24)
	assert.Len(t, id2, 24)
	assert.Len(t, id3, 24)

	// Should be deterministically formatted
	assert.Regexp(t, `^qry_[0-9a-v]{20}$`, id1)
	assert.Regexp(t, `^qry_[0-9a-v]{20}$`, id2)
}
