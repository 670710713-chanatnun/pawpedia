// Package store คือชั้นที่คุยกับ PostgreSQL (Supabase) ผ่าน pgx — handler ไม่เขียน SQL เอง
package store

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrConflict   = errors.New("conflict")
	ErrInvalidRef = errors.New("invalid reference")
	ErrInvalid    = errors.New("invalid data")
)

type Store struct {
	Pool *pgxpool.Pool
}

// mapErr แปลง error ของ PostgreSQL เป็น error ของระบบ
func mapErr(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			return ErrConflict
		case "23503": // foreign_key_violation
			return ErrInvalidRef
		case "23514", "22P02", "22003": // check_violation, invalid_text, out_of_range
			return ErrInvalid
		}
	}
	return err
}
