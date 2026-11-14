// Package respond รวมฟังก์ชันตอบกลับ JSON ให้ทุก handler/middleware ใช้รูปแบบเดียวกัน
package respond

import (
	"encoding/json"
	"net/http"
)

// JSON เขียน response เป็น JSON พร้อม status code
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// Error เขียน error ในรูปแบบ {"error":{"code","message"}}
func Error(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, map[string]any{
		"error": map[string]string{"code": code, "message": message},
	})
}
