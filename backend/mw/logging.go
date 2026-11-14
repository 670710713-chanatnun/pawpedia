package mw

import (
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"pawpedia/respond"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Logging พิมพ์ method, path, status และเวลาที่ใช้ของทุก request
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.RequestURI(), rec.status, time.Since(start).Round(time.Millisecond))
	})
}

// Recover กัน server ล่มเมื่อ handler panic
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Printf("panic: %v\n%s", v, debug.Stack())
				respond.Error(w, http.StatusInternalServerError, "INTERNAL", "ระบบขัดข้อง")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
