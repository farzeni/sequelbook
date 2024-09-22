package core

import "github.com/adrg/xdg"

type Settings struct {
	path string
}

func LoadSettings() (*Settings, error) {
	settingsPath, err := xdg.ConfigFile(configFilename)

	if err != nil {
		return nil, err
	}

	s := &Settings{path: settingsPath}

	// load settings

	return s, nil
}

func (s *Settings) Save() error {
	// save settings

	return nil
}
