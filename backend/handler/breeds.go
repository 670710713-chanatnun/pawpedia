package handler

import (
	"net/http"
	"strconv"
	"strings"

	"pawpedia/respond"
	"pawpedia/store"
)

const breedNotFound = "ไม่พบสายพันธุ์นี้"

// GET /api/breeds?q=&size=&category=&page=&limit=
func (h *Handler) ListBreeds(w http.ResponseWriter, r *http.Request) {
	qv := r.URL.Query()
	size := strings.ToLower(strings.TrimSpace(qv.Get("size")))
	if size != "" && !validSize(size) {
		respond.Error(w, http.StatusBadRequest, "BAD_SIZE", "ขนาดต้องเป็น small, medium หรือ large")
		return
	}
	category, _ := strconv.ParseInt(qv.Get("category"), 10, 64)
	page := max(queryInt(r, "page", 1), 1)
	limit := min(max(queryInt(r, "limit", 12), 1), 100)

	items, total, err := h.Store.ListBreeds(r.Context(), store.BreedFilter{
		Q: qv.Get("q"), Size: size, CategoryID: category,
		Limit: limit, Offset: (page - 1) * limit,
	})
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{
		"items": items, "total": total, "page": page, "limit": limit,
	})
}

// GET /api/breeds/{id}
func (h *Handler) GetBreed(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	b, err := h.Store.GetBreed(r.Context(), id)
	if err != nil {
		storeError(w, err, breedNotFound)
		return
	}
	respond.JSON(w, http.StatusOK, b)
}

// GET /api/breeds/compare?ids=1,2,3 — เปรียบเทียบได้สูงสุด 3 สายพันธุ์
func (h *Handler) CompareBreeds(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Query().Get("ids"), ",")
	ids := []int64{}
	seen := map[int64]bool{}
	for _, p := range parts {
		id, err := strconv.ParseInt(strings.TrimSpace(p), 10, 64)
		if err != nil || id <= 0 {
			continue
		}
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 || len(ids) > 3 {
		respond.Error(w, http.StatusBadRequest, "BAD_IDS", "เลือกสายพันธุ์เพื่อเปรียบเทียบได้ 1-3 รายการ")
		return
	}
	items := []store.Breed{}
	for _, id := range ids {
		b, err := h.Store.GetBreed(r.Context(), id)
		if err != nil {
			storeError(w, err, "ไม่พบสายพันธุ์รหัส "+strconv.FormatInt(id, 10))
			return
		}
		items = append(items, *b)
	}
	respond.JSON(w, http.StatusOK, map[string]any{"items": items})
}

// GET /api/categories
func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	list, err := h.Store.ListCategories(r.Context())
	if err != nil {
		storeError(w, err, "")
		return
	}
	respond.JSON(w, http.StatusOK, list)
}

// ---------- Admin: Breeds ----------

func validateBreed(in *store.BreedInput) string {
	in.NameEN = strings.TrimSpace(in.NameEN)
	in.NameTH = strings.TrimSpace(in.NameTH)
	in.Origin = strings.TrimSpace(in.Origin)
	in.Size = strings.ToLower(strings.TrimSpace(in.Size))
	in.Temperament = strings.TrimSpace(in.Temperament)
	in.Description = strings.TrimSpace(in.Description)
	in.CareTips = strings.TrimSpace(in.CareTips)
	in.ImageURL = strings.TrimSpace(in.ImageURL)
	if in.CategoryID != nil && *in.CategoryID <= 0 {
		in.CategoryID = nil
	}
	switch {
	case in.NameEN == "" || runeLen(in.NameEN) > 100:
		return "กรุณากรอกชื่อสายพันธุ์ภาษาอังกฤษ (ไม่เกิน 100 ตัวอักษร)"
	case runeLen(in.NameTH) > 100:
		return "ชื่อภาษาไทยต้องไม่เกิน 100 ตัวอักษร"
	case !validSize(in.Size):
		return "กรุณาเลือกขนาด small, medium หรือ large"
	case in.WeightMinKg <= 0 || in.WeightMaxKg < in.WeightMinKg || in.WeightMaxKg > 150:
		return "น้ำหนักต้องมากกว่า 0 และค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด"
	case in.HeightMinCm <= 0 || in.HeightMaxCm < in.HeightMinCm || in.HeightMaxCm > 150:
		return "ส่วนสูงต้องมากกว่า 0 และค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด"
	case in.LifeMin <= 0 || in.LifeMax < in.LifeMin || in.LifeMax > 30:
		return "อายุขัยต้องมากกว่า 0 และค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด"
	case in.Energy < 1 || in.Energy > 5 || in.Grooming < 1 || in.Grooming > 5:
		return "ระดับพลังงานและการดูแลขนต้องอยู่ระหว่าง 1-5"
	case !validURL(in.ImageURL):
		return "ลิงก์รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://"
	}
	return ""
}

// POST /api/admin/breeds
func (h *Handler) CreateBreed(w http.ResponseWriter, r *http.Request) {
	var in store.BreedInput
	if !decode(w, r, &in) {
		return
	}
	if msg := validateBreed(&in); msg != "" {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", msg)
		return
	}
	b, err := h.Store.CreateBreed(r.Context(), in)
	if err != nil {
		storeError(w, err, breedNotFound)
		return
	}
	respond.JSON(w, http.StatusCreated, b)
}

// PUT /api/admin/breeds/{id}
func (h *Handler) UpdateBreed(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var in store.BreedInput
	if !decode(w, r, &in) {
		return
	}
	if msg := validateBreed(&in); msg != "" {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", msg)
		return
	}
	b, err := h.Store.UpdateBreed(r.Context(), id, in)
	if err != nil {
		storeError(w, err, breedNotFound)
		return
	}
	respond.JSON(w, http.StatusOK, b)
}

// DELETE /api/admin/breeds/{id}
func (h *Handler) DeleteBreed(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := h.Store.DeleteBreed(r.Context(), id); err != nil {
		storeError(w, err, breedNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- Admin: Categories ----------

func readCategory(w http.ResponseWriter, r *http.Request) (store.Category, bool) {
	var in store.Category
	if !decode(w, r, &in) {
		return in, false
	}
	in.NameEN = strings.TrimSpace(in.NameEN)
	in.NameTH = strings.TrimSpace(in.NameTH)
	in.Description = strings.TrimSpace(in.Description)
	if in.NameEN == "" || runeLen(in.NameEN) > 60 || runeLen(in.NameTH) > 60 {
		respond.Error(w, http.StatusBadRequest, "VALIDATION", "กรุณากรอกชื่อหมวดหมู่ภาษาอังกฤษ (ไม่เกิน 60 ตัวอักษร)")
		return in, false
	}
	return in, true
}

// POST /api/admin/categories
func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	in, ok := readCategory(w, r)
	if !ok {
		return
	}
	c, err := h.Store.CreateCategory(r.Context(), in)
	if err != nil {
		storeError(w, err, "ไม่พบหมวดหมู่")
		return
	}
	respond.JSON(w, http.StatusCreated, c)
}

// PUT /api/admin/categories/{id}
func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	in, ok := readCategory(w, r)
	if !ok {
		return
	}
	c, err := h.Store.UpdateCategory(r.Context(), id, in)
	if err != nil {
		storeError(w, err, "ไม่พบหมวดหมู่")
		return
	}
	respond.JSON(w, http.StatusOK, c)
}

// DELETE /api/admin/categories/{id}
func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := h.Store.DeleteCategory(r.Context(), id); err != nil {
		storeError(w, err, "ไม่พบหมวดหมู่")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
