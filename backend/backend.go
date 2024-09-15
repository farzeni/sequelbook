package backend

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Backend struct
type Backend struct {
	ctx         context.Context
	Connections *ConnectionStore
	Books       *BooksStore
}

// NewBackend creates a new App application struct
func NewBackend() *Backend {
	backend := &Backend{
		Connections: NewConnectionStore(),
		Books:       NewBooksService(),
	}

	backend.Connections.Add(ConnectionCreateData{
		Name: "Local Postgres",
		Type: ConnectionTypePostgres,
		Host: "localhost",
		Port: 5432,
		User: "postgres",
		Pass: "postgres",
		DB:   "wevolunteer",
	})

	backend.NewMenu(context.Background())

	return backend
}

func (b *Backend) NewMenu(ctx context.Context) *menu.Menu {
	AppMenu := menu.NewMenu()
	FileMenu := AppMenu.AddSubmenu("Application")
	FileMenu.AddText("Preferences", nil, func(_ *menu.CallbackData) {})
	FileMenu.AddSeparator()
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.Quit(b.ctx)
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
