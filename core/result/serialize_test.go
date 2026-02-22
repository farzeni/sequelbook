package result

import (
	"math/big"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sequelbook/sequelbook/core/executor"
	"github.com/stretchr/testify/assert"
)

func TestSerializeValue_Nil(t *testing.T) {
	assert.Nil(t, serializeValue(nil, ""))
}

func TestSerializeValue_Primitives(t *testing.T) {
	tests := []struct {
		name  string
		input any
		want  any
	}{
		{"bool true", true, true},
		{"bool false", false, false},
		{"int16", int16(42), int16(42)},
		{"int32", int32(100), int32(100)},
		{"int64", int64(9999), int64(9999)},
		{"uint32", uint32(7), uint32(7)},
		{"float32", float32(3.14), float32(3.14)},
		{"float64", float64(2.718), float64(2.718)},
		{"string", "hello", "hello"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, serializeValue(tt.input, ""))
		})
	}
}

func TestSerializeValue_Time(t *testing.T) {
	loc, _ := time.LoadLocation("America/New_York")
	ts := time.Date(2024, 3, 15, 12, 30, 45, 123456789, loc)
	result := serializeValue(ts, "")
	assert.Equal(t, ts.UTC().Format(time.RFC3339Nano), result)
}

func TestSerializeValue_Bytea(t *testing.T) {
	result := serializeValue([]byte("hi"), executor.DisplayTypeBinary)
	assert.Equal(t, `\x6869`, result)
}

func TestSerializeValue_JSON(t *testing.T) {
	input := []byte(`{"k":"v"}`)
	result := serializeValue(input, executor.DisplayTypeJSON)
	assert.Equal(t, `{"k":"v"}`, result)
}

func TestSerializeValue_UUID(t *testing.T) {
	var b [16]byte
	for i := range b {
		b[i] = byte(i)
	}
	result := serializeValue(b, executor.DisplayTypeUUID)
	// 00010203-0405-0607-0809-0a0b0c0d0e0f
	assert.Equal(t, "00010203-0405-0607-0809-0a0b0c0d0e0f", result)
}

func TestSerializeValue_Numeric_Integer(t *testing.T) {
	n := pgtype.Numeric{
		Int:   big.NewInt(42),
		Exp:   0,
		Valid: true,
	}
	assert.Equal(t, "42", serializeValue(n, ""))
}

func TestSerializeValue_Numeric_Decimal(t *testing.T) {
	n := pgtype.Numeric{
		Int:   big.NewInt(12300),
		Exp:   -2,
		Valid: true,
	}
	assert.Equal(t, "123.00", serializeValue(n, ""))
}

func TestSerializeValue_Numeric_NaN(t *testing.T) {
	n := pgtype.Numeric{
		NaN:   true,
		Valid: true,
	}
	assert.Equal(t, "NaN", serializeValue(n, ""))
}

func TestSerializeValue_Numeric_Invalid(t *testing.T) {
	n := pgtype.Numeric{Valid: false}
	assert.Nil(t, serializeValue(n, ""))
}

func TestSerializeValue_Numeric_PositiveExp(t *testing.T) {
	n := pgtype.Numeric{
		Int:   big.NewInt(5),
		Exp:   3,
		Valid: true,
	}
	// 5 * 10^3 = 5000
	assert.Equal(t, "5000", serializeValue(n, ""))
}

func TestSerializeValue_Interval(t *testing.T) {
	iv := pgtype.Interval{
		Months:       2,
		Days:         15,
		Microseconds: 3600000000,
		Valid:        true,
	}
	result := serializeValue(iv, "")
	m, ok := result.(map[string]any)
	assert.True(t, ok)
	assert.Equal(t, int32(2), m["months"])
	assert.Equal(t, int32(15), m["days"])
	assert.Equal(t, int64(3600000000), m["microseconds"])
}

