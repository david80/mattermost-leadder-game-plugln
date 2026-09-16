package main

import (
	"encoding/json"
	"fmt"

	"github.com/mattermost/mattermost/server/public/plugin"
)

const (
	keyPrefixGame        = "game_"
	keyPrefixChannelGame = "channel_games_"
	maxChannelHistory    = 20
)

// Store handles persistence of ladder game data into Mattermost KVStore
type Store struct {
	api plugin.API
}

// NewStore initializes a new Store instance
func NewStore(api plugin.API) *Store {
	return &Store{api: api}
}

// SaveGame stores a ladder game by its ID and updates the channel game index
func (s *Store) SaveGame(game *LadderGame) error {
	data, err := json.Marshal(game)
	if err != nil {
		return fmt.Errorf("failed to marshal game data: %w", err)
	}

	key := keyPrefixGame + game.ID
	if appErr := s.api.KVSet(key, data); appErr != nil {
		return fmt.Errorf("failed to save game to KVStore: %v", appErr)
	}

	// Update channel recent games list
	if game.ChannelID != "" {
		_ = s.addGameToChannelHistory(game.ChannelID, game.ID)
	}

	return nil
}

// GetGame retrieves a ladder game by its ID
func (s *Store) GetGame(gameID string) (*LadderGame, error) {
	key := keyPrefixGame + gameID
	data, appErr := s.api.KVGet(key)
	if appErr != nil {
		return nil, fmt.Errorf("failed to get game from KVStore: %v", appErr)
	}
	if data == nil {
		return nil, fmt.Errorf("game not found")
	}

	var game LadderGame
	if err := json.Unmarshal(data, &game); err != nil {
		return nil, fmt.Errorf("failed to unmarshal game data: %w", err)
	}

	return &game, nil
}

// addGameToChannelHistory keeps track of recent game IDs in a channel
func (s *Store) addGameToChannelHistory(channelID, gameID string) error {
	key := keyPrefixChannelGame + channelID
	data, _ := s.api.KVGet(key)

	var ids []string
	if data != nil {
		_ = json.Unmarshal(data, &ids)
	}

	// Prepend new game ID and truncate
	ids = append([]string{gameID}, ids...)
	if len(ids) > maxChannelHistory {
		ids = ids[:maxChannelHistory]
	}

	updated, err := json.Marshal(ids)
	if err != nil {
		return err
	}

	return s.api.KVSet(key, updated)
}
