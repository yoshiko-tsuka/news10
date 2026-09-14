package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
	_ "time/tzdata"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"news10/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() {
	var err error

	// Pull connection variables directly from Docker Compose environment variables
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := "5432" // Default Postgres port matching compose file

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Australia/Sydney", 
		host, user, password, dbname, port)

	// Docker may start the app before the DB is fully ready. 
	// We implement a simple retry mechanism here.
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		fmt.Println("Database not ready yet, retrying in 2 seconds...")
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	// Auto-Migrate: Automatically creates/updates the database tables based on the Struct
	db.AutoMigrate(&models.Quiz{})
	fmt.Println("Database connection successfully established and tables migrated.")
}

func main() {
	// Initialize the Database
	initDB()

	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Route 1: Get all Quizzes
	r.GET("/quizzes", func(c *gin.Context) {
		// Get raw query strings using Gin's Query method
        startStr := c.Query("start_date")
        endStr := c.Query("end_date")

        // Define the date layout (YYYY-MM-DD)
        layout := "2006-01-02"

        // Parse start date
        startDate, err1 := time.Parse(layout, startStr)
        // Parse end date
        endDate, err2 := time.Parse(layout, endStr)

        if err1 != nil || err2 != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "Invalid date format. Use YYYY-MM-DD",
            })
            return
        }

		if startDate.After(endDate) {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "start_date must be before or equal to end_date",
            })
            return
        }

		var quizzes []*models.Quiz
		result := db.Where("date BETWEEN ? AND ?", startDate.UTC(), endDate.UTC()).Find(&quizzes)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"title":   "Top 10 Australian News Quiz",
			"country": "Australia",
			"period": gin.H{
				"from": startDate,
				"to":   endDate,
			},
			"quiz": quizzes,
		})
	})

	// Route 2: Create a quiz
	r.POST("/quizzes", func(c *gin.Context) {
		var input *models.Quiz
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, input)
	})

	// Start Gin Server
	r.Run(":8080")
}
