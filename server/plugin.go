package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

var manifest = model.Manifest{
	Id:      "com.mattermost.ladder-game",
	Name:    "Ladder Game",
	Version: "0.1.0",
}

// Plugin implements the Mattermost plugin interface.
type Plugin struct {
	plugin.MattermostPlugin

	store     *Store
	router    *mux.Router
	botUserID string
}

// OnActivate is invoked when the plugin is activated.
func (p *Plugin) OnActivate() error {
	p.store = NewStore(p.API)
	p.router = p.initRouter()

	// Ensure bot user exists
	bot := &model.Bot{
		Username:    "ladder-bot",
		DisplayName: "사다리 봇",
		Description: "Mattermost 사다리 게임 결과를 발표하는 봇입니다.",
	}
	botUserID, appErr := p.API.EnsureBotUser(bot)
	if appErr != nil {
		p.API.LogWarn(fmt.Sprintf("Failed to ensure bot user: %v", appErr))
	} else {
		p.botUserID = botUserID
	}

	// Register slash commands
	if err := p.registerCommands(); err != nil {
		return fmt.Errorf("failed to register commands: %w", err)
	}

	p.API.LogInfo("Ladder Game plugin activated successfully.")
	return nil
}

// OnDeactivate is invoked when the plugin is deactivated.
func (p *Plugin) OnDeactivate() error {
	p.API.LogInfo("Ladder Game plugin deactivated.")
	return nil
}

// ServeHTTP handles incoming HTTP requests
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.router.ServeHTTP(w, r)
}
