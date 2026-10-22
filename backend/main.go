package main

import (
	"database/sql"
	"errors"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

type Entity struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Status      string  `json:"status"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Description string  `json:"description"`
}

type EntityInput struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Status      string   `json:"status"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Description string   `json:"description"`
}

func validateEntity(input *EntityInput) string {
	input.Name = strings.TrimSpace(input.Name)
	input.Type = strings.TrimSpace(input.Type)
	input.Status = strings.TrimSpace(input.Status)
	input.Description = strings.TrimSpace(input.Description)

	if input.Name == "" {
		return "Name is required"
	}

	if input.Type != "vehicle" &&
		input.Type != "iot_device" &&
		input.Type != "facility" {
		return "Type must be vehicle, iot_device, or facility"
	}

	if input.Status != "active" &&
		input.Status != "inactive" &&
		input.Status != "maintenance" {
		return "Status must be active, inactive, or maintenance"
	}

	if input.Latitude == nil || input.Longitude == nil {
		return "Latitude and longitude are required"
	}

	if math.IsNaN(*input.Latitude) ||
		math.IsInf(*input.Latitude, 0) ||
		*input.Latitude < -90 || *input.Latitude > 90 {
		return "Latitude must be a finite number between -90 and 90"
	}

	if math.IsNaN(*input.Longitude) ||
		math.IsInf(*input.Longitude, 0) ||
		*input.Longitude < -180 || *input.Longitude > 180 {
		return "Longitude must be a finite number between -180 and 180"
	}

	return ""
}

func entityFromInput(id int64, input EntityInput) Entity {
	return Entity{
		ID:          id,
		Name:        input.Name,
		Type:        input.Type,
		Status:      input.Status,
		Latitude:    *input.Latitude,
		Longitude:   *input.Longitude,
		Description: input.Description,
	}
}

func parseID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID must be a positive integer",
		})
		return 0, false
	}
	return id, true
}

func main() {
	db, err := sql.Open("sqlite", "./geo_entities.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	db.SetMaxOpenConns(1)

	schema := `
	CREATE TABLE IF NOT EXISTS entities (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		status TEXT NOT NULL,
		latitude REAL NOT NULL,
		longitude REAL NOT NULL,
		description TEXT NOT NULL DEFAULT ''
	);`

	if _, err := db.Exec(schema); err != nil {
		log.Fatal(err)
	}

	router := gin.Default()

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Geo Entity Manager API is running",
		})
	})

	router.GET("/api/entities", func(c *gin.Context) {
		rows, err := db.Query(`
			SELECT id, name, type, status, latitude, longitude, description
			FROM entities ORDER BY id
		`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entities"})
			return
		}
		defer rows.Close()

		entities := []Entity{}

		for rows.Next() {
			var e Entity
			if err := rows.Scan(
				&e.ID, &e.Name, &e.Type, &e.Status,
				&e.Latitude, &e.Longitude, &e.Description,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read entity"})
				return
			}
			entities = append(entities, e)
		}

		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read entities"})
			return
		}

		c.JSON(http.StatusOK, entities)
	})

	router.GET("/api/entities/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}

		var e Entity
		err := db.QueryRow(`
			SELECT id, name, type, status, latitude, longitude, description
			FROM entities WHERE id = ?
		`, id).Scan(
			&e.ID, &e.Name, &e.Type, &e.Status,
			&e.Latitude, &e.Longitude, &e.Description,
		)

		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Entity not found",
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch entity",
			})
			return
		}

		c.JSON(http.StatusOK, e)
	})

	router.POST("/api/entities", func(c *gin.Context) {
		var input EntityInput

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid JSON request",
			})
			return
		}

		if message := validateEntity(&input); message != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": message})
			return
		}

		result, err := db.Exec(`
			INSERT INTO entities
				(name, type, status, latitude, longitude, description)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
			input.Name, input.Type, input.Status,
			*input.Latitude, *input.Longitude, input.Description,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create entity",
			})
			return
		}

		id, err := result.LastInsertId()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to retrieve entity ID",
			})
			return
		}

		c.JSON(http.StatusCreated, entityFromInput(id, input))
	})

	router.PUT("/api/entities/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}

		var input EntityInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid JSON request",
			})
			return
		}

		if message := validateEntity(&input); message != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": message})
			return
		}

		result, err := db.Exec(`
			UPDATE entities
			SET name = ?, type = ?, status = ?,
				latitude = ?, longitude = ?, description = ?
			WHERE id = ?
		`,
			input.Name, input.Type, input.Status,
			*input.Latitude, *input.Longitude, input.Description, id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update entity",
			})
			return
		}

		affected, err := result.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to verify update",
			})
			return
		}
		if affected == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Entity not found",
			})
			return
		}

		c.JSON(http.StatusOK, entityFromInput(id, input))
	})

	router.DELETE("/api/entities/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}

		result, err := db.Exec(
			"DELETE FROM entities WHERE id = ?", id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to delete entity",
			})
			return
		}

		affected, err := result.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to verify deletion",
			})
			return
		}
		if affected == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Entity not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Entity deleted successfully",
		})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
