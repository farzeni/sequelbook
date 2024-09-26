package core

type AppTheme string

const (
	LightTheme  AppTheme = "light"
	DarkTheme   AppTheme = "dark"
	SystemTheme AppTheme = "system"
)

type Settings struct {
	Theme AppTheme `json:"theme"`
}
