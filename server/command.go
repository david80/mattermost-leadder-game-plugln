package main

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

const (
	commandTriggerLadder = "ladder"
	commandTriggerKorean = "사다리"
)

func (p *Plugin) registerCommands() error {
	commands := []*model.Command{
		{
			Trigger:          commandTriggerLadder,
			AutoComplete:     true,
			AutoCompleteDesc: "사다리 타기 게임을 시작합니다. (인자 없이 실행 시 사다리 설정 창이 열립니다)",
			AutoCompleteHint: "[제목] : [참가자1,참가자2,...] : [결과1,결과2,...]",
			DisplayName:      "사다리 게임",
			Description:      "Mattermost 대화형 사다리 게임 플러그인",
		},
		{
			Trigger:          commandTriggerKorean,
			AutoComplete:     true,
			AutoCompleteDesc: "사다리 타기 게임을 시작합니다.",
			AutoCompleteHint: "[제목] : [참가자1,참가자2,...] : [결과1,결과2,...]",
			DisplayName:      "사다리 게임 (한글)",
			Description:      "Mattermost 대화형 사다리 게임 플러그인",
		},
	}

	for _, cmd := range commands {
		if err := p.API.RegisterCommand(cmd); err != nil {
			return fmt.Errorf("failed to register command /%s: %w", cmd.Trigger, err)
		}
	}

	return nil
}

// ExecuteCommand handles execution of /ladder and /사다리 commands
func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	cmdText := strings.TrimSpace(args.Command)
	parts := strings.Fields(cmdText)
	if len(parts) == 0 {
		return &model.CommandResponse{}, nil
	}

	rawArgs := strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(cmdText, "/"+parts[0]), " "))

	// Check if help requested or empty args
	if rawArgs == "" || rawArgs == "help" || rawArgs == "도움말" {
		// If empty, trigger the rich webapp modal!
		if rawArgs == "" {
			p.API.PublishWebSocketEvent("open_modal", map[string]interface{}{
				"channel_id": args.ChannelId,
			}, &model.WebsocketBroadcast{UserId: args.UserId})

			return &model.CommandResponse{
				ResponseType: model.CommandResponseTypeEphemeral,
				Text:         "🪜 **사다리 게임 창이 열렸습니다!**\n채널 상단 헤더의 사다리 아이콘을 클릭하셔도 언제든 게임을 시작할 수 있습니다.",
			}, nil
		}

		helpMsg := "### 🪜 사다리 게임 명령어 안내\n\n" +
			"- `/ladder` 또는 `/사다리`: 웹앱 사다리 게임 인터랙티브 창을 엽니다.\n" +
			"- 채널 상단 헤더의 **사다리(🪜) 아이콘**을 클릭해도 즉시 창이 열립니다.\n\n" +
			"**간편 즉시 실행 모드:**\n" +
			"`/ladder [게임제목] : [참가자1, 참가자2, ...] : [결과1, 결과2, ...]`\n" +
			"*예시:*\n" +
			"> `/ladder 점심내기 : 김철수, 이영희, 박민수 : 당첨, 꽝, 커피쏘기`\n"

		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         helpMsg,
		}, nil
	}

	// Try parsing short-cut syntax: Title : p1, p2, p3 : r1, r2, r3
	sections := strings.Split(rawArgs, ":")
	if len(sections) == 3 {
		title := strings.TrimSpace(sections[0])
		rawParticipants := strings.Split(sections[1], ",")
		rawResults := strings.Split(sections[2], ",")

		var participants []string
		for _, part := range rawParticipants {
			t := strings.TrimSpace(part)
			if t != "" {
				participants = append(participants, t)
			}
		}

		var results []string
		for _, res := range rawResults {
			t := strings.TrimSpace(res)
			if t != "" {
				results = append(results, t)
			}
		}

		if len(participants) < 2 {
			return &model.CommandResponse{
				ResponseType: model.CommandResponseTypeEphemeral,
				Text:         "⚠️ 참가자는 최소 2명 이상이어야 합니다.",
			}, nil
		}
		if len(participants) != len(results) {
			return &model.CommandResponse{
				ResponseType: model.CommandResponseTypeEphemeral,
				Text:         fmt.Sprintf("⚠️ 참가자 수(%d명)와 결과 항목 수(%d개)가 일치해야 합니다.", len(participants), len(results)),
			}, nil
		}

		user, _ := p.API.GetUser(args.UserId)
		creatorName := "사용자"
		if user != nil {
			if user.Nickname != "" {
				creatorName = user.Nickname
			} else {
				creatorName = user.Username
			}
		}

		gameID := uuid.New().String()
		game, err := GenerateLadder(gameID, args.ChannelId, args.UserId, creatorName, title, participants, results, "normal")
		if err != nil {
			return &model.CommandResponse{
				ResponseType: model.CommandResponseTypeEphemeral,
				Text:         fmt.Sprintf("⚠️ 사다리 생성 실패: %v", err),
			}, nil
		}

		_ = p.store.SaveGame(game)

		// Post directly to channel
		var sb strings.Builder
		sb.WriteString(fmt.Sprintf("### 🪜 **%s** 사다리 결과 발표!\n\n", game.Title))
		sb.WriteString(fmt.Sprintf("주최자: **%s** | 총 참가자: **%d명**\n\n", game.CreatorName, len(game.Participants)))
		sb.WriteString("| 순번 | 참가자 | 최종 결과 |\n")
		sb.WriteString("| :---: | :--- | :--- |\n")
		for i, match := range game.Matches {
			sb.WriteString(fmt.Sprintf("| %d | **%s** | 🎯 **%s** |\n", i+1, match.ParticipantName, match.ResultLabel))
		}

		postUserID := p.botUserID
		if postUserID == "" {
			postUserID = args.UserId
		}

		_, appErr := p.API.CreatePost(&model.Post{
			UserId:    postUserID,
			ChannelId: args.ChannelId,
			Message:   sb.String(),
			Props: model.StringInterface{
				"ladder_game_id": game.ID,
			},
		})
		if appErr != nil {
			return &model.CommandResponse{
				ResponseType: model.CommandResponseTypeEphemeral,
				Text:         fmt.Sprintf("⚠️ 채널 포스트 생성 실패: %v", appErr),
			}, nil
		}

		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         "✅ 사다리 게임 결과가 채널에 정상적으로 게시되었습니다.",
		}, nil
	}

	return &model.CommandResponse{
		ResponseType: model.CommandResponseTypeEphemeral,
		Text:         "⚠️ 올바른 형식이 아닙니다. `/ladder`를 단독 입력하여 사다리 창을 열거나, `/ladder 도움말`을 확인하세요.",
	}, nil
}
