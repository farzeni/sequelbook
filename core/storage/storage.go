package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sequelbook/core/tools"
)

type Storage struct {
	ConfigPath      string
	BookStoragePath string
	ConnectionsPath string
}

func NewStorage(path string) *Storage {
	s := &Storage{
		ConfigPath:      path,
		BookStoragePath: path + "/books",
		ConnectionsPath: path + "/connections",
	}

	s.ensureStoragePath()

	return s
}

func (s *Storage) SaveEntity(entity tools.Entity, id string) error {

	var path string

	var prefix = entity.GetEntityPrefix()

	switch prefix {
	case "bok":
		path = s.BookStoragePath
	case "con":
		path = s.ConnectionsPath
	default:
		return fmt.Errorf("unsupported entity type: %s", prefix)
	}

	filename := id + ".sbdb"

	file, err := os.Create(filepath.Join(path, filename))

	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")

	if err := encoder.Encode(entity); err != nil {
		return fmt.Errorf("failed to encode data: %v", err)
	}

	return nil
}

func (s *Storage) LoadEntity(entityType tools.EntityTypes, id string, v interface{}) error {
	dstpath, err := s.GetEntityPath(entityType, id)

	if err != nil {
		return err
	}

	file, err := os.Open(dstpath)

	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)

	if err := decoder.Decode(&v); err != nil {
		return fmt.Errorf("failed to decode data: %v", err)
	}

	return nil
}

func (s *Storage) DeleteEntity(entityType tools.EntityTypes, id string) error {
	dstpath, err := s.GetEntityPath(entityType, id)

	if err != nil {
		return err
	}

	if err := os.Remove(dstpath); err != nil {
		return fmt.Errorf("failed to remove file: %v", err)
	}

	return nil
}

func (s *Storage) LoadEntities(entityType tools.EntityTypes) ([][]byte, error) {
	var path string

	switch entityType {
	case tools.EntityTypesBook:
		path = s.BookStoragePath
	case tools.EntityTypesConnection:
		path = s.ConnectionsPath
	default:
		return nil, fmt.Errorf("unsupported entity type: %s", entityType)
	}

	files, err := os.ReadDir(path)

	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %v", err)
	}

	var entities [][]byte

	for _, dirfile := range files {
		if dirfile.IsDir() {
			continue
		}

		if filepath.Ext(dirfile.Name()) != ".sbdb" {
			continue
		}

		path := filepath.Join(path, dirfile.Name())

		if err != nil {
			return nil, fmt.Errorf("failed to open file: %v", err)
		}
		data, err := os.ReadFile(path)

		if err != nil {
			return nil, fmt.Errorf("failed to read file: %v", err)
		}

		entities = append(entities, data)

	}

	return entities, nil
}

func (s *Storage) GetEntityPath(entityType tools.EntityTypes, id string) (string, error) {
	var path string

	switch entityType {
	case tools.EntityTypesBook:
		path = s.BookStoragePath
	case tools.EntityTypesConnection:
		path = s.ConnectionsPath
	default:
		return "", fmt.Errorf("unsupported entity type: %s", entityType)
	}

	prefix := tools.GetEntityPrefix(entityType)

	filename := prefix + "-" + id + ".sbdb"

	return filepath.Join(path, filename), nil
}

func (s *Storage) ensureStoragePath() error {

	if _, err := os.Stat(s.ConfigPath); os.IsNotExist(err) {
		err := os.MkdirAll(s.ConfigPath, 0755)
		if err != nil {
			return err
		}
	}

	if _, err := os.Stat(s.BookStoragePath); os.IsNotExist(err) {
		err := os.MkdirAll(s.BookStoragePath, 0755)
		if err != nil {
			return err
		}
	}

	if _, err := os.Stat(s.ConnectionsPath); os.IsNotExist(err) {
		err := os.MkdirAll(s.ConnectionsPath, 0755)
		if err != nil {
			return err
		}
	}

	return nil
}
