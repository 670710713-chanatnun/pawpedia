package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// BreedInput คือฟิลด์ที่ Admin กรอกได้ (ใช้ทั้งตอนเพิ่มและแก้ไข)
type BreedInput struct {
	NameEN       string  `json:"name_en"`
	NameTH       string  `json:"name_th"`
	Origin       string  `json:"origin"`
	Size         string  `json:"size"`
	CategoryID   *int64  `json:"category_id"`
	WeightMinKg  float64 `json:"weight_min_kg"`
	WeightMaxKg  float64 `json:"weight_max_kg"`
	HeightMinCm  int     `json:"height_min_cm"`
	HeightMaxCm  int     `json:"height_max_cm"`
	LifeMin      int     `json:"life_min"`
	LifeMax      int     `json:"life_max"`
	Temperament  string  `json:"temperament"`
	Description  string  `json:"description"`
	CareTips     string  `json:"care_tips"`
	Energy       int     `json:"energy_level"`
	Grooming     int     `json:"grooming_level"`
	GoodWithKids bool    `json:"good_with_kids"`
	ImageURL     string  `json:"image_url"`
}

type Breed struct {
	ID int64 `json:"id"`
	BreedInput
	CategoryName string    `json:"category_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type BreedFilter struct {
	Q          string
	Size       string
	CategoryID int64
	Limit      int
	Offset     int
}

const breedColumns = `
b.id, b.name_en, b.name_th, b.origin, b.size, b.category_id, COALESCE(c.name_en, ''),
b.weight_min_kg, b.weight_max_kg, b.height_min_cm, b.height_max_cm, b.life_min, b.life_max,
b.temperament, b.description, b.care_tips, b.energy_level, b.grooming_level,
b.good_with_kids, b.image_url, b.created_at, b.updated_at`

const breedFrom = `
FROM breeds b
LEFT JOIN categories c ON c.id = b.category_id`

const breedSelect = `SELECT ` + breedColumns + breedFrom

const breedWhere = `
WHERE ($1 = '' OR b.name_en ILIKE '%' || $1 || '%' OR b.name_th ILIKE '%' || $1 || '%' OR b.origin ILIKE '%' || $1 || '%')
  AND ($2 = '' OR b.size = $2)
  AND ($3::bigint = 0 OR b.category_id = $3)`

func scanBreed(row pgx.Row, extra ...any) (*Breed, error) {
	b := &Breed{}
	dest := []any{&b.ID, &b.NameEN, &b.NameTH, &b.Origin, &b.Size, &b.CategoryID, &b.CategoryName,
		&b.WeightMinKg, &b.WeightMaxKg, &b.HeightMinCm, &b.HeightMaxCm, &b.LifeMin, &b.LifeMax,
		&b.Temperament, &b.Description, &b.CareTips, &b.Energy, &b.Grooming,
		&b.GoodWithKids, &b.ImageURL, &b.CreatedAt, &b.UpdatedAt}
	dest = append(dest, extra...)
	if err := row.Scan(dest...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return b, nil
}

// ListBreeds ค้นหา + กรอง + แบ่งหน้า คืนรายการและจำนวนทั้งหมด
func (s *Store) ListBreeds(ctx context.Context, f BreedFilter) ([]Breed, int64, error) {
	q := strings.TrimSpace(f.Q)
	var total int64
	if err := s.Pool.QueryRow(ctx, `SELECT count(*) FROM breeds b`+breedWhere,
		q, f.Size, f.CategoryID).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.Pool.Query(ctx, breedSelect+breedWhere+`
		ORDER BY b.name_en
		LIMIT $4 OFFSET $5`, q, f.Size, f.CategoryID, f.Limit, f.Offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := []Breed{}
	for rows.Next() {
		b, err := scanBreed(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *b)
	}
	return items, total, rows.Err()
}

func (s *Store) GetBreed(ctx context.Context, id int64) (*Breed, error) {
	return scanBreed(s.Pool.QueryRow(ctx, breedSelect+` WHERE b.id = $1`, id))
}

func breedArgs(in BreedInput) []any {
	return []any{in.NameEN, in.NameTH, in.Origin, in.Size, in.CategoryID,
		in.WeightMinKg, in.WeightMaxKg, in.HeightMinCm, in.HeightMaxCm, in.LifeMin, in.LifeMax,
		in.Temperament, in.Description, in.CareTips, in.Energy, in.Grooming, in.GoodWithKids, in.ImageURL}
}

func (s *Store) CreateBreed(ctx context.Context, in BreedInput) (*Breed, error) {
	var id int64
	err := s.Pool.QueryRow(ctx, `
		INSERT INTO breeds (name_en, name_th, origin, size, category_id,
			weight_min_kg, weight_max_kg, height_min_cm, height_max_cm, life_min, life_max,
			temperament, description, care_tips, energy_level, grooming_level, good_with_kids, image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		RETURNING id`, breedArgs(in)...).Scan(&id)
	if err != nil {
		return nil, mapErr(err)
	}
	return s.GetBreed(ctx, id)
}

func (s *Store) UpdateBreed(ctx context.Context, id int64, in BreedInput) (*Breed, error) {
	args := append(breedArgs(in), id)
	tag, err := s.Pool.Exec(ctx, `
		UPDATE breeds SET name_en = $1, name_th = $2, origin = $3, size = $4, category_id = $5,
			weight_min_kg = $6, weight_max_kg = $7, height_min_cm = $8, height_max_cm = $9,
			life_min = $10, life_max = $11, temperament = $12, description = $13, care_tips = $14,
			energy_level = $15, grooming_level = $16, good_with_kids = $17, image_url = $18,
			updated_at = now()
		WHERE id = $19`, args...)
	if err != nil {
		return nil, mapErr(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.GetBreed(ctx, id)
}

func (s *Store) DeleteBreed(ctx context.Context, id int64) error {
	tag, err := s.Pool.Exec(ctx, `DELETE FROM breeds WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
