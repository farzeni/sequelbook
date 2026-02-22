package executor

// DisplayType provides a frontend rendering hint for column data.
// It maps PostgreSQL's rich type system to common display categories.
type DisplayType string

const (
	DisplayTypeText      DisplayType = "text"      // String types (text, varchar, char, etc.)
	DisplayTypeNumber    DisplayType = "number"    // Numeric types (int, float, numeric, etc.)
	DisplayTypeBoolean   DisplayType = "boolean"   // Boolean type
	DisplayTypeTimestamp DisplayType = "timestamp" // Date/time types (timestamp, date, time, etc.)
	DisplayTypeJSON      DisplayType = "json"      // JSON and JSONB
	DisplayTypeArray     DisplayType = "array"     // Array types
	DisplayTypeBinary    DisplayType = "binary"    // Bytea and binary data
	DisplayTypeUUID      DisplayType = "uuid"      // UUID type
	DisplayTypeInterval  DisplayType = "interval"  // Time interval
	DisplayTypeGeometry  DisplayType = "geometry"  // PostGIS geometry types
	DisplayTypeUnknown   DisplayType = "unknown"   // Unknown or unsupported types
)

// Common PostgreSQL type OIDs
// See: https://github.com/postgres/postgres/blob/master/src/include/catalog/pg_type.dat
const (
	oidBool             uint32 = 16
	oidBytea            uint32 = 17
	oidChar             uint32 = 18
	oidName             uint32 = 19
	oidInt8             uint32 = 20
	oidInt2             uint32 = 21
	oidInt4             uint32 = 23
	oidText             uint32 = 25
	oidOID              uint32 = 26
	oidJSON             uint32 = 114
	oidXML              uint32 = 142
	oidFloat4           uint32 = 700
	oidFloat8           uint32 = 701
	oidMoney            uint32 = 790
	oidVarchar          uint32 = 1043
	oidDate             uint32 = 1082
	oidTime             uint32 = 1083
	oidTimestamp        uint32 = 1114
	oidTimestampTz      uint32 = 1184
	oidInterval         uint32 = 1186
	oidTimeTz           uint32 = 1266
	oidBit              uint32 = 1560
	oidVarbit           uint32 = 1562
	oidNumeric          uint32 = 1700
	oidUUID             uint32 = 2950
	oidJSONB            uint32 = 3802

	// Array type OIDs (base type OID + array offset is not reliable)
	oidBoolArray        uint32 = 1000
	oidByteaArray       uint32 = 1001
	oidCharArray        uint32 = 1002
	oidNameArray        uint32 = 1003
	oidInt2Array        uint32 = 1005
	oidInt4Array        uint32 = 1007
	oidTextArray        uint32 = 1009
	oidVarcharArray     uint32 = 1015
	oidInt8Array        uint32 = 1016
	oidFloat4Array      uint32 = 1021
	oidFloat8Array      uint32 = 1022
	oidDateArray        uint32 = 1182
	oidTimeArray        uint32 = 1183
	oidTimestampArray   uint32 = 1115
	oidTimestampTzArray uint32 = 1185
	oidIntervalArray    uint32 = 1187
	oidNumericArray     uint32 = 1231
	oidUUIDArray        uint32 = 2951
	oidJSONBArray       uint32 = 3807
)

// oidToDisplayType maps a PostgreSQL type OID to a DisplayType.
func oidToDisplayType(oid uint32) DisplayType {
	switch oid {
	// Text types
	case oidText, oidVarchar, oidChar, oidName, oidXML:
		return DisplayTypeText

	// Numeric types
	case oidInt2, oidInt4, oidInt8:
		return DisplayTypeNumber
	case oidFloat4, oidFloat8:
		return DisplayTypeNumber
	case oidNumeric, oidMoney:
		return DisplayTypeNumber
	case oidOID:
		return DisplayTypeNumber

	// Boolean
	case oidBool:
		return DisplayTypeBoolean

	// Timestamp/Date/Time
	case oidTimestamp, oidTimestampTz:
		return DisplayTypeTimestamp
	case oidDate:
		return DisplayTypeTimestamp
	case oidTime, oidTimeTz:
		return DisplayTypeTimestamp

	// Interval
	case oidInterval:
		return DisplayTypeInterval

	// JSON
	case oidJSON, oidJSONB:
		return DisplayTypeJSON

	// Binary
	case oidBytea, oidBit, oidVarbit:
		return DisplayTypeBinary

	// UUID
	case oidUUID:
		return DisplayTypeUUID

	// Arrays
	case oidBoolArray, oidByteaArray, oidCharArray, oidNameArray:
		return DisplayTypeArray
	case oidInt2Array, oidInt4Array, oidInt8Array:
		return DisplayTypeArray
	case oidFloat4Array, oidFloat8Array:
		return DisplayTypeArray
	case oidTextArray, oidVarcharArray:
		return DisplayTypeArray
	case oidDateArray, oidTimeArray, oidTimestampArray, oidTimestampTzArray:
		return DisplayTypeArray
	case oidIntervalArray:
		return DisplayTypeArray
	case oidNumericArray:
		return DisplayTypeArray
	case oidUUIDArray:
		return DisplayTypeArray
	case oidJSONBArray:
		return DisplayTypeArray

	default:
		return DisplayTypeUnknown
	}
}

// oidToTypeName returns a human-readable type name for a PostgreSQL OID.
func oidToTypeName(oid uint32) string {
	switch oid {
	case oidBool:
		return "bool"
	case oidBytea:
		return "bytea"
	case oidChar:
		return "char"
	case oidName:
		return "name"
	case oidInt8:
		return "int8"
	case oidInt2:
		return "int2"
	case oidInt4:
		return "int4"
	case oidText:
		return "text"
	case oidOID:
		return "oid"
	case oidJSON:
		return "json"
	case oidXML:
		return "xml"
	case oidFloat4:
		return "float4"
	case oidFloat8:
		return "float8"
	case oidMoney:
		return "money"
	case oidVarchar:
		return "varchar"
	case oidDate:
		return "date"
	case oidTime:
		return "time"
	case oidTimestamp:
		return "timestamp"
	case oidTimestampTz:
		return "timestamptz"
	case oidInterval:
		return "interval"
	case oidTimeTz:
		return "timetz"
	case oidBit:
		return "bit"
	case oidVarbit:
		return "varbit"
	case oidNumeric:
		return "numeric"
	case oidUUID:
		return "uuid"
	case oidJSONB:
		return "jsonb"
	case oidBoolArray:
		return "bool[]"
	case oidByteaArray:
		return "bytea[]"
	case oidCharArray:
		return "char[]"
	case oidNameArray:
		return "name[]"
	case oidInt2Array:
		return "int2[]"
	case oidInt4Array:
		return "int4[]"
	case oidTextArray:
		return "text[]"
	case oidVarcharArray:
		return "varchar[]"
	case oidInt8Array:
		return "int8[]"
	case oidFloat4Array:
		return "float4[]"
	case oidFloat8Array:
		return "float8[]"
	case oidDateArray:
		return "date[]"
	case oidTimeArray:
		return "time[]"
	case oidTimestampArray:
		return "timestamp[]"
	case oidTimestampTzArray:
		return "timestamptz[]"
	case oidIntervalArray:
		return "interval[]"
	case oidNumericArray:
		return "numeric[]"
	case oidUUIDArray:
		return "uuid[]"
	case oidJSONBArray:
		return "jsonb[]"
	default:
		return "unknown"
	}
}
