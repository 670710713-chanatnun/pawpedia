package store

import "context"

type CountItem struct {
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type TopBreed struct {
	ID     int64  `json:"id"`
	NameEN string `json:"name_en"`
	Count  int64  `json:"count"`
}

type Stats struct {
	TotalBreeds     int64       `json:"total_breeds"`
	TotalCategories int64       `json:"total_categories"`
	TotalMembers    int64       `json:"total_members"`
	TotalAdmins     int64       `json:"total_admins"`
	TotalFavorites  int64       `json:"total_favorites"`
	BySize          []CountItem `json:"by_size"`
	ByCategory      []CountItem `json:"by_category"`
	TopFavorites    []TopBreed  `json:"top_favorites"`
}

func (s *Store) countItems(ctx context.Context, sql string) ([]CountItem, error) {
	rows, err := s.Pool.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []CountItem{}
	for rows.Next() {
		var c CountItem
		if err := rows.Scan(&c.Label, &c.Count); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (s *Store) GetStats(ctx context.Context) (*Stats, error) {
	st := &Stats{}
	err := s.Pool.QueryRow(ctx, `
		SELECT (SELECT count(*) FROM breeds),
		       (SELECT count(*) FROM categories),
		       (SELECT count(*) FROM members WHERE role = 'member'),
		       (SELECT count(*) FROM members WHERE role = 'admin'),
		       (SELECT count(*) FROM favorites)`).
		Scan(&st.TotalBreeds, &st.TotalCategories, &st.TotalMembers, &st.TotalAdmins, &st.TotalFavorites)
	if err != nil {
		return nil, err
	}
	if st.BySize, err = s.countItems(ctx, `
		SELECT s.size, count(b.id)
		FROM (VALUES ('small', 1), ('medium', 2), ('large', 3)) AS s(size, ord)
		LEFT JOIN breeds b ON b.size = s.size
		GROUP BY s.size, s.ord
		ORDER BY s.ord`); err != nil {
		return nil, err
	}
	if st.ByCategory, err = s.countItems(ctx, `
		SELECT COALESCE(c.name_en, 'ไม่มีหมวดหมู่'), count(*)
		FROM breeds b LEFT JOIN categories c ON c.id = b.category_id
		GROUP BY 1 ORDER BY 2 DESC, 1`); err != nil {
		return nil, err
	}
	rows, err := s.Pool.Query(ctx, `
		SELECT b.id, b.name_en, count(*)
		FROM favorites f JOIN breeds b ON b.id = f.breed_id
		GROUP BY b.id, b.name_en
		ORDER BY 3 DESC, 2
		LIMIT 5`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	st.TopFavorites = []TopBreed{}
	for rows.Next() {
		var t TopBreed
		if err := rows.Scan(&t.ID, &t.NameEN, &t.Count); err != nil {
			return nil, err
		}
		st.TopFavorites = append(st.TopFavorites, t)
	}
	return st, rows.Err()
}
