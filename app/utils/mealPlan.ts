import { DietStyle, PlannedDay, PlannedMealItem, WeeklyMealPlan } from '@/types/health';
import { generateId } from '@/utils/recipe';

export function createDefaultWeeklyMealPlan(
  dietStyle: DietStyle = 'eat_clean',
  dailyCalorieTarget: number = 1800,
  lang: 'en' | 'vi' = 'vi'
): WeeklyMealPlan {
  const isVi = lang === 'vi';
  const dayNames = isVi
    ? ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const templates = [
    [
      { name: isVi ? 'Yến mạch sữa hạt & chuối' : 'Oatmeal with almond milk & banana', cal: 400, p: 20, c: 60, f: 9, ing: ['Yến mạch', 'Chuối', 'Sữa hạnh nhân'] },
      { name: isVi ? 'Trứng ốp la & bánh mì nguyên cám' : 'Poached eggs & whole wheat toast', cal: 390, p: 24, c: 40, f: 14, ing: ['Trứng gà', 'Bánh mì đen'] },
      { name: isVi ? 'Smoothie bơ chuối & protein' : 'Avocado banana protein smoothie', cal: 380, p: 25, c: 45, f: 10, ing: ['Bơ', 'Chuối', 'Sữa chua'] },
      { name: isVi ? 'Phở gà ức nước dùng thanh' : 'Clean chicken breast pho', cal: 450, p: 32, c: 56, f: 8, ing: ['Bánh phở', 'Ức gà'] },
      { name: isVi ? 'Khoai lang hấp & trứng luộc' : 'Steamed sweet potato & eggs', cal: 380, p: 20, c: 58, f: 8, ing: ['Khoai lang', 'Trứng'] },
      { name: isVi ? 'Pancake chuối yến mạch' : 'Banana oat pancake', cal: 410, p: 21, c: 55, f: 10, ing: ['Yến mạch', 'Chuối'] },
      { name: isVi ? 'Bún ức gà nấu nấm' : 'Rice vermicelli chicken mushroom soup', cal: 420, p: 30, c: 52, f: 9, ing: ['Bún tươi', 'Ức gà', 'Nấm'] },
    ],
    [
      { name: isVi ? 'Cơm gạo lứt ức gà & súp lơ xanh' : 'Brown rice, grilled chicken & broccoli', cal: 600, p: 48, c: 68, f: 12, ing: ['Gạo lứt', 'Ức gà 150g', 'Bông cải xanh'] },
      { name: isVi ? 'Cá hồi áp chảo & măng tây' : 'Pan-seared salmon & asparagus', cal: 620, p: 42, c: 50, f: 22, ing: ['Cá hồi', 'Măng tây', 'Khoai tây'] },
      { name: isVi ? 'Bò xào ớt chuông & cơm quinoa' : 'Beef stir-fry bell pepper with quinoa', cal: 610, p: 45, c: 62, f: 15, ing: ['Thịt bò', 'Ớt chuông', 'Quinoa'] },
      { name: isVi ? 'Bún chả áp chảo Eat Clean' : 'Clean grilled pork vermicelli', cal: 590, p: 44, c: 65, f: 12, ing: ['Thịt nạc xay', 'Bún tươi', 'Rau thơm'] },
      { name: isVi ? 'Cơm gạo lứt cá thu & rau muống luộc' : 'Brown rice, mackerel & water spinach', cal: 620, p: 40, c: 70, f: 15, ing: ['Cá thu', 'Gạo lứt', 'Rau muống'] },
      { name: isVi ? 'Tôm áp chảo sốt chanh & bí ngòi' : 'Lemon butter shrimp & zucchini with rice', cal: 580, p: 46, c: 64, f: 11, ing: ['Tôm sú', 'Bí ngòi', 'Gạo lứt'] },
      { name: isVi ? 'Đậu hũ sốt nấm xào thịt nạc' : 'Tofu mushroom stir-fry with lean pork', cal: 600, p: 42, c: 68, f: 14, ing: ['Đậu hũ', 'Thịt nạc', 'Nấm rơm'] },
    ],
    [
      { name: isVi ? 'Salad cá ngừ trứng luộc' : 'Tuna & boiled egg garden salad', cal: 490, p: 38, c: 30, f: 18, ing: ['Cá ngừ', 'Xà lách', 'Trứng gà'] },
      { name: isVi ? 'Canh chua cá lóc & rau luộc' : 'Vietnamese sour fish soup & veggies', cal: 480, p: 36, c: 45, f: 12, ing: ['Cá lóc', 'Bạc hà', 'Cà chua'] },
      { name: isVi ? 'Ức gà xé phay bắp cải tím' : 'Shredded chicken purple cabbage salad', cal: 470, p: 40, c: 35, f: 12, ing: ['Ức gà', 'Bắp cải tím'] },
      { name: isVi ? 'Súp bí đỏ thịt bằm nạc' : 'Pumpkin lean pork soup', cal: 460, p: 32, c: 50, f: 12, ing: ['Bí đỏ', 'Thịt băm'] },
      { name: isVi ? 'Bò lúc lắc rau củ nướng' : 'Shaking beef with grilled veggies', cal: 510, p: 42, c: 45, f: 16, ing: ['Thịt bò', 'Hành tây', 'Ớt chuông'] },
      { name: isVi ? 'Canh rong biển đậu hũ thịt bò' : 'Seaweed tofu beef soup', cal: 460, p: 36, c: 32, f: 14, ing: ['Rong biển', 'Đậu hũ', 'Thịt bò'] },
      { name: isVi ? 'Gỏi cuốn tôm thịt nạc' : 'Fresh spring rolls with shrimp & pork', cal: 480, p: 35, c: 52, f: 11, ing: ['Bánh tráng', 'Tôm', 'Thịt nạc'] },
    ],
    [
      { name: isVi ? 'Sữa chua Hy Lạp & hạt chia' : 'Greek yogurt & chia seeds', cal: 170, p: 14, c: 16, f: 5, ing: ['Sữa chua Hy Lạp', 'Hạt chia'] },
      { name: isVi ? 'Táo xanh & bơ đậu phộng' : 'Green apple & peanut butter', cal: 180, p: 5, c: 24, f: 8, ing: ['Táo xanh', 'Bơ đậu phộng'] },
      { name: isVi ? 'Sữa hạt hạnh nhân ấm' : 'Warm almond milk', cal: 150, p: 6, c: 18, f: 6, ing: ['Sữa hạnh nhân'] },
      { name: isVi ? 'Chuối & hạt óc chó' : 'Banana & walnuts', cal: 180, p: 4, c: 26, f: 8, ing: ['Chuối', 'Hạt óc chó'] },
      { name: isVi ? 'Biscotti nguyên cám' : 'Whole grain biscotti', cal: 160, p: 7, c: 22, f: 5, ing: ['Biscotti'] },
      { name: isVi ? '2 quả trứng luộc' : '2 hard boiled eggs', cal: 140, p: 12, c: 2, f: 9, ing: ['Trứng gà'] },
      { name: isVi ? 'Sữa đậu nành không đường' : 'Unsweetened soy milk', cal: 150, p: 12, c: 10, f: 5, ing: ['Sữa đậu nành'] },
    ],
  ];

  const scale = dailyCalorieTarget / 1750;

  const days: PlannedDay[] = dayNames.map((name, i) => {
    const b = templates[0][i];
    const l = templates[1][i];
    const d = templates[2][i];
    const s = templates[3][i];

    const meals: PlannedMealItem[] = [
      {
        id: `pln_${generateId()}`,
        meal_type: 'breakfast',
        food_name: b.name,
        portion_desc: isVi ? '1 phần chuẩn' : '1 serving',
        calories: Math.round(b.cal * scale),
        protein_g: Math.round(b.p * scale * 10) / 10,
        carbs_g: Math.round(b.c * scale * 10) / 10,
        fat_g: Math.round(b.f * scale * 10) / 10,
        cooking_tip: isVi ? 'Chuẩn bị nhanh dưới 15 phút' : 'Quick prep under 15 mins',
        ingredients: b.ing,
        isEaten: false,
      },
      {
        id: `pln_${generateId()}`,
        meal_type: 'lunch',
        food_name: l.name,
        portion_desc: isVi ? '1 đĩa dinh dưỡng' : '1 balanced plate',
        calories: Math.round(l.cal * scale),
        protein_g: Math.round(l.p * scale * 10) / 10,
        carbs_g: Math.round(l.c * scale * 10) / 10,
        fat_g: Math.round(l.f * scale * 10) / 10,
        cooking_tip: isVi ? 'Ưu tiên áp chảo hoặc luộc hấp' : 'Steam or pan sear lightly',
        ingredients: l.ing,
        isEaten: false,
      },
      {
        id: `pln_${generateId()}`,
        meal_type: 'dinner',
        food_name: d.name,
        portion_desc: isVi ? '1 phần nhẹ bụng' : '1 light portion',
        calories: Math.round(d.cal * scale),
        protein_g: Math.round(d.p * scale * 10) / 10,
        carbs_g: Math.round(d.c * scale * 10) / 10,
        fat_g: Math.round(d.f * scale * 10) / 10,
        cooking_tip: isVi ? 'Ăn trước 19:30' : 'Eat before 7:30 PM',
        ingredients: d.ing,
        isEaten: false,
      },
      {
        id: `pln_${generateId()}`,
        meal_type: 'snack',
        food_name: s.name,
        portion_desc: isVi ? 'Bữa phụ' : 'Snack',
        calories: Math.round(s.cal * scale),
        protein_g: Math.round(s.p * scale * 10) / 10,
        carbs_g: Math.round(s.c * scale * 10) / 10,
        fat_g: Math.round(s.f * scale * 10) / 10,
        ingredients: s.ing,
        isEaten: false,
      },
    ];

    return {
      day_index: i + 1,
      day_name: name,
      meals,
      total_calories: meals.reduce((acc, m) => acc + m.calories, 0),
      total_protein_g: Math.round(meals.reduce((acc, m) => acc + m.protein_g, 0) * 10) / 10,
      total_carbs_g: Math.round(meals.reduce((acc, m) => acc + m.carbs_g, 0) * 10) / 10,
      total_fat_g: Math.round(meals.reduce((acc, m) => acc + m.fat_g, 0) * 10) / 10,
    };
  });

  const groceryList = isVi
    ? [
        'Ức gà tươi (1.2kg)',
        'Gạo lứt hoa sữa (1kg)',
        'Trứng gà tươi (1 vỉ 10 quả)',
        'Yến mạch cán dẹt (500g)',
        'Phi lê cá hồi / cá thu (500g)',
        'Bông cải xanh, măng tây, bí ngòi',
        'Xà lách, cà chua, dưa leo',
        'Chuối, táo xanh',
        'Sữa chua không đường & sữa hạt',
      ]
    : [
        'Fresh chicken breast (1.2kg)',
        'Brown rice (1kg)',
        'Eggs (10 pack)',
        'Rolled oats (500g)',
        'Salmon / white fish fillets (500g)',
        'Broccoli, asparagus, zucchini',
        'Salad greens, tomatoes, cucumber',
        'Bananas, green apples',
        'Greek yogurt & almond milk',
      ];

  return {
    id: `wp_${generateId()}`,
    createdAt: Date.now(),
    diet_style: dietStyle,
    daily_calorie_target: dailyCalorieTarget,
    days,
    grocery_list: groceryList,
  };
}
