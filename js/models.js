/**
 * THANH VŨ MEDIC CS3 - DATA MODELS & MULTI-DEPARTMENT ARCHITECTURE
 * Cấu trúc thực thể hỗ trợ mở rộng không giới hạn phòng ban (Multi-tenant ready)
 * Hỗ trợ phân cấp 4 nhóm quyền (RBAC) & Cơ cấu Phòng ban - Bộ phận con (Teams)
 */

export const ROLES = {
  LEADERSHIP: { key: 'LEADERSHIP', name: 'Ban Lãnh Đạo', badge: 'Ban Lãnh Đạo', level: 1 },
  MANAGER: { key: 'MANAGER', name: 'Trưởng Phòng', badge: 'Trưởng Phòng', level: 2 },
  DEPUTY_MANAGER: { key: 'DEPUTY_MANAGER', name: 'Phó Phòng', badge: 'Phó Phòng', level: 2 },
  MEMBER: { key: 'MEMBER', name: 'Nhân Viên / Chuyên Viên', badge: 'Chuyên Viên', level: 3 }
};

export const DEPARTMENTS = [
  {
    id: 'dept_ptkh',
    name: 'Phòng Phát Triển Khách Hàng',
    code: 'PTKH-CS3',
    unit: 'Cơ Sở 3 (Cà Mau)',
    managerId: 'user_tam_ptkh', // Huỳnh Trường Thanh Tâm
    description: 'Chăm sóc khách hàng, khám sức khỏe doanh nghiệp, marketing và phát triển thị trường y tế',
    badge: 'PTKH',
    color: '#D6A52A', // Primary Gold Stitch
    teams: [
      { id: 'team_mkt', name: 'Marketing & Truyền Thông', code: 'MKT' },
      { id: 'team_cskh', name: 'Chăm Sóc Khách Hàng (CSKH)', code: 'CSKH' },
      { id: 'team_hotro', name: 'Hỗ Trợ & Tiếp Đón', code: 'HOTRO' }
    ]
  },
  {
    id: 'dept_duoc',
    name: 'Kho Dược & Vật Tư Y Tế',
    code: 'DUOC-CS3',
    unit: 'Cơ Sở 3 (Cà Mau)',
    managerId: 'user_minh_duoc',
    description: 'Quản lý kho thuốc GSP, kho lạnh vaccine và cung ứng vật tư tiêu hao',
    badge: 'DƯỢC',
    color: '#0D9488',
    teams: [
      { id: 'team_duoc_gsp', name: 'Kho Thuốc GSP', code: 'GSP' },
      { id: 'team_duoc_vaccine', name: 'Kho Lạnh Vaccine', code: 'VAC' },
      { id: 'team_duoc_vtyt', name: 'Vật Tư Y Tế Tiêu Hao', code: 'VTYT' }
    ]
  },
  {
    id: 'dept_qlda',
    name: 'Ban QLDA & Thi Công Cải Tạo',
    code: 'QLDA-SVH',
    unit: 'Công trường SVH & STN',
    managerId: 'user_nghia_qlda',
    description: 'Giám sát thi công, bàn giao vật tư 4 bên và quản lý tiến độ 4 tháng',
    badge: 'QLDA',
    color: '#2563EB',
    teams: [
      { id: 'team_qlda_thicong', name: 'Tổ Thi Công Xây Dựng', code: 'TC' },
      { id: 'team_qlda_giamsat', name: 'Tổ Giám Sát Kỹ Thuật', code: 'GS' }
    ]
  }
];

