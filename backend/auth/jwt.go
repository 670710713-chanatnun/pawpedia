// Package auth ออกและตรวจสอบ JWT รวมถึง hash รหัสผ่าน
package auth

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims คือข้อมูลที่ฝังใน token
type Claims struct {
	MemberID int64  `json:"mid"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Issuer ใช้ secret เดียวกันทั้งออกและตรวจ token
type Issuer struct {
	Secret []byte
	TTL    time.Duration
}

// Issue สร้าง token ใหม่ให้สมาชิก
func (i *Issuer) Issue(memberID int64, role string) (string, error) {
	now := time.Now()
	claims := Claims{
		MemberID: memberID,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "pawpedia",
			Subject:   strconv.FormatInt(memberID, 10),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(i.TTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(i.Secret)
}

// Parse ตรวจลายเซ็นและวันหมดอายุของ token
func (i *Issuer) Parse(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims,
		func(t *jwt.Token) (any, error) { return i.Secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}
	if !token.Valid || claims.MemberID <= 0 {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
