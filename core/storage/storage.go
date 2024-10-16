package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sequelbook/core/tools"

	"github.com/adrg/xdg"
)

const (
	editorStateFilename = "editor.json"
	settingsFilename    = "settings.json"
)

type Storage struct {
	ConfigPath      string
	BookStoragePath string
	ConnectionsPath string
}

func NewStorage() *Storage {
	configDir := xdg.ConfigHome + "/sequelbook"
	booksDir := xdg.UserDirs.Documents + "/Sequelbooks/"

	s := &Storage{
		ConfigPath:      configDir,
		BookStoragePath: booksDir + "/books",
		ConnectionsPath: configDir + "/connections",
	}

	s.ensureStoragePaths()

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

	filename := entity.GetFilename() + ".sbdb"

	file, err := os.Create(filepath.Join(path, filename))

	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	content, err := entity.Marshal()

	if err != nil {
		return fmt.Errorf("failed to marshal data: %v", err)
	}

	_, err = file.Write(content)

	if err != nil {
		return fmt.Errorf("failed to write data: %v", err)
	}

	return nil
}

func (s *Storage) LoadEntity(entityType tools.EntityTypes, id string, v interface{}) error {
	dstpath, err := s.GetEntityPath(entityType, id)

	if err != nil {
		return err
	}

	content, err := os.ReadFile(dstpath)

	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	err = json.Unmarshal(content, v)

	if err != nil {
		return fmt.Errorf("failed to unmarshal data: %v", err)
	}

	return nil
}
func (s *Storage) RenameEntity(entity tools.Entity, new string) error {

	filename := entity.GetFilename() + ".sbdb"

	path := filepath.Join(s.BookStoragePath, filename)

	newFilename := new + ".sbdb"

	newPath := filepath.Join(s.BookStoragePath, newFilename)

	err := os.Rename(path, newPath)

	if err != nil {
		return fmt.Errorf("failed to rename file: %v", err)
	}

	return nil
}

func (s *Storage) DeleteEntity(entityType tools.EntityTypes, id string) error {
	dstpath, err := s.GetEntityPath(entityType, id)
	fmt.Println("Deleting file: ", dstpath)

	if err != nil {
		return err
	}
	fmt.Println("Deleting file1: ", dstpath)
	if err := os.Remove(dstpath); err != nil {
		fmt.Println("Deleting file1: ", err)
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

		fmt.Println("=======================Loading file: ", path)
		fmt.Println("=======================Loading file: ")
		fmt.Println("=======================Loading file: ")
		fmt.Println("=======================Loading file: ")
		fmt.Println("=======================Loading file: ")
		fmt.Println("=======================Loading file: ")
		fmt.Println("=======================Loading file: ")
		if err != nil {
			return nil, fmt.Errorf("failed to open file: %v", err)
		}
		data, err := os.ReadFile(path)

		fmt.Println("Data: ", data)

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

	filename := id + ".sbdb"

	return filepath.Join(path, filename), nil
}

func (s *Storage) SaveEditorState(jsonState string) error {
	path := filepath.Join(s.ConfigPath, editorStateFilename)

	// check if file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		_, err := os.Create(path)
		if err != nil {
			return err
		}
	}

	err := os.WriteFile(path, []byte(jsonState), 0644)

	if err != nil {
		return err
	}

	return nil
}

func (s *Storage) LoadEditorState() (string, error) {
	path := filepath.Join(s.ConfigPath, editorStateFilename)

	data, err := os.ReadFile(path)

	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (s *Storage) SaveSettings(jsonSettings string) error {
	path := filepath.Join(s.ConfigPath, settingsFilename)

	// check if file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		_, err := os.Create(path)
		if err != nil {
			return err
		}
	}

	err := os.WriteFile(path, []byte(jsonSettings), 0644)

	if err != nil {
		return err
	}

	return nil
}

func (s *Storage) LoadSettings() (string, error) {
	path := filepath.Join(s.ConfigPath, settingsFilename)

	fmt.Println("Loading settings from: ", path)

	if _, err := os.Stat(path); !os.IsNotExist(err) {

		data, err := os.ReadFile(path)

		if err != nil {
			fmt.Println("Failed to read file: %v", err)
			return "", err
		}

		fmt.Println("Settings loaded: ", string(data))
		return string(data), nil
	}

	return "", nil
}

func (s *Storage) ensureStoragePaths() error {

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