export const USERS = [
  // 1. ADMIN TOÀN HỆ THỐNG (ĐẶC QUYỀN QUẢN TRỊ VIÊN)
  {
    id: 'user_admin',
    username: 'admin',
    password: '123',
    name: 'Quản Trị Viên Hệ Thống',
    role: 'MANAGER',
    isAdmin: true,
    departmentId: 'all',
    teamId: 'all',
    title: 'Quản Trị Viên Cấp Cao',
    unit: 'Phòng CNTT & Quản Trị Hệ Thống',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    badge: 'Admin Hệ Thống',
    phone: '0913 888 999',
    email: 'admin@thanhvumedic.vn',
    dob: '1980-01-01',
    hometown: 'Cà Mau'
  },
  // 2. BAN LÃNH ĐẠO (Toàn quyền giám sát các phòng ban)
  {
    id: 'user_lanhdao',
    username: 'lanhdao',
    password: '123',
    name: 'ThS.BS Nguyễn Thanh Vũ',
    role: 'LEADERSHIP',
    departmentId: 'all',
    teamId: 'all',
    title: 'Chủ Tịch HĐQT / Ban Lãnh Đạo',
    unit: 'Ban Lãnh Đạo CS3',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
    badge: 'Ban Lãnh Đạo',
    phone: '0913 777 888',
    email: 'lanhdao@thanhvumedic.vn',
    dob: '1975-10-15',
    hometown: 'Cà Mau'
  },
  // 3. TRƯỞNG PHÒNG PTKH: Huỳnh Trường Thanh Tâm (Quản lý toàn bộ MKT / CSKH / Hỗ trợ)
  {
    id: 'user_tam_ptkh',
    username: 'thanhtam',
    password: '123',
    name: 'Huỳnh Trường Thanh Tâm',
    role: 'MANAGER',
    departmentId: 'dept_ptkh',
    teamId: 'all', // Quản lý toàn bộ các bộ phận con của phòng PTKH
    title: 'Trưởng phòng Phát Triển Khách Hàng',
    unit: 'Phòng Phát Triển Khách Hàng • CS3',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80',
    badge: 'Trưởng phòng',
    phone: '0945 112 233',
    email: 'thanhtam.ptkh@thanhvumedic.vn',
    dob: '1986-06-20',
    hometown: 'Cà Mau'
  },
  // 4. NHÂN VIÊN PHÒNG PTKH - BỘ PHẬN CSKH
  {
    id: 'user_mai_ptkh',
    username: 'tuyetmai',
    password: '123',
    name: 'CN. Nguyễn Thị Tuyết Mai',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_cskh',
    title: 'Chuyên viên CSKH & Tiếp Nhận',
    unit: 'Bộ phận CSKH • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên CSKH',
    phone: '0918 445 566',
    email: 'mai.ntt@thanhvumedic.vn',
    dob: '1992-04-15',
    hometown: 'Bạc Liêu'
  },
  // 5. NHÂN VIÊN PHÒNG PTKH - BỘ PHẬN MARKETING
  {
    id: 'user_nam_ptkh',
    username: 'hoangnam',
    password: '123',
    name: 'ThS. Lê Hoàng Nam',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_mkt',
    title: 'Chuyên viên Marketing & Truyền Thông',
    unit: 'Bộ phận Marketing • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên MKT',
    phone: '0909 778 899',
    email: 'nam.lh@thanhvumedic.vn',
    dob: '1990-11-30',
    hometown: 'Cần Thơ'
  },
  // 6. NHÂN VIÊN PHÒNG PTKH - BỘ PHẬN HỖ TRỢ
  {
    id: 'user_khang_ptkh',
    username: 'minhkhang',
    password: '123',
    name: 'CN. Trần Minh Khang',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_hotro',
    title: 'Chuyên viên Hỗ Trợ & Hướng Dẫn Khách',
    unit: 'Bộ phận Hỗ Trợ • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên Hỗ Trợ',
    phone: '0939 123 789',
    email: 'khang.tm@thanhvumedic.vn',
    dob: '1994-08-10',
    hometown: 'Cà Mau'
  },
  // 7. TRƯỞNG PHÒNG DƯỢC
  {
    id: 'user_minh_duoc',
    username: 'minhhn',
    password: '123',
    name: 'DS.CKI Nguyễn Văn Minh',
    role: 'MANAGER',
    departmentId: 'dept_duoc',
    teamId: 'all',
    title: 'Trưởng Kho Dược CS3',
    unit: 'Kho Dược & VTYT • CS3',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
    badge: 'Trưởng phòng',
    phone: '0933 667 788',
    email: 'minh.duoc@thanhvumedic.vn',
    dob: '1982-08-12',
    hometown: 'Cà Mau'
  },
  // 8. CHỈ HUY TRƯỞNG QLDA
  {
    id: 'user_nghia_qlda',
    username: 'nghiath',
    password: '123',
    name: 'KS. Trương Hữu Nghĩa',
    role: 'MANAGER',
    departmentId: 'dept_qlda',
    teamId: 'all',
    title: 'Chỉ Huy Trưởng Ban QLDA',
    unit: 'Ban QLDA Cải Tạo SVH-STN',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    badge: 'Chỉ huy trưởng',
    phone: '0977 123 456',
    email: 'nghia.kpd@thanhvumedic.vn',
    dob: '1988-03-25',
    hometown: 'TP. Hồ Chí Minh'
  }
];

