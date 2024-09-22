package core

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"sequelbook/core/books"
	"sequelbook/core/connections"
	"sequelbook/core/storage"

	wrt "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Backend struct
type Backend struct {
	ctx         context.Context
	Connections *connections.ConnectionStore
	Books       *books.BooksStore
	Storage     *storage.Storage
}

// NewBackend creates a new App application struct
func NewBackend(c context.Context) *Backend {
	configDir, err := userConfigDir()

	if err != nil {
		fmt.Println("Error getting user config directory: ", err)
		wrt.Quit(c)
	}

	storage := storage.NewStorage(configDir + "/sequelbook")

	backend := &Backend{
		Connections: connections.NewConnectionStore(storage),
		Books:       books.NewBooksStore(storage),
		Storage:     storage,
	}

	if err := backend.Connections.LoadConnections(); err != nil {
		fmt.Println("Error loading connections: ", err)
		wrt.Quit(c)
	}

	if err := backend.Books.LoadBooks(); err != nil {
		fmt.Println("Error loading books: ", err)
		wrt.Quit(c)
	}

	return backend
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (b *Backend) Startup(ctx context.Context) {
	b.ctx = ctx
}

func userConfigDir() (string, error) {
	var configDir string
	var err error

	// Controlla il sistema operativo
	switch runtime.GOOS {
	case "windows":
		configDir = os.Getenv("AppData")
		if configDir == "" {
			err = fmt.Errorf("unable to find AppData directory")
		}
	case "darwin":
		configDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
	case "linux":
		configDir = os.Getenv("XDG_CONFIG_HOME")
		if configDir == "" {
			configDir = filepath.Join(os.Getenv("HOME"), ".config")
		}
	default:
		err = fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}

	if err != nil {
		return "", err
	}

	return configDir, nil
}
