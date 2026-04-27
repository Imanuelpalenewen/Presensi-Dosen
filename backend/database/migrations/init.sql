-- ============================================================
-- database/migrations/init.sql
-- SEMUA ANGGOTA: File ini sebagai referensi skema DB.
-- GORM AutoMigrate sudah menangani pembuatan tabel otomatis,
-- tapi file ini berguna untuk dokumentasi dan seed data awal.
-- ============================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS presensi_dosen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE presensi_dosen;

-- ─── Tabel users ──────────────────────────────────────────────
-- role: 'dosen' | 'admin' | 'warek3'
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,    -- bcrypt hash
    role       ENUM('dosen', 'admin', 'warek3') NOT NULL DEFAULT 'dosen',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Tabel schedules (Jadwal Semester) ────────────────────────
-- Dibuat sekali di awal semester. Koordinat kelas disimpan di sini.
CREATE TABLE IF NOT EXISTS schedules (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dosen_id      BIGINT UNSIGNED NOT NULL,
    mata_kuliah   VARCHAR(255) NOT NULL,
    hari          ENUM('Senin','Selasa','Rabu','Kamis','Jumat') NOT NULL,
    jam_mulai     TIME NOT NULL,
    jam_selesai   TIME NOT NULL,
    kelas         VARCHAR(50) NOT NULL,
    semester      VARCHAR(20) NOT NULL,  -- contoh: "Genap 2024/2025"
    lokasi_lat    DECIMAL(10, 7) NOT NULL,  -- latitude kelas
    lokasi_lng    DECIMAL(10, 7) NOT NULL,  -- longitude kelas
    lokasi_nama   VARCHAR(255) NOT NULL,    -- label deskriptif, contoh: "Gedung A Lt.2 R.201"
    radius_meter  INT NOT NULL DEFAULT 100, -- batas radius absensi dalam meter
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dosen_id) REFERENCES users(id)
);

-- ─── Tabel sessions (Sesi Pertemuan Harian) ───────────────────
-- Dibuat oleh admin setiap hari untuk setiap pertemuan.
-- qr_token: UUID v4 unik per sesi, digunakan sebagai identitas sesi.
CREATE TABLE IF NOT EXISTS sessions (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT UNSIGNED NOT NULL,
    qr_token    VARCHAR(36) NOT NULL UNIQUE,  -- UUID v4
    status      ENUM('active', 'closed', 'expired') NOT NULL DEFAULT 'active',
    expired_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

-- ─── Tabel attendances (Rekaman Absensi) ──────────────────────
-- Setiap baris = satu dosen berhasil absen di satu sesi.
-- Menyimpan koordinat GPS dosen saat absen sebagai bukti audit.
CREATE TABLE IF NOT EXISTS attendances (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id  BIGINT UNSIGNED NOT NULL,
    dosen_id    BIGINT UNSIGNED NOT NULL,
    jam_absen   DATETIME NOT NULL,
    latitude    DECIMAL(10, 7) NOT NULL,  -- koordinat dosen saat absen
    longitude   DECIMAL(10, 7) NOT NULL,
    jarak_meter INT NOT NULL,             -- jarak dosen ke kelas saat absen
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_session_dosen (session_id, dosen_id),  -- satu dosen satu kali per sesi
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (dosen_id) REFERENCES users(id)
);

-- ─── Tabel messages (Pesan Kendala Dosen ke Admin) ────────────
-- [FITUR BARU] Dosen mengirim pesan jika tidak bisa absen.
-- Pesan masuk ke inbox admin di halaman MessageInboxPage.
CREATE TABLE IF NOT EXISTS messages (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dosen_id    BIGINT UNSIGNED NOT NULL,
    session_id  BIGINT UNSIGNED,          -- NULL jika tidak terkait sesi tertentu
    judul       VARCHAR(255) NOT NULL,
    isi         TEXT NOT NULL,
    status      ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dosen_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- ─── Seed Data (Akun Default untuk Testing) ───────────────────
-- Password semua akun: "password123" (bcrypt hash di bawah)
-- GANTI password ini sebelum deploy ke production!
INSERT IGNORE INTO users (nama, email, password, role) VALUES
('Admin Sistem', 'admin@kampus.ac.id', '$2a$10$placeholder_bcrypt_hash_admin', 'admin'),
('Dr. Budi Santoso', 'budi@kampus.ac.id', '$2a$10$placeholder_bcrypt_hash_dosen', 'dosen'),
('Prof. Siti WR3', 'warek3@kampus.ac.id', '$2a$10$placeholder_bcrypt_hash_warek3', 'warek3');

-- TODO: Generate bcrypt hash dari "password123" menggunakan:
-- go run scripts/generate_hash.go atau gunakan tool online bcrypt generator
