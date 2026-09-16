package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"
)

// LadderLine represents a horizontal line between column and column+1 at a specific level (height)
type LadderLine struct {
	Level  int `json:"level"`  // 0 to TotalLevels-1
	Column int `json:"column"` // 0 to ParticipantCount-2 (connects Column and Column+1)
}

// PathPoint represents a point along the traversal path of a participant
type PathPoint struct {
	Level  int `json:"level"`
	Column int `json:"column"`
}

// MatchResult represents the final matching between a participant and a result item
type MatchResult struct {
	ParticipantIndex int         `json:"participant_index"`
	ParticipantName  string      `json:"participant_name"`
	ResultIndex      int         `json:"result_index"`
	ResultLabel      string      `json:"result_label"`
	Path             []PathPoint `json:"path"`
}

// LadderGame contains the full state and structure of a ladder game
type LadderGame struct {
	ID           string        `json:"id"`
	ChannelID    string        `json:"channel_id"`
	CreatorID    string        `json:"creator_id"`
	CreatorName  string        `json:"creator_name"`
	Title        string        `json:"title"`
	Participants []string      `json:"participants"`
	Results      []string      `json:"results"`
	TotalLevels  int           `json:"total_levels"`
	Lines        []LadderLine  `json:"lines"`
	Matches      []MatchResult `json:"matches"`
	CreatedAt    int64         `json:"created_at"`
}

// GenerateLadder creates a fair, randomized ladder map and computes matching results
func GenerateLadder(id, channelID, creatorID, creatorName, title string, participants, results []string, density string) (*LadderGame, error) {
	n := len(participants)
	if n < 2 {
		return nil, fmt.Errorf("최소 2명 이상의 참가자가 필요합니다")
	}
	if len(results) != n {
		return nil, fmt.Errorf("참가자 수(%d명)와 결과 항목 수(%d개)가 일치해야 합니다", n, len(results))
	}

	// Determine number of vertical levels based on density and participant count
	levelsPerColumn := 4
	switch density {
	case "low":
		levelsPerColumn = 3
	case "high":
		levelsPerColumn = 6
	default:
		levelsPerColumn = 4
	}

	totalLevels := n * levelsPerColumn
	if totalLevels < 10 {
		totalLevels = 10
	}
	if totalLevels > 40 {
		totalLevels = 40
	}

	// Generate horizontal lines ensuring no adjacent overlaps on the same level
	// lineExists[level][col] == true means horizontal line connects col and col+1 at level
	lineExists := make([][]bool, totalLevels)
	for i := range lineExists {
		lineExists[i] = make([]bool, n-1)
	}

	var lines []LadderLine

	// Ensure each adjacent pair (col, col+1) has at least 1 or 2 lines
	for col := 0; col < n-1; col++ {
		// Try to place lines at randomized levels
		placed := 0
		target := levelsPerColumn / 2
		if target < 2 {
			target = 2
		}

		attempts := 0
		for placed < target && attempts < 100 {
			attempts++
			lvl, err := cryptoRandomInt(1, totalLevels-2)
			if err != nil {
				lvl = 1 + (attempts % (totalLevels - 2))
			}

			// Check if this position is valid
			if lineExists[lvl][col] {
				continue
			}
			// Left neighbor check
			if col > 0 && lineExists[lvl][col-1] {
				continue
			}
			// Right neighbor check
			if col < n-2 && lineExists[lvl][col+1] {
				continue
			}

			lineExists[lvl][col] = true
			lines = append(lines, LadderLine{
				Level:  lvl,
				Column: col,
			})
			placed++
		}
	}

	// Additional random bridges across the board for fairness and fun
	extraTarget := (n - 1) * 2
	for i := 0; i < extraTarget; i++ {
		lvl, _ := cryptoRandomInt(1, totalLevels-2)
		col, _ := cryptoRandomInt(0, n-2)

		if lineExists[lvl][col] {
			continue
		}
		if col > 0 && lineExists[lvl][col-1] {
			continue
		}
		if col < n-2 && lineExists[lvl][col+1] {
			continue
		}

		lineExists[lvl][col] = true
		lines = append(lines, LadderLine{
			Level:  lvl,
			Column: col,
		})
	}

	// Calculate paths and match results for all participants
	matches := make([]MatchResult, n)
	for pIdx := 0; pIdx < n; pIdx++ {
		currCol := pIdx
		var path []PathPoint

		// Starting point
		path = append(path, PathPoint{Level: 0, Column: currCol})

		for lvl := 0; lvl < totalLevels; lvl++ {
			// Check left bridge (currCol-1 to currCol)
			if currCol > 0 && lineExists[lvl][currCol-1] {
				path = append(path, PathPoint{Level: lvl, Column: currCol})
				currCol--
				path = append(path, PathPoint{Level: lvl, Column: currCol})
			} else if currCol < n-1 && lineExists[lvl][currCol] {
				// Check right bridge (currCol to currCol+1)
				path = append(path, PathPoint{Level: lvl, Column: currCol})
				currCol++
				path = append(path, PathPoint{Level: lvl, Column: currCol})
			}
		}

		// Destination at the bottom
		path = append(path, PathPoint{Level: totalLevels, Column: currCol})

		matches[pIdx] = MatchResult{
			ParticipantIndex: pIdx,
			ParticipantName:  participants[pIdx],
			ResultIndex:      currCol,
			ResultLabel:      results[currCol],
			Path:             path,
		}
	}

	if title == "" {
		title = "사다리 타기 게임"
	}

	return &LadderGame{
		ID:           id,
		ChannelID:    channelID,
		CreatorID:    creatorID,
		CreatorName:  creatorName,
		Title:        title,
		Participants: participants,
		Results:      results,
		TotalLevels:  totalLevels,
		Lines:        lines,
		Matches:      matches,
		CreatedAt:    time.Now().Unix(),
	}, nil
}

func cryptoRandomInt(min, max int) (int, error) {
	if min >= max {
		return min, nil
	}
	diff := int64(max - min + 1)
	n, err := rand.Int(rand.Reader, big.NewInt(diff))
	if err != nil {
		return min, err
	}
	return min + int(n.Int64()), nil
}
