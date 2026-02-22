package executor

import (
	"database/sql"
	"strings"
)

// mysqlTypeToDisplayType maps MySQL type names to DisplayType.
func mysqlTypeToDisplayType(typeName string) DisplayType {
	t := strings.ToLower(strings.TrimSpace(typeName))
	switch {
	case strings.HasPrefix(t, "int"), strings.HasPrefix(t, "bigint"), strings.HasPrefix(t, "smallint"),
		strings.HasPrefix(t, "mediumint"), strings.HasPrefix(t, "tinyint"),
		strings.HasPrefix(t, "float"), strings.HasPrefix(t, "double"), strings.HasPrefix(t, "decimal"):
		return DisplayTypeNumber
	case t == "bit":
		return DisplayTypeBinary
	case t == "tinyint(1)": // MySQL uses TINYINT(1) for boolean
		return DisplayTypeBoolean
	case strings.Contains(t, "char"), strings.Contains(t, "text"), t == "enum", t == "set":
		return DisplayTypeText
	case strings.Contains(t, "date"), strings.Contains(t, "time"):
		return DisplayTypeTimestamp
	case t == "json":
		return DisplayTypeJSON
	case t == "blob", strings.HasPrefix(t, "binary"), strings.HasPrefix(t, "varbinary"):
		return DisplayTypeBinary
	default:
		return DisplayTypeUnknown
	}
}

// sqliteTypeToDisplayType maps SQLite type affinity to DisplayType.
func sqliteTypeToDisplayType(typeName string) DisplayType {
	t := strings.ToLower(strings.TrimSpace(typeName))
	switch {
	case strings.Contains(t, "int"):
		return DisplayTypeNumber
	case strings.Contains(t, "real"), strings.Contains(t, "float"), strings.Contains(t, "double"):
		return DisplayTypeNumber
	case strings.Contains(t, "char"), strings.Contains(t, "clob"), strings.Contains(t, "text"):
		return DisplayTypeText
	case strings.Contains(t, "blob"):
		return DisplayTypeBinary
	case t == "boolean" || t == "bool":
		return DisplayTypeBoolean
	case strings.Contains(t, "date"), strings.Contains(t, "time"):
		return DisplayTypeTimestamp
	case t == "json" || t == "jsonb":
		return DisplayTypeJSON
	default:
		return DisplayTypeUnknown
	}
}

// columnsFromSQLRows builds Column metadata from database/sql rows.
func columnsFromSQLRows(rows *sql.Rows, typeMapper func(string) DisplayType) ([]Column, error) {
	colTypes, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}

	columns := make([]Column, len(colTypes))
	for i, ct := range colTypes {
		typeName := ct.DatabaseTypeName()
		displayType := typeMapper(typeName)
		nullable := true
		if ok, known := ct.Nullable(); known {
			nullable = ok
		}

		columns[i] = Column{
			Name:         ct.Name(),
			DatabaseType: typeName,
			OID:          0,
			DisplayType:  displayType,
			Nullable:     nullable,
			TableOID:     0,
			TableColumn:  0,
		}
	}
	return columns, nil
}