func TestSerializeValue_PgtypeTime(t *testing.T) {
	// 14:30:00 = 52200 seconds = 52200 * 1e6 microseconds
	pt := pgtype.Time{
		Microseconds: 14*3_600_000_000 + 30*60_000_000,
		Valid:        true,
	}
	assert.Equal(t, "14:30:00", serializeValue(pt, ""))
}

func TestSerializeValue_PgtypeTime_WithFrac(t *testing.T) {
	// 14:30:00.500000
	pt := pgtype.Time{
		Microseconds: 14*3_600_000_000 + 30*60_000_000 + 500000,
		Valid:        true,
	}
	assert.Equal(t, "14:30:00.500000", serializeValue(pt, ""))
}

func TestSerializeValue_BoolSlice(t *testing.T) {
	input := []bool{true, false}
	result := serializeValue(input, "")
	assert.Equal(t, []any{true, false}, result)
}

func TestSerializeValue_Int32Slice(t *testing.T) {
	input := []int32{1, 2}
	result := serializeValue(input, "")
	assert.Equal(t, []any{int32(1), int32(2)}, result)
}

func TestSerializeValue_Unknown(t *testing.T) {
	type myStruct struct{ X int }
	s := myStruct{X: 42}
	result := serializeValue(s, "")
	str, ok := result.(string)
	assert.True(t, ok)
	assert.Contains(t, str, "42")
}

func TestSerializeRow_Mixed(t *testing.T) {
	cols := []executor.Column{
		{DisplayType: executor.DisplayTypeText},
		{DisplayType: executor.DisplayTypeNumber},
		{DisplayType: executor.DisplayTypeJSON},
		{DisplayType: executor.DisplayTypeBinary},
	}
	ts := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	row := []any{
		"hello",
		int64(42),
		[]byte(`{"key":"value"}`),
		[]byte{0xde, 0xad},
	}
	_ = ts
	result := serializeRow(row, cols)
	assert.Equal(t, "hello", result[0])
	assert.Equal(t, int64(42), result[1])
	assert.Equal(t, `{"key":"value"}`, result[2])
	assert.Equal(t, `\xdead`, result[3])
}

func TestSerializeRow_Nil(t *testing.T) {
	assert.Nil(t, serializeRow(nil, nil))
}

func TestSerializeValue_Int64Slice(t *testing.T) {
	result := serializeValue([]int64{10, 20}, "")
	assert.Equal(t, []any{int64(10), int64(20)}, result)
}

func TestSerializeValue_Float64Slice(t *testing.T) {
	result := serializeValue([]float64{1.1, 2.2}, "")
	assert.Equal(t, []any{1.1, 2.2}, result)
}

func TestSerializeValue_StringSlice(t *testing.T) {
	result := serializeValue([]string{"a", "b"}, "")
	assert.Equal(t, []any{"a", "b"}, result)
}

func TestSerializeValue_TimeSlice(t *testing.T) {
	ts := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	result := serializeValue([]time.Time{ts}, "")
	sl, ok := result.([]any)
	assert.True(t, ok)
	assert.Equal(t, ts.UTC().Format(time.RFC3339Nano), sl[0])
}

func TestSerializeValue_Numeric_Infinity(t *testing.T) {
	n := pgtype.Numeric{
		Valid:            true,
		InfinityModifier: pgtype.Infinity,
	}
	assert.Equal(t, "Infinity", serializeValue(n, ""))
}

func TestSerializeValue_Numeric_NegativeInfinity(t *testing.T) {
	n := pgtype.Numeric{
		Valid:            true,
		InfinityModifier: pgtype.NegativeInfinity,
	}
	assert.Equal(t, "-Infinity", serializeValue(n, ""))
}

func TestSerializeValue_Numeric_NilInt(t *testing.T) {
	// Valid numeric with nil Int field → "0"
	n := pgtype.Numeric{
		Valid: true,
		Int:   nil,
	}
	assert.Equal(t, "0", serializeValue(n, ""))
}

func TestSerializeValue_PgtypeTime_Invalid(t *testing.T) {
	pt := pgtype.Time{Valid: false}
	assert.Nil(t, serializeValue(pt, ""))
}
