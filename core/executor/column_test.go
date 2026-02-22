package executor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOidToDisplayType(t *testing.T) {
	tests := []struct {
		name        string
		oid         uint32
		wantType    DisplayType
		wantName    string
	}{
		// Text types
		{"text", oidText, DisplayTypeText, "text"},
		{"varchar", oidVarchar, DisplayTypeText, "varchar"},
		{"char", oidChar, DisplayTypeText, "char"},
		{"name", oidName, DisplayTypeText, "name"},
		{"xml", oidXML, DisplayTypeText, "xml"},

		// Numeric types
		{"int2", oidInt2, DisplayTypeNumber, "int2"},
		{"int4", oidInt4, DisplayTypeNumber, "int4"},
		{"int8", oidInt8, DisplayTypeNumber, "int8"},
		{"float4", oidFloat4, DisplayTypeNumber, "float4"},
		{"float8", oidFloat8, DisplayTypeNumber, "float8"},
		{"numeric", oidNumeric, DisplayTypeNumber, "numeric"},
		{"money", oidMoney, DisplayTypeNumber, "money"},
		{"oid", oidOID, DisplayTypeNumber, "oid"},

		// Boolean
		{"bool", oidBool, DisplayTypeBoolean, "bool"},

		// Timestamp/Date/Time
		{"timestamp", oidTimestamp, DisplayTypeTimestamp, "timestamp"},
		{"timestamptz", oidTimestampTz, DisplayTypeTimestamp, "timestamptz"},
		{"date", oidDate, DisplayTypeTimestamp, "date"},
		{"time", oidTime, DisplayTypeTimestamp, "time"},
		{"timetz", oidTimeTz, DisplayTypeTimestamp, "timetz"},

		// Interval
		{"interval", oidInterval, DisplayTypeInterval, "interval"},

		// JSON
		{"json", oidJSON, DisplayTypeJSON, "json"},
		{"jsonb", oidJSONB, DisplayTypeJSON, "jsonb"},

		// Binary
		{"bytea", oidBytea, DisplayTypeBinary, "bytea"},
		{"bit", oidBit, DisplayTypeBinary, "bit"},
		{"varbit", oidVarbit, DisplayTypeBinary, "varbit"},

		// UUID
		{"uuid", oidUUID, DisplayTypeUUID, "uuid"},

		// Arrays
		{"bool[]", oidBoolArray, DisplayTypeArray, "bool[]"},
		{"bytea[]", oidByteaArray, DisplayTypeArray, "bytea[]"},
		{"int2[]", oidInt2Array, DisplayTypeArray, "int2[]"},
		{"int4[]", oidInt4Array, DisplayTypeArray, "int4[]"},
		{"int8[]", oidInt8Array, DisplayTypeArray, "int8[]"},
		{"float4[]", oidFloat4Array, DisplayTypeArray, "float4[]"},
		{"float8[]", oidFloat8Array, DisplayTypeArray, "float8[]"},
		{"text[]", oidTextArray, DisplayTypeArray, "text[]"},
		{"varchar[]", oidVarcharArray, DisplayTypeArray, "varchar[]"},
		{"date[]", oidDateArray, DisplayTypeArray, "date[]"},
		{"timestamp[]", oidTimestampArray, DisplayTypeArray, "timestamp[]"},
		{"timestamptz[]", oidTimestampTzArray, DisplayTypeArray, "timestamptz[]"},
		{"interval[]", oidIntervalArray, DisplayTypeArray, "interval[]"},
		{"numeric[]", oidNumericArray, DisplayTypeArray, "numeric[]"},
		{"uuid[]", oidUUIDArray, DisplayTypeArray, "uuid[]"},
		{"jsonb[]", oidJSONBArray, DisplayTypeArray, "jsonb[]"},

		// Unknown
		{"unknown", 999999, DisplayTypeUnknown, "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotType := oidToDisplayType(tt.oid)
			assert.Equal(t, tt.wantType, gotType, "DisplayType mismatch for %s", tt.name)

			gotName := oidToTypeName(tt.oid)
			assert.Equal(t, tt.wantName, gotName, "Type name mismatch for %s", tt.name)
		})
	}
}

func TestOidToTypeName_Consistency(t *testing.T) {
	// Ensure all known OIDs have non-"unknown" type names
	knownOIDs := []uint32{
		oidBool, oidBytea, oidChar, oidName, oidInt8, oidInt2, oidInt4,
		oidText, oidOID, oidJSON, oidXML, oidFloat4, oidFloat8, oidMoney,
		oidVarchar, oidDate, oidTime, oidTimestamp, oidTimestampTz,
		oidInterval, oidTimeTz, oidBit, oidVarbit, oidNumeric, oidUUID,
		oidJSONB,
	}

	for _, oid := range knownOIDs {
		name := oidToTypeName(oid)
		assert.NotEqual(t, "unknown", name, "OID %d should have a known type name", oid)
	}
}
