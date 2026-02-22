package result

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sequelbook/sequelbook/core/executor"
)

// serializeRow converts a raw row to JSON-safe values using column metadata for type hints.
func serializeRow(row []any, columns []executor.Column) []any {
	if row == nil {
		return nil
	}
	out := make([]any, len(row))
	for i, v := range row {
		var hint executor.DisplayType
		if i < len(columns) {
			hint = columns[i].DisplayType
		}
		out[i] = serializeValue(v, hint)
	}
	return out
}

// serializeValue converts a single raw value to a JSON-safe representation.
// hint is used only to distinguish []byte cases (DisplayTypeJSON vs DisplayTypeBinary).
func serializeValue(v any, hint executor.DisplayType) any {
	if v == nil {
		return nil
	}

	switch val := v.(type) {
	case bool:
		return val
	case int16:
		return val
	case int32:
		return val
	case int64:
		return val
	case uint32:
		return val
	case float32:
		return val
	case float64:
		return val
	case string:
		return val

	case time.Time:
		return val.UTC().Format(time.RFC3339Nano)

	case []byte:
		if hint == executor.DisplayTypeJSON {
			return string(val)
		}
		return `\x` + hex.EncodeToString(val)

	case [16]byte:
		return formatUUID(val)

	case pgtype.Numeric:
		return formatNumeric(val)

	case pgtype.Interval:
		return map[string]any{
			"months":       val.Months,
			"days":         val.Days,
			"microseconds": val.Microseconds,
		}

	case pgtype.Time:
		return formatPgtypeTime(val)

	// Typed slices — serialize each element.
	case []bool:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out
	case []int32:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out
	case []int64:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out
	case []float64:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out
	case []string:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out
	case []time.Time:
		out := make([]any, len(val))
		for i, e := range val {
			out[i] = serializeValue(e, "")
		}
		return out

	default:
		return fmt.Sprintf("%v", val)
	}
}

// formatUUID formats a 16-byte UUID as a hyphenated string.
func formatUUID(b [16]byte) string {
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// formatNumeric converts a pgtype.Numeric to a decimal string.
func formatNumeric(n pgtype.Numeric) any {
	if !n.Valid {
		return nil
	}
	switch n.InfinityModifier {
	case pgtype.Infinity:
		return "Infinity"
	case pgtype.NegativeInfinity:
		return "-Infinity"
	}
	if n.NaN {
		return "NaN"
	}
	if n.Int == nil {
		return "0"
	}

	intVal := new(big.Int).Set(n.Int)
	exp := n.Exp

	if exp >= 0 {
		// Multiply by 10^exp
		if exp > 0 {
			mul := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(exp)), nil)
			intVal.Mul(intVal, mul)
		}
		return intVal.String()
	}

	// Negative exponent: need decimal point |exp| digits from right.
	absExp := int(-exp)
	digits := intVal.String()

	// Handle negative sign.
	negative := false
	if len(digits) > 0 && digits[0] == '-' {
		negative = true
		digits = digits[1:]
	}

	// Zero-pad to ensure enough digits before decimal point.
	for len(digits) <= absExp {
		digits = "0" + digits
	}

	insertAt := len(digits) - absExp
	result := digits[:insertAt] + "." + digits[insertAt:]

	if negative {
		result = "-" + result
	}
	return result
}

// formatPgtypeTime converts pgtype.Time microseconds-since-midnight to a string.
func formatPgtypeTime(t pgtype.Time) any {
	if !t.Valid {
		return nil
	}
	us := t.Microseconds
	hours := us / 3_600_000_000
	us -= hours * 3_600_000_000
	minutes := us / 60_000_000
	us -= minutes * 60_000_000
	seconds := us / 1_000_000
	frac := us - seconds*1_000_000

	if frac == 0 {
		return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
	}
	return fmt.Sprintf("%02d:%02d:%02d.%06d", hours, minutes, seconds, frac)
}
