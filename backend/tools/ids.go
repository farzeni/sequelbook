package tools

import (
	"github.com/oklog/ulid/v2"
)

type Entity interface {
	GetEntityPrefix() string
}

type EntityTypes string

const (
	EntityTypesBook       EntityTypes = "book"
	EntityTypesChapter    EntityTypes = "chapter"
	EntityTypesBlock      EntityTypes = "block"
	EntityTypesConnection EntityTypes = "connection"
)

func GenerateID(entityType EntityTypes) (string, error) {
	var ulid = ulid.MustNew(ulid.Now(), nil)

	prefix := GetEntityPrefix(entityType)

	return prefix + "_" + ulid.String(), nil
}

func GetEntityPrefix(entityType EntityTypes) string {
	switch entityType {
	case EntityTypesBook:
		return "bok"
	case EntityTypesChapter:
		return "cha"
	case EntityTypesBlock:
		return "blo"
	case EntityTypesConnection:
		return "con"
	}

	return ""
}
