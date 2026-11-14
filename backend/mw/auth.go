// Package mw รวม middleware: ตรวจ token, ตรวจสิทธิ์, CORS, logging, recover
package mw

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"pawpedia/auth"
	"pawpedia/respond"
)

type ctxKey int

const (
	keyMemberID ctxKey = iota
	keyRole
)

// ErrMemberNotFound ให้ AccessLookup คืนค่านี้เมื่อไม่พบสมาชิก (เช่นถูกลบไปแล้ว)
var ErrMemberNotFound = errors.New("member not found")

// AccessLookup อ่าน role และสถานะล่าสุดจาก DB
// ทำให้การเปลี่ยนสิทธิ์/ระงับบัญชีมีผลทันที ไม่ต้องรอ token หมดอายุ
type AccessLookup func(ctx context.Context, memberID int64) (role string, active bool, err error)

// RequireLogin ต้องมี "Authorization: Bearer <token>" ที่ถูกต้อง
func RequireLogin(iss *auth.Issuer, lookup AccessLookup, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		token = strings.TrimSpace(token)
		if !ok || token == "" {
			respond.Error(w, http.StatusUnauthorized, "NO_TOKEN", "กรุณาเข้าสู่ระบบก่อน")
			return
		}
		claims, err := iss.Parse(token)
		if err != nil {
			respond.Error(w, http.StatusUnauthorized, "BAD_TOKEN", "Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่")
			return
		}
		role, active, err := lookup(r.Context(), claims.MemberID)
		if errors.Is(err, ErrMemberNotFound) {
			respond.Error(w, http.StatusUnauthorized, "BAD_TOKEN", "ไม่พบบัญชีผู้ใช้นี้")
			return
		}
		if err != nil {
			respond.Error(w, http.StatusInternalServerError, "INTERNAL", "ระบบขัดข้อง")
			return
		}
		if !active {
			respond.Error(w, http.StatusForbidden, "ACCOUNT_DISABLED", "บัญชีนี้ถูกระงับการใช้งาน")
			return
		}
		ctx := context.WithValue(r.Context(), keyMemberID, claims.MemberID)
		ctx = context.WithValue(ctx, keyRole, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole ใช้ต่อจาก RequireLogin — ถ้า role ไม่ตรงตอบ 403
func RequireRole(role string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if Role(r.Context()) != role {
			respond.Error(w, http.StatusForbidden, "FORBIDDEN", "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// MemberID คืน id ของผู้ที่ login อยู่ (0 ถ้าไม่ได้ login)
func MemberID(ctx context.Context) int64 {
	id, _ := ctx.Value(keyMemberID).(int64)
	return id
}

// Role คืน role ของผู้ที่ login อยู่
func Role(ctx context.Context) string {
	role, _ := ctx.Value(keyRole).(string)
	return role
}
