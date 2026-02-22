package main

import (
	"embed"
	"log"

	"github.com/sequelbook/sequelbook/bindings"
	"github.com/sequelbook/sequelbook/core/book"
	"github.com/sequelbook/sequelbook/core/connection"
	"github.com/sequelbook/sequelbook/core/executor"
	"github.com/sequelbook/sequelbook/core/result"
	"github.com/sequelbook/sequelbook/core/settings"
	"github.com/sequelbook/sequelbook/events"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// ── Persistent storage ─────────────────────────────────────────────────────
	settingsStore, err := settings.NewStore("")
	if err != nil {
		log.Fatalf("settings: %v", err)
	}
	if err := settingsStore.Load(); err != nil {
		log.Printf("settings: load failed (using defaults): %v", err)
	}

	bookStore := book.NewStore()

	// ── Wails application ──────────────────────────────────────────────────────
	// Services are registered after app creation so that app.Event is available
	// to build the emitter before Run() is called.
	app := application.New(application.Options{
		Name:        "sequelbook",
		Description: "SQL notebook for PostgreSQL, MySQL, and SQLite",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// ── Event infrastructure ───────────────────────────────────────────────────
	emitter := events.NewWailsEmitter(app.Event)
	adapter := bindings.NewConnectionStateAdapter(emitter)

	// ── Core services ──────────────────────────────────────────────────────────
	connManager := connection.NewManager(connection.NewMultiConnector(), adapter)
	exec := executor.NewMultiExecutor(connManager)
	resultHandler := result.NewHandler(0) // uses DefaultMaxResults

	// ── Binding services ───────────────────────────────────────────────────────
	bookSvc := bindings.NewBookService(bookStore, settingsStore, app)
	connSvc := bindings.NewConnectionService(connManager, settingsStore)
	querySvc := bindings.NewQueryService(exec, resultHandler, emitter)
	schemaSvc := bindings.NewSchemaService(connManager)
	settingsSvc := bindings.NewSettingsService(settingsStore)

	// Auto-load saved books from the books directory,
	// then immediately persist IDs for any books that didn't have one yet
	// so that --sb:id is stable in files before the frontend connects.
	if err := bookSvc.LoadBooksDir(); err != nil {
		log.Printf("books: auto-load failed: %v", err)
	}
	if err := bookSvc.SaveAllDirty(); err != nil {
		log.Printf("books: id-stamp failed: %v", err)
	}

	app.RegisterService(application.NewService(bookSvc))
	app.RegisterService(application.NewService(connSvc))
	app.RegisterService(application.NewService(querySvc))
	app.RegisterService(application.NewService(schemaSvc))
	app.RegisterService(application.NewService(settingsSvc))

	// ── Main window ────────────────────────────────────────────────────────────
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "sequelbook",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Width:            1440,
		Height:           900,
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
