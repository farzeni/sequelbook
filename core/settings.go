package core

type AppTheme string

const (
	ThemeLight  AppTheme = "light"
	ThemeDark   AppTheme = "dark"
	ThemeSystem AppTheme = "system"

	DeleteFilesToRecycleBin = "recycle_bin"
	DeleteFilesPermanently  = "permanently"
)

type Settings struct {
	Version  string  `json:"version"`
	Language *string `json:"language"`

	FocusNewTabs        bool   `json:"focus_new_tabs"`
	ConfirmFileDeletion bool   `json:"confirm_file_deletion"`
	DeletedFiles        string `json:"deleted_files"`

	Theme       AppTheme `json:"theme"`
	AccentColor string   `json:"accent_color"`
	ZoomLevel   int      `json:"zoom_level"`
}

var defaultSettings = Settings{
	Version:  "0.1.0",
	Language: nil,

	FocusNewTabs:        true,
	ConfirmFileDeletion: true,
	DeletedFiles:        DeleteFilesToRecycleBin,

	Theme:       ThemeSystem,
	AccentColor: "#0078d4",
	ZoomLevel:   0,
}

func NewSettings() *Settings {
	return &Settings{
		Version:  defaultSettings.Version,
		Language: defaultSettings.Language,

		FocusNewTabs:        defaultSettings.FocusNewTabs,
		ConfirmFileDeletion: defaultSettings.ConfirmFileDeletion,
		DeletedFiles:        defaultSettings.DeletedFiles,

		Theme:       defaultSettings.Theme,
		AccentColor: defaultSettings.AccentColor,
		ZoomLevel:   defaultSettings.ZoomLevel,
	}
}
