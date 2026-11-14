package store

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Member struct {
	ID            int64     `json:"id"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	DisplayName   string    `json:"display_name"`
	AvatarURL     string    `json:"avatar_url"`
	Role          string    `json:"role"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	FavoriteCount int64     `json:"favorite_count"`
}

const memberCols = `m.id, m.email, m.password_hash, m.display_name, m.avatar_url, m.role, m.is_active, m.created_at`

// scanMember อ่านคอลัมน์ memberCols (และ favorite_count ถ้า withCount = true)
func scanMember(row pgx.Row, withCount ...bool) (*Member, error) {
	m := &Member{}
	dest := []any{&m.ID, &m.Email, &m.PasswordHash, &m.DisplayName, &m.AvatarURL, &m.Role, &m.IsActive, &m.CreatedAt}
	if len(withCount) > 0 && withCount[0] {
		dest = append(dest, &m.FavoriteCount)
	}
	if err := row.Scan(dest...); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return m, nil
}

func (s *Store) CreateMember(ctx context.Context, email, hash, displayName string) (*Member, error) {
	row := s.Pool.QueryRow(ctx, `
		INSERT INTO members AS m (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING `+memberCols, email, hash, displayName)
	m, err := scanMember(row)
	if err != nil {
		return nil, mapErr(err)
	}
	return m, nil
}

// EnsureAdmin สร้างบัญชี admin ตอนเริ่มระบบ (ถ้ามีอีเมลนี้อยู่แล้วจะยกเป็น admin โดยไม่แก้รหัสผ่าน)
func (s *Store) EnsureAdmin(ctx context.Context, email, hash string) error {
	_, err := s.Pool.Exec(ctx, `
		INSERT INTO members (email, password_hash, display_name, role)
		VALUES ($1, $2, 'Administrator', 'admin')
		ON CONFLICT ((lower(email))) DO UPDATE SET role = 'admin', is_active = TRUE`,
		email, hash)
	return err
}

func (s *Store) MemberByEmail(ctx context.Context, email string) (*Member, error) {
	return scanMember(s.Pool.QueryRow(ctx,
		`SELECT `+memberCols+` FROM members m WHERE lower(m.email) = lower($1)`, strings.TrimSpace(email)))
}

func (s *Store) MemberByID(ctx context.Context, id int64) (*Member, error) {
	return scanMember(s.Pool.QueryRow(ctx, `
		SELECT `+memberCols+`, (SELECT count(*) FROM favorites f WHERE f.member_id = m.id)
		FROM members m WHERE m.id = $1`, id), true)
}

func (s *Store) UpdateProfile(ctx context.Context, id int64, displayName, avatarURL string) (*Member, error) {
	tag, err := s.Pool.Exec(ctx, `
		UPDATE members SET display_name = $2, avatar_url = $3, updated_at = now() WHERE id = $1`,
		id, displayName, avatarURL)
	if err != nil {
		return nil, mapErr(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.MemberByID(ctx, id)
}

func (s *Store) UpdatePassword(ctx context.Context, id int64, hash string) error {
	tag, err := s.Pool.Exec(ctx,
		`UPDATE members SET password_hash = $2, updated_at = now() WHERE id = $1`, id, hash)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListMembers(ctx context.Context, q string) ([]Member, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT `+memberCols+`, (SELECT count(*) FROM favorites f WHERE f.member_id = m.id)
		FROM members m
		WHERE ($1 = '' OR m.email ILIKE '%' || $1 || '%' OR m.display_name ILIKE '%' || $1 || '%')
		ORDER BY m.created_at DESC`, strings.TrimSpace(q))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Member{}
	for rows.Next() {
		m, err := scanMember(rows, true)
		if err != nil {
			return nil, err
		}
		list = append(list, *m)
	}
	return list, rows.Err()
}

func (s *Store) SetMemberRole(ctx context.Context, id int64, role string) (*Member, error) {
	tag, err := s.Pool.Exec(ctx, `UPDATE members SET role = $2, updated_at = now() WHERE id = $1`, id, role)
	if err != nil {
		return nil, mapErr(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.MemberByID(ctx, id)
}

func (s *Store) SetMemberActive(ctx context.Context, id int64, active bool) (*Member, error) {
	tag, err := s.Pool.Exec(ctx, `UPDATE members SET is_active = $2, updated_at = now() WHERE id = $1`, id, active)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.MemberByID(ctx, id)
}
