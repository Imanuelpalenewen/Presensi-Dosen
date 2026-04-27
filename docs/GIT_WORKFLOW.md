# 🌿 Git Workflow — Tim 3 Orang

## Branch Strategy

```
main              ← kode stabil final, siap demo/deploy
dev               ← integrasi semua fitur dari 3 anggota
├── feat/dosen    ← branch Anggota 1 (Kamu - Dosen)
├── feat/admin    ← branch Anggota 2 (Admin)
└── feat/warek    ← branch Anggota 3 (Warek 3)
```

---

## Setup Awal (Lakukan Sekali)

```bash
# Clone repo
git clone https://github.com/<username>/sistem-presensi-qr.git
cd sistem-presensi-qr

# Buat branch masing-masing dari main
git checkout -b dev
git push -u origin dev

git checkout -b feat/dosen   # Anggota 1
git push -u origin feat/dosen

git checkout -b feat/admin   # Anggota 2
git push -u origin feat/admin

git checkout -b feat/warek   # Anggota 3
git push -u origin feat/warek
```

---

## Alur Kerja Harian

### 1. Sebelum mulai coding — sync dari dev
```bash
git checkout feat/dosen      # ganti ke branch kamu
git fetch origin
git merge origin/dev          # ambil update terbaru dari dev
```

### 2. Coding, commit secara rutin
```bash
git add .
git commit -m "feat(dosen): implementasi halaman absensi"
git push origin feat/dosen
```

### 3. Setelah fitur selesai — merge ke dev (via Pull Request)
- Buka GitHub → Pull Requests → New Pull Request
- Base: `dev` ← Compare: `feat/dosen`
- Minta review dari 1 anggota lain sebelum merge

### 4. Deploy ke main — hanya jika dev sudah stabil
- PR dari `dev` → `main`
- Semua anggota harus menyetujui

---

## Konvensi Commit Message

Format: `<type>(<scope>): <deskripsi singkat>`

| Type     | Kapan Dipakai                        |
|----------|--------------------------------------|
| `feat`   | Fitur baru                           |
| `fix`    | Bug fix                              |
| `refactor` | Refactor tanpa ubah fungsionalitas |
| `style`  | Perbaikan tampilan / CSS             |
| `docs`   | Update dokumentasi                   |
| `chore`  | Setup, config, dependency            |

**Contoh:**
```
feat(dosen): tambah halaman laporan kendala
fix(dosen): perbaiki error saat GPS timeout
feat(admin): implementasi aktivasi sesi & tampil QR
feat(warek): buat halaman dashboard statistik
fix(backend): perbaiki query rekap absensi bulanan
docs: update API.md dengan endpoint messages
```

---

## ❗ Aturan Penting

1. **JANGAN push langsung ke `main`** — selalu lewat PR
2. **JANGAN push file `.env`** — sudah ada di `.gitignore`
3. **Resolve conflict di branch sendiri** sebelum buka PR ke dev
4. **Komunikasikan** jika ada perubahan di file shared:
   - `routes/router.go`
   - `database/connection.go` (AutoMigrate)
   - `services/errors.go`
5. **Selalu pull sebelum coding** untuk hindari conflict besar

---

## Cara Resolve Conflict

```bash
git checkout feat/dosen
git fetch origin
git merge origin/dev          # mungkin ada conflict di sini

# Buka file yang conflict, edit manual, lalu:
git add <file-yang-conflict>
git commit -m "fix: resolve conflict dengan dev"
git push origin feat/dosen
```
