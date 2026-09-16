package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
)

type CreateGameRequest struct {
	ChannelID    string   `json:"channel_id"`
	Title        string   `json:"title"`
	Participants []string `json:"participants"`
	Results      []string `json:"results"`
	Density      string   `json:"density"` // low, normal, high
}

type PublishGameRequest struct {
	Comment string `json:"comment"`
}

func (p *Plugin) initRouter() *mux.Router {
	r := mux.NewRouter()
	api := r.PathPrefix("/api/v1").Subrouter()

	api.HandleFunc("/games", p.handleCreateGame).Methods(http.MethodPost)
	api.HandleFunc("/games/{id}", p.handleGetGame).Methods(http.MethodGet)
	api.HandleFunc("/games/{id}/post", p.handlePostGameToChannel).Methods(http.MethodPost)

	return r
}

func (p *Plugin) handleCreateGame(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-Id")
	if userID == "" {
		http.Error(w, "Unauthorized: Mattermost-User-Id header missing", http.StatusUnauthorized)
		return
	}

	user, appErr := p.API.GetUser(userID)
	creatorName := "사용자"
	if appErr == nil && user != nil {
		if user.Nickname != "" {
			creatorName = user.Nickname
		} else if user.FirstName != "" {
			creatorName = user.FirstName
		} else {
			creatorName = user.Username
		}
	}

	var req CreateGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Clean up participants & results
	var participants []string
	for _, p := range req.Participants {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			participants = append(participants, trimmed)
		}
	}

	var results []string
	for _, res := range req.Results {
		trimmed := strings.TrimSpace(res)
		if trimmed != "" {
			results = append(results, trimmed)
		}
	}

	if len(participants) < 2 {
		http.Error(w, "참가자는 최소 2명 이상이어야 합니다.", http.StatusBadRequest)
		return
	}
	if len(participants) != len(results) {
		http.Error(w, fmt.Sprintf("참가자 수(%d명)와 결과 항목 수(%d개)가 일치해야 합니다.", len(participants), len(results)), http.StatusBadRequest)
		return
	}

	gameID := uuid.New().String()
	game, err := GenerateLadder(gameID, req.ChannelID, userID, creatorName, req.Title, participants, results, req.Density)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to generate ladder: %v", err), http.StatusInternalServerError)
		return
	}

	if err := p.store.SaveGame(game); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save game: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(game)
}

func (p *Plugin) handleGetGame(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]
	if gameID == "" {
		http.Error(w, "Game ID is required", http.StatusBadRequest)
		return
	}

	game, err := p.store.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(game)
}

func (p *Plugin) handlePostGameToChannel(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-Id")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	gameID := vars["id"]
	game, err := p.store.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	var req PublishGameRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Format result markdown table
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("### 🪜 **%s** 결과 발표!\n\n", game.Title))
	sb.WriteString(fmt.Sprintf("생성자: **%s** | 총 참가자: **%d명**\n\n", game.CreatorName, len(game.Participants)))

	if req.Comment != "" {
		sb.WriteString(fmt.Sprintf("> %s\n\n", req.Comment))
	}

	sb.WriteString("| 순번 | 참가자 | 최종 결과 |\n")
	sb.WriteString("| :---: | :--- | :--- |\n")
	for i, match := range game.Matches {
		sb.WriteString(fmt.Sprintf("| %d | **%s** | 🎯 **%s** |\n", i+1, match.ParticipantName, match.ResultLabel))
	}

	postUserID := p.botUserID
	if postUserID == "" {
		postUserID = userID
	}

	post := &model.Post{
		UserId:    postUserID,
		ChannelId: game.ChannelID,
		Message:   sb.String(),
		Props: model.StringInterface{
			"ladder_game_id": game.ID,
		},
	}

	createdPost, appErr := p.API.CreatePost(post)
	if appErr != nil {
		http.Error(w, fmt.Sprintf("Failed to post result: %v", appErr), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"post_id": createdPost.Id,
	})
}
