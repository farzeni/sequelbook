package main

import (
	"context"
	"embed"
	"sequelbook/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	backend := backend.NewBackend(context.Background())
	menu := backend.NewMenu(context.Background())

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "SequelBook",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Menu:             menu,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        backend.Startup,
		Bind: []interface{}{
			backend,
			backend.Connections,
			backend.Books,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
