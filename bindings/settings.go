package bindings

import "github.com/sequelbook/sequelbook/core/settings"

// SettingsService exposes app configuration to the Wails frontend.
type SettingsService struct {
	settings *settings.Store
}

// NewSettingsService creates a SettingsService with injected dependencies.
func NewSettingsService(s *settings.Store) *SettingsService {
	return &SettingsService{settings: s}
}

// GetConfig returns the current app configuration.
func (s *SettingsService) GetConfig() settings.Config {
	return s.settings.GetConfig()
}

// UpdateConfig replaces the app configuration and persists it to disk.
func (s *SettingsService) UpdateConfig(cfg settings.Config) error {
	return s.settings.UpdateConfig(cfg)
}

// GetBooksDir returns the resolved books directory path.
func (s *SettingsService) GetBooksDir() string {
	return s.settings.GetBooksDir()
}

// SaveEditorState persists the editor layout (tabs, panes, sidebar, selection) to disk.
func (s *SettingsService) SaveEditorState(state string) error {
	return s.settings.SaveEditorState(state)
}

// LoadEditorState reads the persisted editor state from disk.
// Returns empty string if the file does not exist (first run).
func (s *SettingsService) LoadEditorState() (string, error) {
	return s.settings.LoadEditorState()
}
