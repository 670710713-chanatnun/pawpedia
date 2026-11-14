package mw

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pawpedia/auth"
)

// ตรวจว่า Backend บังคับสิทธิ์เอง ไม่ได้พึ่งการซ่อนปุ่มใน Frontend
func TestAdminRouteAuthorization(t *testing.T) {
	iss := &auth.Issuer{Secret: []byte("test-secret-test-secret-test-secret!!"), TTL: time.Hour}
	members := map[int64]struct {
		role   string
		active bool
	}{
		1: {"member", true},
		2: {"admin", true},
		3: {"member", false},
	}
	lookup := func(_ context.Context, id int64) (string, bool, error) {
		m, ok := members[id]
		if !ok {
			return "", false, ErrMemberNotFound
		}
		return m.role, m.active, nil
	}
	ok := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	adminRoute := RequireLogin(iss, lookup, RequireRole("admin", ok))

	tokenFor := func(id int64, role string) string {
		tok, err := iss.Issue(id, role)
		if err != nil {
			t.Fatal(err)
		}
		return "Bearer " + tok
	}

	cases := []struct {
		name   string
		header string
		want   int
	}{
		{"no token", "", http.StatusUnauthorized},
		{"garbage token", "Bearer abc.def.ghi", http.StatusUnauthorized},
		{"member is forbidden", tokenFor(1, "member"), http.StatusForbidden},
		// token อ้างว่าเป็น admin แต่ใน DB เป็น member → ต้องโดนปฏิเสธ
		{"stale admin claim", tokenFor(1, "admin"), http.StatusForbidden},
		{"disabled account", tokenFor(3, "member"), http.StatusForbidden},
		{"deleted member", tokenFor(99, "admin"), http.StatusUnauthorized},
		{"admin allowed", tokenFor(2, "admin"), http.StatusOK},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
			if c.header != "" {
				req.Header.Set("Authorization", c.header)
			}
			rec := httptest.NewRecorder()
			adminRoute.ServeHTTP(rec, req)
			if rec.Code != c.want {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, c.want, rec.Body.String())
			}
		})
	}
}

func TestCORSPreflight(t *testing.T) {
	h := CORS([]string{"https://pawpedia.vercel.app"}, http.NotFoundHandler())
	req := httptest.NewRequest(http.MethodOptions, "/api/breeds", nil)
	req.Header.Set("Origin", "https://pawpedia.vercel.app")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://pawpedia.vercel.app" {
		t.Fatalf("allow-origin = %q", got)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/breeds", nil)
	req.Header.Set("Origin", "https://evil.example")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unknown origin should not be allowed, got %q", got)
	}
}
