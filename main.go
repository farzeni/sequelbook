package main

import (
	"context"
	"embed"
	"sequelbook/core"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	core := core.NewBackend(context.Background())

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "SequelBook",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: core.Startup,
		Bind: []interface{}{
			core,
			core.Connections,
			core.Books,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
