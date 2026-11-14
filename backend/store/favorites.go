package store

import (
	"context"
	"time"
)

type Favorite struct {
	Breed
	AddedAt time.Time `json:"added_at"`
}

func (s *Store) ListFavorites(ctx context.Context, memberID int64) ([]Favorite, error) {
	rows, err := s.Pool.Query(ctx, `SELECT `+breedColumns+`, f.added_at`+breedFrom+`
		JOIN favorites f ON f.breed_id = b.id
		WHERE f.member_id = $1
		ORDER BY f.added_at DESC`, memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Favorite{}
	for rows.Next() {
		var added time.Time
		b, err := scanBreed(rows, &added)
		if err != nil {
			return nil, err
		}
		list = append(list, Favorite{Breed: *b, AddedAt: added})
	}
	return list, rows.Err()
}

// AddFavorite — ซ้ำได้ ErrConflict, ไม่มีสายพันธุ์ได้ ErrNotFound
func (s *Store) AddFavorite(ctx context.Context, memberID, breedID int64) error {
	tag, err := s.Pool.Exec(ctx, `
		INSERT INTO favorites (member_id, breed_id) VALUES ($1, $2)
		ON CONFLICT (member_id, breed_id) DO NOTHING`, memberID, breedID)
	if err != nil {
		if mapErr(err) == ErrInvalidRef {
			return ErrNotFound
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrConflict
	}
	return nil
}

func (s *Store) RemoveFavorite(ctx context.Context, memberID, breedID int64) error {
	tag, err := s.Pool.Exec(ctx,
		`DELETE FROM favorites WHERE member_id = $1 AND breed_id = $2`, memberID, breedID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
