// Package handler รับ HTTP request → ตรวจข้อมูล → เรียก store → ตอบ JSON
package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"

	"pawpedia/auth"
	"pawpedia/respond"
	"pawpedia/store"
)

type Handler struct {
	Store  *store.Store
	Issuer *auth.Issuer
}

// decode อ่าน JSON body (จำกัด 1MB) — ผิดรูปแบบตอบ 400
func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		respond.Error(w, http.StatusBadRequest, "BAD_JSON", "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง")
		return false
	}
	return true
}

// pathID อ่าน {name} จาก path เป็นตัวเลข
func pathID(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	if err != nil || id <= 0 {
		respond.Error(w, http.StatusBadRequest, "BAD_ID", "รหัสอ้างอิงไม่ถูกต้อง")
		return 0, false
	}
	return id, true
}

// storeError แปลง error จาก store เป็น HTTP status ที่เหมาะสม
func storeError(w http.ResponseWriter, err error, notFoundMsg string) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", notFoundMsg)
	case errors.Is(err, store.ErrConflict):
		respond.Error(w, http.StatusConflict, "CONFLICT", "ข้อมูลนี้มีอยู่ในระบบแล้ว")
	case errors.Is(err, store.ErrInvalidRef):
		respond.Error(w, http.StatusBadRequest, "INVALID_REF", "ข้อมูลอ้างอิงไม่ถูกต้อง (เช่น ไม่พบหมวดหมู่)")
	case errors.Is(err, store.ErrInvalid):
		respond.Error(w, http.StatusBadRequest, "INVALID", "ข้อมูลไม่ถูกต้องตามเงื่อนไข")
	default:
		log.Printf("store error: %v", err)
		respond.Error(w, http.StatusInternalServerError, "INTERNAL", "ระบบขัดข้อง กรุณาลองใหม่")
	}
}

func runeLen(s string) int { return utf8.RuneCountInString(s) }

func validEmail(s string) bool {
	at := strings.Index(s, "@")
	return at > 0 && at < len(s)-3 && strings.Contains(s[at:], ".") && !strings.ContainsAny(s, " \t")
}

func validURL(s string) bool {
	if s == "" {
		return true
	}
	u, err := url.Parse(s)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

func validSize(s string) bool {
	return s == "small" || s == "medium" || s == "large"
}

func queryInt(r *http.Request, key string, def int) int {
	n, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return def
	}
	return n
}
