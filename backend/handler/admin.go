package handler

import (
	"net/http"

	"pawpedia/mw"
	"pawpedia/respond"
)

// GET /api/admin/stats
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	st, err := h.Store.GetStats(r.Context())
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, http.StatusOK, st)
}

// GET /api/admin/members?q=
func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	list, err := h.Store.ListMembers(r.Context(), r.URL.Query().Get("q"))
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, http.StatusOK, list)
}

// targetOther อ่าน {id} และกันไม่ให้ admin แก้สิทธิ์/สถานะของตัวเอง (กันล็อกตัวเองออกจากระบบ)
func targetOther(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return 0, false
	}
	if id == mw.MemberID(r.Context()) {
		respond.Error(w, http.StatusBadRequest, "SELF_CHANGE", "ไม่สามารถเปลี่ยนสิทธิ์หรือระงับบัญชีของตัวเองได้")
		return 0, false
	}
	return id, true
}

// PUT /api/admin/members/{id}/role {"role":"admin"|"member"}
func (h *Handler) SetMemberRole(w http.ResponseWriter, r *http.Request) {
	id, ok := targetOther(w, r)
	if !ok {
		return
	}
	var req struct {
		Role string `json:"role"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.Role != "member" && req.Role != "admin" {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "role ต้องเป็น member หรือ admin")
		return
	}
	m, err := h.Store.SetMemberRole(r.Context(), id, req.Role)
	if err != nil {
		storeError(w, err, "ไม่พบสมาชิก")
		return
	}
	respond.JSON(w, http.StatusOK, m)
}

// PUT /api/admin/members/{id}/status {"is_active":false}
func (h *Handler) SetMemberStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := targetOther(w, r)
	if !ok {
		return
	}
	var req struct {
		IsActive *bool `json:"is_active"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.IsActive == nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "กรุณาระบุ is_active")
		return
	}
	m, err := h.Store.SetMemberActive(r.Context(), id, *req.IsActive)
	if err != nil {
		storeError(w, err, "ไม่พบสมาชิก")
		return
	}
	respond.JSON(w, http.StatusOK, m)
}
