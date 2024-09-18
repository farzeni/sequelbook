package backend

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"sequelbook/backend/books"
	"sequelbook/backend/connections"
	"sequelbook/backend/storage"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
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

	backend.NewMenu(c)

	return backend
}

func (b *Backend) NewMenu(ctx context.Context) *menu.Menu {
	AppMenu := menu.NewMenu()
	FileMenu := AppMenu.AddSubmenu("Application")
	FileMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {})
	FileMenu.AddSeparator()
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		wrt.Quit(b.ctx)
	})

	EditMenu := AppMenu.AddSubmenu("Edit")
	EditMenu.AddText("Undo", keys.CmdOrCtrl("z"), func(_ *menu.CallbackData) {})
	EditMenu.AddText("Redo", keys.CmdOrCtrl("y"), func(_ *menu.CallbackData) {})
	EditMenu.AddSeparator()
	EditMenu.AddText("Cut", keys.CmdOrCtrl("x"), func(_ *menu.CallbackData) {})
	EditMenu.AddText("Copy", keys.CmdOrCtrl("c"), func(_ *menu.CallbackData) {})
	EditMenu.AddText("Paste", keys.CmdOrCtrl("v"), func(_ *menu.CallbackData) {})
	EditMenu.AddSeparator()
	EditMenu.AddText("Find", keys.CmdOrCtrl("f"), func(_ *menu.CallbackData) {})

	ViewMenu := AppMenu.AddSubmenu("View")
	ViewMenu.AddText("Toggle Fullscreen", keys.CmdOrCtrl("f"), func(_ *menu.CallbackData) {})
	ViewMenu.AddSeparator()
	ViewMenu.AddText("Actual Size", keys.CmdOrCtrl("0"), func(_ *menu.CallbackData) {})
	ViewMenu.AddText("Zoom In", keys.CmdOrCtrl("+"), func(_ *menu.CallbackData) {})
	ViewMenu.AddText("Zoom Out", keys.CmdOrCtrl("-"), func(_ *menu.CallbackData) {})
	ViewMenu.AddSeparator()
	ViewMenu.AddText("Toggle Sidebar", keys.CmdOrCtrl("b"), func(_ *menu.CallbackData) {})
	ViewMenu.AddText("Toggle Toolbar", keys.CmdOrCtrl("t"), func(_ *menu.CallbackData) {})

	HelpMenu := AppMenu.AddSubmenu("Help")
	HelpMenu.AddText("About", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddText("Documentation", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddText("Support", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddSeparator()
	HelpMenu.AddText("Report Issue", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddText("Check for Updates", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddSeparator()
	HelpMenu.AddText("Privacy Policy", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddText("Terms of Service", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddSeparator()
	HelpMenu.AddText("Release Notes", nil, func(_ *menu.CallbackData) {})
	HelpMenu.AddText("License", nil, func(_ *menu.CallbackData) {})

	return AppMenu
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
