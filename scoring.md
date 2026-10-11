# Scoring — sec2-team-12

> โปร่งใส — คะแนนรายแล็บอิง Gradebook และหลักฐาน PR/files จริง อัปเดตตรวจซ้ำ Lab1-7+M1 2026-09-08

## สมาชิก — 4 คน (คะแนนทีมเดียวกัน)
| ID | ชื่อ | GitHub | Lab1 |
|---|---|---|---|
| 67021310 | นายสิรภัทร วิเวกหัสกัณฑ์ | @SirapatViveghutsagun | 50 |
| 67024717 | นายกิตติพัฒน์ ยศวงค์ | @kittiphat78 | 50 |
| 67024807 | นายนนท์ปวิธ กิจอรุณกูล | @Nonpawit230748 | 50 |
| 67025404 | นายปัณณวิชญ์ อินทปาน | @Punnawit67025404 | 50 |

## คะแนนรายแล็บ — พร้อมเหตุผล
| Lab | % earned | Verdict | เหตุผล |
|---|---|---|---|
| Lab1 | 50 | ⚠️ Partial | `team/` 4 ไฟล์ `Punnawit.md/Kittiphat.md/Nonpawit.md/Sirapat.md` มีครบ 4 sections + PR #49 #50 #51 #52 merged แต่ **Board #17 ไม่มี Lab 1 card ที่ Done** — `item-list 17` มี 19 items เป็น User Stories ทั้งหมด ไม่พบ `Lab 1` |
| Lab2 | 0 | ❌ None | `docs/project-proposal.md` 1471 มีครบ 6 sections (Theme/Name/Persona/Value/MoSCoW/Risks) ✅ + `docs/definition-of-done.md` 542 มี 5 ข้อ ✅ แต่ **Board #17 คอลัมน์ `In Prograss` สะกดผิด** ต้องเป็น `In Progress` + ไม่มี label `theme/priority/size` + ไม่มี DoD link ใน board — ตาม Rubric L2.1 ต้องมี 5 columns ถูกต้อง |
| Lab3 | 50 | ⚠️ Partial | ไฟล์อยู่ **ผิด path** — `personas.md` 404 ต้องอยู่ `docs/requirements/personas.md` แต่ไปอยู่ `personas/Project_holder.md/Skill_holder.md` + `scenarios.md` 404 ไปอยู่ `main_scenario.md` + `user-stories.md` 404 + `non-functional-requirements.md` 404 ไปอยู่ `nfr.md` 45 บรรทัด (4 NFR p95≤2s) — เนื้อหามีแต่ผิดโครงสร้าง 5 ไฟล์ตาม `Lab03` |
| Lab4 | 50 | ⚠️ Partial | `prototypes/sprint1/index.html` **404** ต้องมี root index แต่มีแยกคน 4 prototype `Punnawit_SkillRequire/ Sirapat_Myteam/ Nonpawit_login/ kittiphat_profile_tags` + README ครบ — ขาด `index.html` กลาง |
| Lab5 | 50 | ⚠️ Partial | `docs/architecture/tech_stack.md` **404** ไปอยู่ `adr/001-tech-stack-selection.md` + `c4-context.md` 404 + `c4-container.md` 404 + `diagrams/` มีรูปแต่ไม่มี md + `uml_models.md` เป็น template — ตก C4 detail ตาม `Lab05` |
| Lab6 | 50 | ⚠️ Partial | `Dockerfile` 1417 `node:20-alpine` **3 stages** `deps/builder/runner` + `USER node` + `EXPOSE 3000` ✅ แต่ **ไม่ pin version** (`:20-alpine` ไม่ใช่ `:20.11.0-alpine`) + ไม่มี `.dockerignore` + ไม่มี `docker/README.md` + ไม่มีหลักฐาน `docker push` — เดิม `—` แก้เป็น 50 ตาม Gradebook |
| Lab7 | 50 | ⚠️ Partial | `docs/refactoring-journal.md` 1548 มี Duplicated Code + AI prompt แต่ **ไม่มี Release v0.1.0 tag** — มี PR #61 `add reflect and refactoring-journal` แต่ขาด release ตาม `Lab07` |
| M1 | 50 | ⚠️ Partial | Board #17 19 items Done แต่ไม่ trace ไป Requirements/ADR + ไม่มี Release/Docker — ได้เฉพาะ Code/Docs บางส่วน |

> **Labs+M1 (30.25%) = 12.25** = `Lab1 0.875 + Lab2 0 + Lab3 1.75 + Lab4 1.75 + Lab5 1.75 + Lab6 1.75 + Lab7 1.75 + M1 3.75` — ทุกคนเท่ากัน (งานทีม) — ต่ำเพราะ Lab2 0 + Lab4 ไม่มี index + Lab3/5 ผิด path

Board: https://github.com/orgs/Software-Engineering-Concepts-2026/projects/17 — Repo: https://github.com/Software-Engineering-Concepts-2026/se-sec2-team-12
