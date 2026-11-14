package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type Category struct {
	ID          int64  `json:"id"`
	NameEN      string `json:"name_en"`
	NameTH      string `json:"name_th"`
	Description string `json:"description"`
	BreedCount  int64  `json:"breed_count"`
}

const categorySelect = `
SELECT c.id, c.name_en, c.name_th, c.description,
       (SELECT count(*) FROM breeds b WHERE b.category_id = c.id)
FROM categories c`

func scanCategory(row pgx.Row) (*Category, error) {
	c := &Category{}
	if err := row.Scan(&c.ID, &c.NameEN, &c.NameTH, &c.Description, &c.BreedCount); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (s *Store) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := s.Pool.Query(ctx, categorySelect+` ORDER BY c.name_en`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Category{}
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *c)
	}
	return list, rows.Err()
}

func (s *Store) GetCategory(ctx context.Context, id int64) (*Category, error) {
	return scanCategory(s.Pool.QueryRow(ctx, categorySelect+` WHERE c.id = $1`, id))
}

func (s *Store) CreateCategory(ctx context.Context, in Category) (*Category, error) {
	var id int64
	err := s.Pool.QueryRow(ctx,
		`INSERT INTO categories (name_en, name_th, description) VALUES ($1, $2, $3) RETURNING id`,
		in.NameEN, in.NameTH, in.Description).Scan(&id)
	if err != nil {
		return nil, mapErr(err)
	}
	return s.GetCategory(ctx, id)
}

func (s *Store) UpdateCategory(ctx context.Context, id int64, in Category) (*Category, error) {
	tag, err := s.Pool.Exec(ctx,
		`UPDATE categories SET name_en = $2, name_th = $3, description = $4 WHERE id = $1`,
		id, in.NameEN, in.NameTH, in.Description)
	if err != nil {
		return nil, mapErr(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.GetCategory(ctx, id)
}

// DeleteCategory — สายพันธุ์ในหมวดนี้จะถูกตั้ง category_id = NULL (ON DELETE SET NULL)
func (s *Store) DeleteCategory(ctx context.Context, id int64) error {
	tag, err := s.Pool.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
