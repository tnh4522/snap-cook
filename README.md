# SnapCook AI 🍳📸

SnapCook AI là ứng dụng di động thông minh hỗ trợ người dùng chụp ảnh tủ lạnh hoặc nguyên liệu có sẵn để AI (Google Gemini 3.5 Flash) tự động nhận diện và đề xuất các món ăn thơm ngon, phù hợp kèm hướng dẫn chi tiết từng bước.

---

## 🌟 Tính Năng Chính (Full Features)

1. **Chụp Ảnh & Chọn Ảnh Nguyên Liệu (Camera & Gallery)**:
   - Tích hợp `expo-camera` và `expo-image-picker` mượt mà, hỗ trợ bật/tắt đèn flash, lật camera trước/sau.
   - Trình quét AI hiển thị hoạt ảnh sống động với nút **Cancel** cho phép hủy yêu cầu tức thì khi cần.
   - Nén & tối ưu hóa ảnh tự động với `expo-image-manipulator` trước khi truyền tải, tiết kiệm băng thông và tăng tốc xử lý.

2. **Gợi Ý Món Ăn Thông Minh (AI Recipe Generation)**:
   - Tự động phát hiện danh sách nguyên liệu có trong ảnh (`detected_ingredients`).
   - Tạo ra 3 công thức nấu ăn tối ưu kèm: lượng calo ước tính, thời gian chế biến, độ khó (Dễ/Vừa/Khó) và khẩu phần ăn.
   - Bộ lọc xử lý JSON linh hoạt chống lỗi định dạng từ AI.

3. **Cá Nhân Hóa & Tùy Chọn Khẩu Vị (Preferences)**:
   - **Chế độ ăn (Dietary restrictions)**: Ăn chay (Vegetarian), Thuần chay (Vegan), Không chứa Gluten (Gluten-free), Không sữa động vật (Dairy-free), Ít carb (Low-carb), Giàu đạm (High-protein), Keto, Halal.
   - **Đa ngôn ngữ**: Hỗ trợ tiếng Việt (Tiếng Việt) và tiếng Anh (English).
   - **Khẩu phần ăn (Servings)**: Tùy chỉnh từ 1 đến 12 người, tự động tính toán khối lượng nguyên liệu phù hợp.

4. **Trang Chi Tiết Món Ăn Tương Tác (Interactive Cooking Mode)**:
   - Checklist nguyên liệu chuẩn bị: tích chọn từng nguyên liệu đã sẵn sàng.
   - Tiến độ nấu ăn tương tác: tích hoàn thành từng bước (kèm hiệu ứng gạch ngang), thanh tiến độ trực quan và thông báo hoàn thành món ăn ("Bon appétit!").
   - Nút chia sẻ nguyên liệu và công thức qua ứng dụng khác (`Share` sheet chuẩn hệ điều hành).
   - Nút yêu thích (Favorite) đánh dấu món ăn để tra cứu lại mọi lúc.

5. **Lịch Sử Quét & Bộ Sưu Tập Yêu Thích (History & Favorites)**:
   - Lưu trữ tự động các lần quét ảnh gần nhất trên thiết bị (`AsyncStorage`) kèm ảnh xem trước, danh sách nguyên liệu và thời gian quét.
   - Tab **Favorites** với tính năng tìm kiếm nhanh theo tên món ăn hoặc nguyên liệu.
   - Hỗ trợ xóa từng mục hoặc dọn dẹp toàn bộ dữ liệu.

6. **Bảng Điều Khiển Cài Đặt & Trạng Thái Hệ Thống (Settings & Health)**:
   - Kiểm tra kết nối trực tiếp đến AI Backend (`/health`), kiểm tra cấu hình Gemini API Key và Supabase, đo độ trễ mạng thực tế (ping latency).

---

## 🏗 Cấu Trúc Dự Án

```
snap-cook/
├── app/                      # Expo / React Native Frontend
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx   # Thanh điều hướng 4 tab: Snap, History, Favorites, Settings
│   │   │   ├── index.tsx     # Màn hình chụp ảnh camera & thư viện
│   │   │   ├── history.tsx   # Danh sách lịch sử các lần quét
│   │   │   ├── favorites.tsx # Bộ sưu tập món ăn yêu thích + tìm kiếm
│   │   │   └── settings.tsx  # Cài đặt khẩu vị, ngôn ngữ, khẩu phần & kiểm tra server
│   │   ├── recipe/[id].tsx   # Chi tiết công thức, checklist nguyên liệu & các bước nấu
│   │   ├── recipes.tsx       # Màn hình kết quả danh sách món ăn gợi ý
│   │   └── _layout.tsx       # Root layout bọc Providers & Error Boundary
│   ├── components/           # UI components tái sử dụng
│   ├── context/              # RecipeContext, LibraryContext, ToastContext
│   ├── services/             # API client, Image optimizer, Storage, Supabase
│   ├── utils/                # Hàm tiện ích xử lý định dạng, hash id, date
│   └── package.json
│
└── backend/                  # FastAPI Backend
    ├── services/
    │   ├── ai_service.py     # Tích hợp Google Gemini API, prompt tùy biến & chuẩn hóa JSON
    │   └── supabase_service.py # Lưu dữ liệu lịch sử vào Supabase
    ├── tests/
    │   └── test_api.py       # Bộ kiểm thử tự động (8 tests)
    ├── main.py               # REST API endpoints (/health, /api/v1/generate-recipes)
    ├── models.py             # Pydantic models & validation
    ├── requirements.txt
    └── vercel.json           # Cấu hình triển khai serverless trên Vercel
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Khởi chạy Backend (FastAPI)

```bash
cd backend

# Kích hoạt virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # macOS/Linux

# Cài đặt dependencies (nếu chưa cài)
pip install -r requirements.txt

# Chạy unit tests
python tests/test_api.py

# Khởi chạy server tại http://localhost:8000
python main.py
```

### 2. Khởi chạy Ứng dụng Di động (Expo React Native)

```bash
cd app

# Cài đặt packages
npm install

# Chạy kiểm tra TypeScript và Unit tests
npm run test
npx tsc --noEmit

# Khởi chạy Expo Dev Server
npx expo start
```

---

## 🧪 Kiểm Thử (Testing)

- **Backend Tests**: 8 kịch bản kiểm thử bao phủ chuẩn hóa payload, xử lý code fence, xác thực ảnh không hợp lệ, whitelist chế độ ăn, endpoint API, và health check:
  ```bash
  cd backend
  python tests/test_api.py
  ```
- **Frontend Utility Tests**:
  ```bash
  cd app
  npm run test
  npx tsc --noEmit
  ```
