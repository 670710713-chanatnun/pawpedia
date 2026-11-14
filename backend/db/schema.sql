-- Pawpedia schema (PostgreSQL 14+ / Supabase)
-- รันไฟล์นี้ก่อน แล้วค่อยรัน seed.sql
BEGIN;

DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS breeds;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS members;

-- สมาชิก (member / admin) — รหัสผ่านเก็บเป็น bcrypt hash เท่านั้น
CREATE TABLE members (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    display_name  TEXT        NOT NULL,
    avatar_url    TEXT        NOT NULL DEFAULT '',
    role          TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX members_email_lower_idx ON members (lower(email));

-- หมวดหมู่ (กลุ่มสายพันธุ์) — Admin จัดการได้
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name_en     TEXT NOT NULL,
    name_th     TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX categories_name_lower_idx ON categories (lower(name_en));

-- สายพันธุ์สุนัข — ขนาดคงที่ 3 แบบ: small / medium / large
CREATE TABLE breeds (
    id             BIGSERIAL PRIMARY KEY,
    name_en        TEXT         NOT NULL,
    name_th        TEXT         NOT NULL DEFAULT '',
    origin         TEXT         NOT NULL DEFAULT '',
    size           TEXT         NOT NULL CHECK (size IN ('small', 'medium', 'large')),
    category_id    BIGINT       REFERENCES categories (id) ON DELETE SET NULL,
    weight_min_kg  NUMERIC(5,1) NOT NULL CHECK (weight_min_kg > 0),
    weight_max_kg  NUMERIC(5,1) NOT NULL CHECK (weight_max_kg >= weight_min_kg),
    height_min_cm  INTEGER      NOT NULL CHECK (height_min_cm > 0),
    height_max_cm  INTEGER      NOT NULL CHECK (height_max_cm >= height_min_cm),
    life_min       INTEGER      NOT NULL CHECK (life_min > 0),
    life_max       INTEGER      NOT NULL CHECK (life_max >= life_min),
    temperament    TEXT         NOT NULL DEFAULT '',
    description    TEXT         NOT NULL DEFAULT '',
    care_tips      TEXT         NOT NULL DEFAULT '',
    energy_level   SMALLINT     NOT NULL DEFAULT 3 CHECK (energy_level BETWEEN 1 AND 5),
    grooming_level SMALLINT     NOT NULL DEFAULT 3 CHECK (grooming_level BETWEEN 1 AND 5),
    good_with_kids BOOLEAN      NOT NULL DEFAULT TRUE,
    image_url      TEXT         NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX breeds_name_lower_idx ON breeds (lower(name_en));
CREATE INDEX breeds_size_idx ON breeds (size);
CREATE INDEX breeds_category_idx ON breeds (category_id);

-- รายการโปรดของสมาชิก
CREATE TABLE favorites (
    member_id BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    breed_id  BIGINT      NOT NULL REFERENCES breeds (id) ON DELETE CASCADE,
    added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, breed_id)
);

COMMIT;
