package models

import (
    "time"
	"gorm.io/gorm"
    "gorm.io/datatypes"
	"github.com/lib/pq"
)

// Quiz represents our Database Schema and JSON Model
type Quiz struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Date      datatypes.Date `json:"date" gorm:"not null"`
	Question  string `json:"question" gorm:"not null"`
	Options   pq.StringArray `json:"options" gorm:"type:text[]"`
	CorrectAnswer string `json:"correct_answer" gorm:"not null"`
	Explanation   string `json:"explanation" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}