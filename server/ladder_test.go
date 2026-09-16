package main

import (
	"testing"
)

func TestGenerateLadder(t *testing.T) {
	participants := []string{"철수", "영희", "민수", "지훈"}
	results := []string{"당첨", "커피", "꽝", "점심"}

	game, err := GenerateLadder("game-1", "channel-1", "user-1", "admin", "점심 쏘기", participants, results, "normal")
	if err != nil {
		t.Fatalf("GenerateLadder failed: %v", err)
	}

	if game.ID != "game-1" {
		t.Errorf("expected game ID game-1, got %s", game.ID)
	}

	if len(game.Matches) != 4 {
		t.Fatalf("expected 4 matches, got %d", len(game.Matches))
	}

	// Verify that each result is mapped to exactly one participant (bijective)
	seenResults := make(map[int]bool)
	for _, match := range game.Matches {
		if seenResults[match.ResultIndex] {
			t.Errorf("duplicate result index: %d", match.ResultIndex)
		}
		seenResults[match.ResultIndex] = true

		if match.ResultLabel != results[match.ResultIndex] {
			t.Errorf("result label mismatch: expected %s, got %s", results[match.ResultIndex], match.ResultLabel)
		}

		if len(match.Path) < 2 {
			t.Errorf("path should have at least 2 points (start and end)")
		}
	}

	// Verify no horizontal lines share adjacent columns at the same level
	lineGrid := make(map[int]map[int]bool)
	for _, line := range game.Lines {
		if lineGrid[line.Level] == nil {
			lineGrid[line.Level] = make(map[int]bool)
		}
		if lineGrid[line.Level][line.Column] {
			t.Errorf("duplicate line at level %d, col %d", line.Level, line.Column)
		}
		if line.Column > 0 && lineGrid[line.Level][line.Column-1] {
			t.Errorf("adjacent overlapping line at level %d, col %d and %d", line.Level, line.Column-1, line.Column)
		}
		if lineGrid[line.Level][line.Column+1] {
			t.Errorf("adjacent overlapping line at level %d, col %d and %d", line.Level, line.Column, line.Column+1)
		}
		lineGrid[line.Level][line.Column] = true
	}
}

func TestGenerateLadderValidation(t *testing.T) {
	_, err := GenerateLadder("game-1", "ch", "u", "admin", "test", []string{"A"}, []string{"1"}, "normal")
	if err == nil {
		t.Errorf("expected error for less than 2 participants")
	}

	_, err = GenerateLadder("game-1", "ch", "u", "admin", "test", []string{"A", "B"}, []string{"1"}, "normal")
	if err == nil {
		t.Errorf("expected error for mismatch between participants and results count")
	}
}
