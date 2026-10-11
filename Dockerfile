# ==========================================
# Stage 1: ติดตั้ง Dependencies (เตรียมไลบรารี)
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app

# ชี้ไปดึงไฟล์ package.json จากโฟลเดอร์ src/frontend/
COPY src/frontend/package*.json ./
RUN npm install

# ==========================================
# Stage 2: Build โปรเจกต์ (สร้างแอป Next.js)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# ดึง node_modules ที่ติดตั้งเสร็จแล้วจาก Stage 1 มาใช้
COPY --from=deps /app/node_modules ./node_modules

# ดึงโค้ดทั้งหมดจากโฟลเดอร์ src/frontend/ เข้ามาไว้ใน /app
COPY src/frontend/ .

# สั่ง Build โค้ด
RUN npm run build

# ==========================================
# Stage 3: สำหรับนำไปรันจริง (Production Image)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# กำหนด environment เป็น production
ENV NODE_ENV=production

# ก๊อปปี้เฉพาะไฟล์ที่จำเป็นต้องใช้รันจาก Stage 2 มา (เพื่อให้ Image มีขนาดเล็ก)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# เปิดพอร์ต 3000 ตามเกณฑ์ที่ต้องมีคำสั่ง EXPOSE
EXPOSE 3000

# กำหนดให้รันด้วยสิทธิ์ 'node' ซึ่งเป็น User ธรรมดา (ไม่ใช่ root ตามเกณฑ์ความปลอดภัย)
USER node

# คำสั่งเริ่มต้นเมื่อ Container ทำงาน
CMD ["npm", "start"]