export const INITIAL_TASKS = [
  // --- CÔNG VIỆC PHÒNG PHÁT TRIỂN KHÁCH HÀNG (dept_ptkh) ---
  {
    id: 'PTKH-101',
    departmentId: 'dept_ptkh',
    teamId: 'team_cskh',
    title: 'Chuẩn bị tài liệu & báo cáo tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau',
    description: 'Tổng hợp số liệu khám chữa bệnh BHYT, quy trình đón tiếp bệnh nhân VIP tại CS3 và hồ sơ đánh giá chất lượng dịch vụ trước 14:00 tại Hội trường B.',
    priority: 'P1', // P1: Khẩn, P2: Quan trọng, P3: Tiêu chuẩn
    status: 'in_progress', // in_progress | pending_approval | completed
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-06T15:00:00.000Z',
    category: 'Báo cáo & Kiểm tra',
    checklist: [
      { id: 'chk_1', text: 'In ấn 15 bộ tài liệu thuyết minh cơ sở vật chất CS3', done: true },
      { id: 'chk_2', text: 'Kiểm tra máy chiếu, âm thanh và bảng đón tại Hội trường B', done: true },
      { id: 'chk_3', text: 'Rà soát danh sách nhân sự trực lễ tân và đón tiếp VIP', done: false },
      { id: 'chk_4', text: 'Trình ký Giám đốc duyệt slide tổng kết trước giờ họp', done: false }
    ],
    comments: [
      { id: 'cmt_1', userId: 'user_tam_ptkh', text: 'Đã bổ sung thêm bảng đối chiếu khám sức khỏe đoàn doanh nghiệp tháng 10.', time: '08:45' }
    ],
    progress: 50,
    cost: 2500000,
    createdAt: '2026-11-05T07:30:00.000Z',
    updatedAt: '2026-11-06T08:45:00.000Z'
  },
  {
    id: 'PTKH-102',
    departmentId: 'dept_ptkh',
    teamId: 'team_cskh',
    title: 'Đàm phán hợp đồng khám sức khỏe định kỳ Cty Thủy Sản Minh Phú (1.200 CBCNV)',
    description: 'Khảo sát nhu cầu khám lưu động tại Nhà máy Chế biến Thủy sản Giá Rai. Đóng gói bảng giá ưu đãi xét nghiệm sinh hóa và chụp X-Quang phổi kỹ thuật số.',
    priority: 'P2',
    status: 'pending_approval',
    requiresApproval: true,
    approvalStatus: 'PENDING',
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_mai_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-08T17:00:00.000Z',
    category: 'Khám Đoàn Doanh Nghiệp',
    checklist: [
      { id: 'chk_201', text: 'Lập báo giá gói khám tiêu chuẩn & nâng cao', done: true },
      { id: 'chk_202', text: 'Lên lịch điều động xe khám lưu động và kỹ thuật viên', done: true },
      { id: 'chk_203', text: 'Soạn thảo hợp đồng nguyên tắc bảo lãnh thanh toán', done: true }
    ],
    comments: [
      { id: 'cmt_201', userId: 'user_mai_ptkh', text: 'Em đã chốt được thời gian khám đợt 1 vào ngày 12/11 tới, gửi Trưởng phòng phê duyệt ạ!', time: '10:15' }
    ],
    progress: 100,
    cost: 180000000,
    createdAt: '2026-11-04T09:00:00.000Z',
    updatedAt: '2026-11-06T10:15:00.000Z'
  },
  {
    id: 'PTKH-103',
    departmentId: 'dept_ptkh',
    teamId: 'team_mkt',
    title: 'Ký kết hợp tác bảo lãnh viện phí trực tiếp Bảo hiểm Bảo Việt & PVI CS3',
    description: 'Thống nhất quy trình cà thẻ bảo lãnh nội trú/ngoại trú không dùng tiền mặt qua cổng kết nối điện tử Bệnh viện Thanh Vũ Medic.',
    priority: 'P2',
    status: 'in_progress',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-10T11:30:00.000Z',
    category: 'Bảo Hiểm Y Tế',
    checklist: [
      { id: 'chk_301', text: 'Tích hợp kết nối API cổng tra cứu quyền lợi chủ thẻ', done: true },
      { id: 'chk_302', text: 'Tập huấn quy trình tiếp đón bảo lãnh cho nhân viên thu ngân CS3', done: false }
    ],
    comments: [],
    progress: 50,
    cost: 0,
    createdAt: '2026-11-03T08:00:00.000Z',
    updatedAt: '2026-11-05T14:20:00.000Z'
  },
  {
    id: 'PTKH-104',
    departmentId: 'dept_ptkh',
    teamId: 'team_mkt',
    title: 'Chiến dịch truyền thông Gói Tầm Soát Đột Quỵ & Tim Mạch Sớm Tháng 11',
    description: 'Triển khai bảng standee, tờ rơi tại sảnh tầng trệt CS3 và chạy chiến dịch tiếp cận trên Zalo OA bệnh viện.',
    priority: 'P3',
    status: 'completed',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-04T17:00:00.000Z',
    category: 'Marketing & Dịch Vụ',
    checklist: [
      { id: 'chk_401', text: 'Thiết kế ấn phẩm chuẩn nhận diện Thanh Vũ Medic', done: true },
      { id: 'chk_402', text: 'In ấn 2.000 tờ gấp và 5 standee đặt tại các khoa khám', done: true }
    ],
    comments: [
      { id: 'cmt_401', userId: 'user_tam_ptkh', text: 'Chiến dịch chạy rất tốt, lượng bệnh nhân đăng ký gói tăng 35%.', time: '16:00' }
    ],
    progress: 100,
    cost: 12000000,
    createdAt: '2026-10-28T08:00:00.000Z',
    updatedAt: '2026-11-04T16:00:00.000Z'
  },

  // --- CÔNG VIỆC KHOA DƯỢC & VẬT TƯ Y TẾ (dept_duoc) ---
  {
    id: 'DUOC-201',
    departmentId: 'dept_duoc',
    teamId: 'team_duoc_vaccine',
    title: 'Kiểm kê định kỳ & thẩm định nhiệt độ kho lạnh bảo quản Vaccine GSP',
    description: 'Xuất dữ liệu biểu đồ cảm biến nhiệt độ tự động (2-8 độ C) 30 ngày qua và đối soát tồn kho thực tế tại CS3.',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_minh_duoc',
    creatorId: 'user_minh_duoc',
    approverId: 'user_admin',
    dueDate: '2026-11-07T16:00:00.000Z',
    category: 'GSP & Kho Lạnh',
    checklist: [
      { id: 'chk_501', text: 'Kiểm tra pin dự phòng máy ghi nhiệt ẩm tự động Testo', done: true },
      { id: 'chk_502', text: 'Đối chiếu số lô hạn dùng 45 danh mục vaccine tiêm chủng', done: false }
    ],
    comments: [],
    progress: 50,
    cost: 0,
    createdAt: '2026-11-05T08:00:00.000Z',
    updatedAt: '2026-11-06T09:00:00.000Z'
  },

  // --- CÔNG VIỆC BAN QLDA CẢI TẠO (dept_qlda) ---
  {
    id: 'QLDA-301',
    departmentId: 'dept_qlda',
    teamId: 'team_qlda_giamsat',
    title: 'Nghiệm thu bàn giao hệ thống ống cấp gió tươi áp lực âm Phòng Mổ CS3',
    description: 'Đo kiểm tốc độ gió, độ sạch hạt bụi HEPA Filter phòng mổ số 1 & 2 trước khi đưa vào vận hành phẫu thuật.',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_nghia_qlda',
    creatorId: 'user_nghia_qlda',
    approverId: 'user_admin',
    dueDate: '2026-11-09T17:00:00.000Z',
    category: 'Kỹ Thuật Công Trình',
    checklist: [
      { id: 'chk_601', text: 'Chạy thử nghiệm liên tục 72 giờ không tải', done: true },
      { id: 'chk_602', text: 'Lập biên bản nghiệm thu kỹ thuật 4 bên', done: false }
    ],
    comments: [],
    progress: 60,
    cost: 45000000,
    createdAt: '2026-11-02T08:00:00.000Z',
    updatedAt: '2026-11-06T07:15:00.000Z'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_init_1',
    recipientId: 'user_tam_ptkh',
    senderId: 'user_lanhdao',
    type: 'task_assigned',
    title: '📋 Phân công công việc mới',
    content: 'ThS.BS Nguyễn Thanh Vũ đã giao việc "Chuẩn bị tài liệu & báo cáo tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau" cho bạn.',
    taskId: 'PTKH-101',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif_init_2',
    recipientId: 'user_tam_ptkh',
    senderId: 'user_mai_ptkh',
    type: 'approval_request',
    title: '⏳ Đề xuất cần phê duyệt',
    content: 'CN. Nguyễn Thị Tuyết Mai đã gửi đề xuất phê duyệt hợp đồng khám Minh Phú (1.200 CBCNV).',
    taskId: 'PTKH-102',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'notif_init_3',
    recipientId: 'user_mai_ptkh',
    senderId: 'user_tam_ptkh',
    type: 'task_assigned',
    title: '📋 Phân công công việc mới',
    content: 'Huỳnh Trường Thanh Tâm đã phân công nhiệm vụ "Khám sức khỏe Minh Phú" cho bạn.',
    taskId: 'PTKH-102',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'notif_init_4',
    recipientId: 'user_lanhdao',
    senderId: 'user_tam_ptkh',
    type: 'approval_request',
    title: '🏛️ Báo cáo trình Ban Lãnh Đạo phê duyệt',
    content: 'Phòng PTKH trình ký duyệt slide tổng kết và kế hoạch tiếp đoàn Sở Y Tế.',
    taskId: 'PTKH-101',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'notif_init_5',
    recipientId: 'user_lanhdao',
    senderId: 'user_minh_duoc',
    type: 'approval_request',
    title: '⏳ Kế hoạch chiến lược chờ phê duyệt',
    content: 'DS.CKI Nguyễn Văn Minh đã trình kế hoạch "Nâng Cấp Hệ Thống Giám Sát Nhiệt Độ Tự Động Kho Lạnh Vaccine" (PLN-03) xin chủ trương.',
    taskId: 'PLAN-DUOC-01',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif_init_6',
    recipientId: 'user_admin',
    senderId: 'user_mai_ptkh',
    type: 'approval_request',
    title: '⏳ Hồ sơ nghiệm thu hợp đồng cần phê duyệt',
    content: 'CN. Nguyễn Thị Tuyết Mai đã gửi đề xuất phê duyệt nghiệm thu hợp đồng khám đoàn Minh Phú (1.200 CBCNV).',
    taskId: 'PTKH-102',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

export const PLAN_STATUSES = {
  draft: { key: 'draft', label: 'Ý Tưởng / Nháp', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'lightbulb' },
  planning: { key: 'planning', label: 'Đang Lập Kế Hoạch', color: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold', icon: 'edit_note' },
  pending_approval: { key: 'pending_approval', label: 'Chờ Duyệt', color: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold', icon: 'hourglass_top' },
  in_progress: { key: 'in_progress', label: 'Đang Triển Khai', color: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold', icon: 'rocket_launch' },
  completed: { key: 'completed', label: 'Hoàn Tất', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', icon: 'task_alt' }
};

export const INITIAL_PLANS = [
  {
    id: 'PLAN-PTKH-01',
    code: 'PLN-01',
    title: 'Chiến Dịch Khám Sức Khỏe Định Kỳ Doanh Nghiệp Quý 1/2027',
    departmentId: 'dept_ptkh',
    creatorId: 'user_khanh_ptkh',
    leadId: 'user_tam_ptkh',
    status: 'in_progress',
    priority: 'P1',
    startDate: '2026-11-15',
    dueDate: '2027-01-31',
    target: 'Tiếp cận tối thiểu 25 doanh nghiệp, ký hợp đồng khám lưu động cho 1.500 cán bộ nhân viên tại khu vực Cà Mau và Bạc Liêu.',
    notes: 'Phối hợp với Tổ Lưu động Khoa Khám bệnh chuẩn bị 2 máy siêu âm xách tay và 1 xe X-Quang kỹ thuật số. Kiểm tra danh mục vật tư lấy máu từ Kho Dược trước ngày triển khai 3 ngày.',
    links: [
      { title: 'Kế hoạch chi tiết & Phân bổ nhân sự (Google Docs)', url: 'https://docs.google.com' },
      { title: 'Danh sách doanh nghiệp mục tiêu (Google Sheets)', url: 'https://sheets.google.com' }
    ],
    milestones: [
      { id: 'ms_1', title: 'Hoàn thiện hồ sơ năng lực & bảng giá ưu đãi', dueDate: '2026-11-30', completed: true },
      { id: 'ms_2', title: 'Gửi thư ngỏ & tiếp cận 25 doanh nghiệp', dueDate: '2026-12-15', completed: true },
      { id: 'ms_3', title: 'Khảo sát thực địa địa điểm khám lưu động', dueDate: '2026-12-30', completed: false },
      { id: 'ms_4', title: 'Tiến hành khám thực tế & trả hồ sơ bệnh án', dueDate: '2027-01-25', completed: false }
    ],
    tasksList: [
      { title: 'Soạn thảo bảng báo giá gói khám VIP và phổ thông', assigneeId: 'user_khanh_ptkh', dueDate: '2026-11-20', priority: 'P1', converted: true, taskId: 'TSK-PTKH-01' },
      { title: 'In ấn 500 tập hồ sơ năng lực phòng khám Cơ Sở 3', assigneeId: 'user_nguyen_mkt', dueDate: '2026-11-28', priority: 'P2', converted: false },
      { title: 'Lập danh sách điều dưỡng lấy máu lưu động', assigneeId: 'user_mai_ptkh', dueDate: '2026-12-10', priority: 'P2', converted: false }
    ],
    comments: [
      { id: 'cmt_1', userId: 'user_khanh_ptkh', userName: 'Lê Duy Khánh', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80', text: 'Em đã lên khung kế hoạch ban đầu, anh Tâm xem qua phần phân bổ mốc thời gian nhé.', createdAt: '2026-11-08T09:00:00.000Z' },
      { id: 'cmt_2', userId: 'user_tam_ptkh', userName: 'Huỳnh Trường Thanh Tâm', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80', text: 'Đồng ý với các mốc tiến độ. Anh duyệt để triển khai tiếp cận các doanh nghiệp ngay trong tuần này.', createdAt: '2026-11-09T14:15:00.000Z' }
    ],
    createdAt: '2026-11-08T08:30:00.000Z',
    updatedAt: '2026-11-09T14:15:00.000Z'
  },
  {
    id: 'PLAN-PTKH-02',
    code: 'PLN-02',
    title: 'Xây Dựng Cổng Tiếp Nhận & Khảo Sát Hài Lòng Bệnh Nhân Điện Tử',
    departmentId: 'dept_ptkh',
    creatorId: 'user_tam_ptkh',
    leadId: 'user_khanh_ptkh',
    status: 'planning',
    priority: 'P2',
    startDate: '2026-11-20',
    dueDate: '2026-12-31',
    target: 'Chuyển đổi 100% phiếu khảo sát giấy sang mã QR tại sảnh chờ và phòng khám chuyên khoa, tự động tổng hợp báo cáo hài lòng hàng tuần.',
    notes: 'Thiết kế standee đặt tại quầy tiếp đón CS3. Có tặng voucher giảm giá 10% gói tầm soát cho bệnh nhân hoàn thành khảo sát.',
    links: [
      { title: 'Mẫu câu hỏi khảo sát ý kiến (Google Forms)', url: 'https://forms.google.com' }
    ],
    milestones: [
      { id: 'ms_2_1', title: 'Xây dựng bộ câu hỏi chuẩn theo tiêu chí Bộ Y Tế', dueDate: '2026-11-25', completed: true },
      { id: 'ms_2_2', title: 'Tạo mã QR và in ấn 10 standee để bàn', dueDate: '2026-12-05', completed: false },
      { id: 'ms_2_3', title: 'Tập huấn nhân viên tiếp đón hướng dẫn người bệnh', dueDate: '2026-12-15', completed: false }
    ],
    tasksList: [
      { title: 'Thiết kế mẫu standee QR Code khảo sát hài lòng', assigneeId: 'user_nguyen_mkt', dueDate: '2026-12-01', priority: 'P2', converted: false },
      { title: 'Tạo biểu mẫu Google Forms & kết nối Google Sheets', assigneeId: 'user_khanh_ptkh', dueDate: '2026-11-28', priority: 'P2', converted: false }
    ],
    comments: [
      { id: 'cmt_3', userId: 'user_tam_ptkh', userName: 'Huỳnh Trường Thanh Tâm', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80', text: 'Kế hoạch này rất thiết thực để cải thiện dịch vụ chăm sóc khách hàng.', createdAt: '2026-11-10T07:45:00.000Z' }
    ],
    createdAt: '2026-11-10T07:30:00.000Z',
    updatedAt: '2026-11-10T07:45:00.000Z'
  },
  {
    id: 'PLAN-DUOC-01',
    code: 'PLN-03',
    title: 'Nâng Cấp Hệ Thống Giám Sát Nhiệt Độ Tự Động Kho Lạnh Vaccine',
    departmentId: 'dept_duoc',
    creatorId: 'user_minh_duoc',
    leadId: 'user_minh_duoc',
    status: 'pending_approval',
    priority: 'P1',
    startDate: '2026-11-25',
    dueDate: '2026-12-25',
    target: 'Lắp đặt cảm biến IoT cảnh báo nhiệt độ tức thì qua SMS/Zalo khi kho lạnh vaccine vượt ngưỡng 2°C - 8°C.',
    notes: 'Trình Ban Giám Đốc phê duyệt chủ trương và chọn nhà thầu cung cấp thiết bị cảm biến đạt chuẩn GSP.',
    links: [],
    milestones: [
      { id: 'ms_3_1', title: 'Thu thập báo giá 3 nhà cung cấp thiết bị IoT', dueDate: '2026-11-30', completed: true },
      { id: 'ms_3_2', title: 'Trình ký Ban Lãnh Đạo duyệt phương án', dueDate: '2026-12-05', completed: false }
    ],
    tasksList: [],
    comments: [],
    createdAt: '2026-11-09T16:00:00.000Z',
    updatedAt: '2026-11-09T16:00:00.000Z'
  }
];


