package handler

import (
	"errors"
	"net/http"
	"strings"

	"pawpedia/auth"
	"pawpedia/mw"
	"pawpedia/respond"
	"pawpedia/store"
)

type authResponse struct {
	Token  string        `json:"token"`
	Member *store.Member `json:"member"`
}

// POST /api/auth/register
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
	}
	if !decode(w, r, &req) {
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	switch {
	case !validEmail(req.Email):
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "รูปแบบอีเมลไม่ถูกต้อง")
		return
	case len(req.Password) < 8 || len(req.Password) > 72:
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "รหัสผ่านต้องยาว 8-72 ตัวอักษร")
		return
	case req.DisplayName == "" || runeLen(req.DisplayName) > 60:
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "กรุณากรอกชื่อที่แสดง (ไม่เกิน 60 ตัวอักษร)")
		return
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		storeError(w, err, "")
		return
	}
	m, err := h.Store.CreateMember(r.Context(), req.Email, hash, req.DisplayName)
	if errors.Is(err, store.ErrConflict) {
		respond.Error(w, http.StatusConflict, "EMAIL_TAKEN", "อีเมลนี้ถูกใช้สมัครแล้ว")
		return
	}
	if err != nil {
		storeError(w, err, "")
		return
	}
	h.issue(w, http.StatusCreated, m)
}

// POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &req) {
		return
	}
	m, err := h.Store.MemberByEmail(r.Context(), req.Email)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		storeError(w, err, "")
		return
	}
	// ข้อความเดียวกันทั้งกรณีไม่พบอีเมลและรหัสผิด เพื่อไม่บอกใบ้ว่าอีเมลไหนมีในระบบ
	if m == nil || !auth.CheckPassword(m.PasswordHash, req.Password) {
		respond.Error(w, http.StatusUnauthorized, "BAD_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
		return
	}
	if !m.IsActive {
		respond.Error(w, http.StatusForbidden, "ACCOUNT_DISABLED", "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ")
		return
	}
	h.issue(w, http.StatusOK, m)
}

func (h *Handler) issue(w http.ResponseWriter, status int, m *store.Member) {
	token, err := h.Issuer.Issue(m.ID, m.Role)
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, status, authResponse{Token: token, Member: m})
}

// GET /api/me
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	m, err := h.Store.MemberByID(r.Context(), mw.MemberID(r.Context()))
	if err != nil {
		storeError(w, err, "ไม่พบบัญชีผู้ใช้")
		return
	}
	respond.JSON(w, http.StatusOK, m)
}

// PUT /api/me — แก้ได้เฉพาะชื่อที่แสดงและรูปโปรไฟล์ (อีเมลและ role แก้เองไม่ได้)
func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DisplayName string `json:"display_name"`
		AvatarURL   string `json:"avatar_url"`
	}
	if !decode(w, r, &req) {
		return
	}
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	req.AvatarURL = strings.TrimSpace(req.AvatarURL)
	if req.DisplayName == "" || runeLen(req.DisplayName) > 60 {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "กรุณากรอกชื่อที่แสดง (ไม่เกิน 60 ตัวอักษร)")
		return
	}
	if !validURL(req.AvatarURL) {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "ลิงก์รูปโปรไฟล์ต้องขึ้นต้นด้วย http:// หรือ https://")
		return
	}
	m, err := h.Store.UpdateProfile(r.Context(), mw.MemberID(r.Context()), req.DisplayName, req.AvatarURL)
	if err != nil {
		storeError(w, err, "ไม่พบบัญชีผู้ใช้")
		return
	}
	respond.JSON(w, http.StatusOK, m)
}

// PUT /api/me/password — ต้องยืนยันรหัสผ่านเดิมก่อน
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if !decode(w, r, &req) {
		return
	}
	id := mw.MemberID(r.Context())
	m, err := h.Store.MemberByID(r.Context(), id)
	if err != nil {
		storeError(w, err, "ไม่พบบัญชีผู้ใช้")
		return
	}
	if !auth.CheckPassword(m.PasswordHash, req.CurrentPassword) {
		respond.Error(w, http.StatusBadRequest, "WRONG_PASSWORD", "รหัสผ่านเดิมไม่ถูกต้อง")
		return
	}
	if len(req.NewPassword) < 8 || len(req.NewPassword) > 72 {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "รหัสผ่านใหม่ต้องยาว 8-72 ตัวอักษร")
		return
	}
	if req.NewPassword == req.CurrentPassword {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม")
		return
	}
	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		storeError(w, err, "")
		return
	}
	if err := h.Store.UpdatePassword(r.Context(), id, hash); err != nil {
		storeError(w, err, "ไม่พบบัญชีผู้ใช้")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
