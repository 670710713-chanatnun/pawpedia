package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/joho/godotenv/autoload" // โหลด .env อัตโนมัติตอนรันบนเครื่อง (บน Render ใช้ env ของ Render)

	"pawpedia/auth"
	"pawpedia/handler"
	"pawpedia/mw"
	"pawpedia/respond"
	"pawpedia/store"
)

func main() {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters")
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("db config: %v", err)
	}
	defer pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}
	st := &store.Store{Pool: pool}

	// สร้างบัญชี admin จาก env (ไม่ hardcode รหัสผ่านไว้ในโค้ดหรือ seed)
	if email, pw := strings.TrimSpace(os.Getenv("ADMIN_EMAIL")), os.Getenv("ADMIN_PASSWORD"); email != "" && pw != "" {
		hash, err := auth.HashPassword(pw)
		if err != nil {
			log.Fatalf("hash admin password: %v", err)
		}
		if err := st.EnsureAdmin(ctx, strings.ToLower(email), hash); err != nil {
			log.Fatalf("ensure admin: %v", err)
		}
		log.Printf("admin account ready: %s", email)
	}

	iss := &auth.Issuer{Secret: []byte(secret), TTL: 24 * time.Hour}
	h := &handler.Handler{Store: st, Issuer: iss}

	// อ่าน role/สถานะล่าสุดจาก DB ทุก request ที่ต้อง login
	lookup := func(ctx context.Context, id int64) (string, bool, error) {
		m, err := st.MemberByID(ctx, id)
		if errors.Is(err, store.ErrNotFound) {
			return "", false, mw.ErrMemberNotFound
		}
		if err != nil {
			return "", false, err
		}
		return m.Role, m.IsActive, nil
	}
	login := func(next http.HandlerFunc) http.Handler { return mw.RequireLogin(iss, lookup, next) }
	admin := func(next http.HandlerFunc) http.Handler {
		return mw.RequireLogin(iss, lookup, mw.RequireRole("admin", next))
	}

	mux := http.NewServeMux()

	// Health check (Render ใช้ปลุก/ตรวจ service)
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		respond.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// ---------- Guest ----------
	mux.HandleFunc("POST /api/auth/register", h.Register)
	mux.HandleFunc("POST /api/auth/login", h.Login)
	mux.HandleFunc("GET /api/categories", h.ListCategories)
	mux.HandleFunc("GET /api/breeds", h.ListBreeds)
	mux.HandleFunc("GET /api/breeds/compare", h.CompareBreeds)
	mux.HandleFunc("GET /api/breeds/{id}", h.GetBreed)

	// ---------- Member (ต้อง login) ----------
	mux.Handle("GET /api/me", login(h.Me))
	mux.Handle("PUT /api/me", login(h.UpdateMe))
	mux.Handle("PUT /api/me/password", login(h.ChangePassword))
	mux.Handle("GET /api/me/favorites", login(h.ListFavorites))
	mux.Handle("POST /api/me/favorites", login(h.AddFavorite))
	mux.Handle("DELETE /api/me/favorites/{breedId}", login(h.RemoveFavorite))

	// ---------- Admin (ต้อง login + role admin) ----------
	mux.Handle("GET /api/admin/stats", admin(h.Stats))
	mux.Handle("POST /api/admin/breeds", admin(h.CreateBreed))
	mux.Handle("PUT /api/admin/breeds/{id}", admin(h.UpdateBreed))
	mux.Handle("DELETE /api/admin/breeds/{id}", admin(h.DeleteBreed))
	mux.Handle("POST /api/admin/categories", admin(h.CreateCategory))
	mux.Handle("PUT /api/admin/categories/{id}", admin(h.UpdateCategory))
	mux.Handle("DELETE /api/admin/categories/{id}", admin(h.DeleteCategory))
	mux.Handle("GET /api/admin/members", admin(h.ListMembers))
	mux.Handle("PUT /api/admin/members/{id}/role", admin(h.SetMemberRole))
	mux.Handle("PUT /api/admin/members/{id}/status", admin(h.SetMemberStatus))

	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		respond.JSON(w, http.StatusOK, map[string]string{"name": "Pawpedia API", "health": "/api/health"})
	})

	origins := []string{}
	for _, o := range strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",") {
		if o = strings.TrimRight(strings.TrimSpace(o), "/"); o != "" {
			origins = append(origins, o)
		}
	}

	port := os.Getenv("PORT") // Render กำหนด PORT ให้เอง
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mw.Logging(mw.Recover(mw.CORS(origins, mux))),
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("Pawpedia API listening on :%s (allowed origins: %v)", port, origins)
	log.Fatal(srv.ListenAndServe())
}
