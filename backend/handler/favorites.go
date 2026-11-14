package handler

import (
	"errors"
	"net/http"

	"pawpedia/mw"
	"pawpedia/respond"
	"pawpedia/store"
)

// member_id มาจาก JWT เสมอ — ไม่รับจาก body จึงแก้รายการโปรดของคนอื่นไม่ได้

// GET /api/me/favorites
func (h *Handler) ListFavorites(w http.ResponseWriter, r *http.Request) {
	list, err := h.Store.ListFavorites(r.Context(), mw.MemberID(r.Context()))
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, http.StatusOK, list)
}

// POST /api/me/favorites {"breed_id": 1}
func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BreedID int64 `json:"breed_id"`
	}
	if !decode(w, r, &req) {
		return
	}
	if req.BreedID <= 0 {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "กรุณาระบุสายพันธุ์")
		return
	}
	err := h.Store.AddFavorite(r.Context(), mw.MemberID(r.Context()), req.BreedID)
	if errors.Is(err, store.ErrConflict) {
		respond.Error(w, http.StatusConflict, "ALREADY_FAVORITE", "สายพันธุ์นี้อยู่ในรายการโปรดแล้ว")
		return
	}
	if err != nil {
		storeError(w, err, breedNotFound)
		return
	}
	respond.JSON(w, http.StatusCreated, map[string]int64{"breed_id": req.BreedID})
}

// DELETE /api/me/favorites/{breedId}
func (h *Handler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	breedID, ok := pathID(w, r, "breedId")
	if !ok {
		return
	}
	if err := h.Store.RemoveFavorite(r.Context(), mw.MemberID(r.Context()), breedID); err != nil {
		storeError(w, err, "ไม่พบสายพันธุ์นี้ในรายการโปรด")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
