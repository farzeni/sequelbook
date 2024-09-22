package tools

import (
	"github.com/rs/xid"
)

type Entity interface {
	GetEntityPrefix() string
}

type EntityTypes string

const (
	EntityTypesBook       EntityTypes = "book"
	EntityTypesChapter    EntityTypes = "chapter"
	EntityTypesCell       EntityTypes = "block"
	EntityTypesConnection EntityTypes = "connection"
)

func GenerateID(entityType EntityTypes) string {
	guid := xid.New()

	prefix := GetEntityPrefix(entityType)

	return prefix + "_" + guid.String()
}

func GetEntityPrefix(entityType EntityTypes) string {
	switch entityType {
	case EntityTypesBook:
		return "bok"
	case EntityTypesChapter:
		return "cha"
	case EntityTypesCell:
		return "blo"
	case EntityTypesConnection:
		return "con"
	}

	return ""
}
