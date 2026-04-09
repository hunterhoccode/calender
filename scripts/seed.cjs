const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rvdpjrxaxvdbouwichru.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHBqcnhheHZkYm91d2ljaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODk4NzAsImV4cCI6MjA4OTc2NTg3MH0.cJZCUQkPjeuDyILv7M14adE1WGLsE8TB-WJ4NFk7pVU'
);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const today = new Date().toISOString().split('T')[0];

async function seed() {
  // Sign in as admin
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@cmp.local',
    password: 'admin123',
  });
  if (authErr) { console.error('Auth failed:', authErr.message); return; }
  console.log('Signed in as admin');

  // Insert brands
  const brands = [
    { name: 'TechViet', logo: '🚀', color: '#6366f1', description: 'Công ty công nghệ hàng đầu Việt Nam' },
    { name: 'FashionHub', logo: '👗', color: '#ec4899', description: 'Thương hiệu thời trang trẻ trung' },
    { name: 'GreenFood', logo: '🌿', color: '#10b981', description: 'Thực phẩm sạch & hữu cơ' },
  ];

  const { data: brandData, error: brandErr } = await supabase.from('brands').insert(brands).select();
  if (brandErr) { console.error('Brand insert error:', brandErr.message); return; }
  console.log(`Inserted ${brandData.length} brands`);

  const brandMap = {};
  brandData.forEach(b => { brandMap[b.name] = b.id; });

  // Insert campaigns
  const campaigns = [
    {
      name: 'Tết Nguyên Đán 2026',
      category: 'big-campaign',
      brand_id: brandMap['TechViet'],
      start_date: addDays(today, -5),
      end_date: addDays(today, 10),
      key_message: 'Xuân về - Quà trao tay, Vạn điều may mắn đến!',
      budget: '500,000,000 VND',
      channels: ['Facebook', 'Google Ads', 'TikTok', 'Zalo'],
      target_audience: 'Người dùng 18-45 tuổi, khắp cả nước',
      notes: 'Campaign lớn nhất Q1. Cần phối hợp tất cả các phòng ban.',
      details: '## Thể lệ chương trình\n\n1. Giảm **20%** tất cả sản phẩm cho đơn từ **500K**\n2. Tặng voucher **100K** cho đơn từ 1 triệu\n3. **Free shipping** toàn quốc từ 300K\n4. Deal flash sale **50%** mỗi ngày lúc 12h\n\n---\n\n### Điều kiện\n\n- Không áp dụng cùng khuyến mãi khác\n- Giới hạn 1 voucher/khách hàng',
    },
    {
      name: 'Flash Sale 3.3',
      category: 'flash-sale',
      brand_id: brandMap['FashionHub'],
      start_date: addDays(today, 2),
      end_date: addDays(today, 4),
      key_message: 'Giảm sốc 33% - Chỉ 3 ngày duy nhất!',
      budget: '100,000,000 VND',
      channels: ['Facebook', 'TikTok', 'Email'],
      target_audience: 'Khách hàng cũ + Lookalike audience',
      notes: 'Tập trung push ngành Thời trang & Làm đẹp.',
      details: '## Deal Flash Sale 3.3\n\n- Giảm **33%** toàn bộ sản phẩm\n- Combo 2 *mua 1 tặng 1* cho BST mới\n- Mã `FLASH33` giảm thêm **50K**',
    },
    {
      name: 'Content Series: Behind the Brand',
      category: 'social',
      brand_id: brandMap['TechViet'],
      start_date: addDays(today, -3),
      end_date: addDays(today, 18),
      key_message: 'Câu chuyện đằng sau thương hiệu yêu thích của bạn',
      budget: '50,000,000 VND',
      channels: ['Instagram', 'TikTok', 'YouTube'],
      target_audience: 'Gen Z, 18-25 tuổi, yêu thích nội dung sáng tạo',
      notes: '1 video mỗi tuần, tổng cộng 4 tập.',
    },
    {
      name: 'Newsletter: Spring Collection',
      category: 'email',
      brand_id: brandMap['FashionHub'],
      start_date: addDays(today, 7),
      end_date: addDays(today, 9),
      key_message: 'Bộ sưu tập Xuân 2026 đã có mặt!',
      budget: '20,000,000 VND',
      channels: ['Email', 'Website'],
      target_audience: 'Email subscribers, VIP customers',
      notes: 'A/B test subject line. Gửi 3 lần: teaser, launch, reminder.',
    },
    {
      name: 'PR Event: Product Launch',
      category: 'event',
      brand_id: brandMap['GreenFood'],
      start_date: addDays(today, 12),
      end_date: addDays(today, 13),
      key_message: 'Ra mắt sản phẩm đột phá!',
      budget: '200,000,000 VND',
      channels: ['Facebook', 'Instagram', 'YouTube', 'Website'],
      target_audience: 'KOLs, Báo chí, Khách hàng VIP',
      notes: 'Địa điểm: Gem Center, HCM. Cần mời 50 KOLs.',
    },
    {
      name: 'SEO Content Push',
      category: 'content',
      brand_id: brandMap['TechViet'],
      start_date: addDays(today, 1),
      end_date: addDays(today, 22),
      key_message: 'Tăng traffic organic x3 trong Q1',
      budget: '30,000,000 VND',
      channels: ['Website', 'Google Ads'],
      target_audience: 'Người dùng search Google về sản phẩm',
      notes: 'Publish 10 bài blog SEO-optimized.',
    },
    {
      name: 'Mega Sale 15/3',
      category: 'flash-sale',
      brand_id: brandMap['GreenFood'],
      start_date: addDays(today, 8),
      end_date: addDays(today, 11),
      key_message: 'Siêu sale giữa tháng - Giảm đến 50%!',
      budget: '150,000,000 VND',
      channels: ['Facebook', 'TikTok', 'Google Ads', 'Email'],
      target_audience: 'Tất cả khách hàng',
      notes: 'Chú ý: chồng chéo với Newsletter Spring Collection.',
    },
  ];

  const { data: campData, error: campErr } = await supabase.from('campaigns').insert(campaigns).select();
  if (campErr) { console.error('Campaign insert error:', campErr.message); return; }
  console.log(`Inserted ${campData.length} campaigns`);

  // Create campaign name → id map
  const campMap = {};
  campData.forEach(c => { campMap[c.name] = c.id; });

  // Insert milestones
  const milestones = [
    { campaign_id: campMap['Tết Nguyên Đán 2026'], text: 'Kick-off meeting', date: addDays(today, -5), sort_order: 0 },
    { campaign_id: campMap['Tết Nguyên Đán 2026'], text: 'Creative assets ready', date: addDays(today, -2), sort_order: 1 },
    { campaign_id: campMap['Tết Nguyên Đán 2026'], text: 'Launch date', date: today, sort_order: 2 },
    { campaign_id: campMap['Tết Nguyên Đán 2026'], text: 'Mid-campaign review', date: addDays(today, 5), sort_order: 3 },
    { campaign_id: campMap['Flash Sale 3.3'], text: 'Banner design review', date: addDays(today, 1), sort_order: 0 },
    { campaign_id: campMap['Content Series: Behind the Brand'], text: 'Episode 1 publish', date: addDays(today, -3), sort_order: 0 },
    { campaign_id: campMap['Content Series: Behind the Brand'], text: 'Episode 2 publish', date: addDays(today, 4), sort_order: 1 },
    { campaign_id: campMap['Content Series: Behind the Brand'], text: 'Episode 3 publish', date: addDays(today, 11), sort_order: 2 },
    { campaign_id: campMap['Content Series: Behind the Brand'], text: 'Episode 4 publish', date: addDays(today, 18), sort_order: 3 },
    { campaign_id: campMap['PR Event: Product Launch'], text: 'Venue booking confirmed', date: addDays(today, 5), sort_order: 0 },
    { campaign_id: campMap['PR Event: Product Launch'], text: 'KOL invitations sent', date: addDays(today, 8), sort_order: 1 },
    { campaign_id: campMap['PR Event: Product Launch'], text: 'Event day', date: addDays(today, 12), sort_order: 2 },
    { campaign_id: campMap['SEO Content Push'], text: '5 bài đầu tiên publish', date: addDays(today, 10), sort_order: 0 },
    { campaign_id: campMap['SEO Content Push'], text: '10 bài hoàn tất', date: addDays(today, 22), sort_order: 1 },
  ];

  const { error: msErr } = await supabase.from('milestones').insert(milestones);
  if (msErr) { console.error('Milestone insert error:', msErr.message); return; }
  console.log(`Inserted ${milestones.length} milestones`);

  console.log('\nSeed completed successfully!');
}

seed();
