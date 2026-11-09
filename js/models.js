/**
 * THANH VU MEDIC CS3 - DATA MODELS & MULTI-DEPARTMENT ARCHITECTURE
 * C?u trúc th?c th? h? tr? m? r?ng không gi?i h?n phòng ban (Multi-tenant ready)
 * H? tr? phân c?p 4 nhóm quy?n (RBAC) & Co c?u Phòng ban - B? ph?n con (Teams)
 */

export const ROLES = {
  ADMIN: { key: 'ADMIN', name: 'Qu?n Tr? Viên (Admin)', badge: 'Admin H? Th?ng', level: 1 },
  LEADERSHIP: { key: 'LEADERSHIP', name: 'Ban Lãnh Ð?o', badge: 'Ban Lãnh Ð?o', level: 2 },
  MANAGER: { key: 'MANAGER', name: 'Tru?ng Phòng', badge: 'Tru?ng Phòng', level: 3 },
  DEPUTY_MANAGER: { key: 'DEPUTY_MANAGER', name: 'Phó Tru?ng Phòng', badge: 'Phó Phòng', level: 3 },
  MEMBER: { key: 'MEMBER', name: 'Nhân Viên / Chuyên Viên', badge: 'Chuyên Viên', level: 4 }
};

export const DEPARTMENTS = [
  {
    id: 'dept_ptkh',
    name: 'Phòng Phát Tri?n Khách Hàng',
    code: 'PTKH-CS3',
    unit: 'Co S? 3 (Cà Mau)',
    managerId: 'user_tam_ptkh', // Hu?nh Tru?ng Thanh Tâm
    description: 'Cham sóc khách hàng, khám s?c kh?e doanh nghi?p, marketing và phát tri?n th? tru?ng y t?',
    badge: 'PTKH',
    color: '#D6A52A', // Primary Gold Stitch
    teams: [
      { id: 'team_mkt', name: 'Marketing & Truy?n Thông', code: 'MKT' },
      { id: 'team_cskh', name: 'Cham Sóc Khách Hàng (CSKH)', code: 'CSKH' },
      { id: 'team_hotro', name: 'H? Tr? & Ti?p Ðón', code: 'HOTRO' }
    ]
  },
  {
    id: 'dept_duoc',
    name: 'Kho Du?c & V?t Tu Y T?',
    code: 'DUOC-CS3',
    unit: 'Co S? 3 (Cà Mau)',
    managerId: 'user_minh_duoc',
    description: 'Qu?n lý kho thu?c GSP, kho l?nh vaccine và cung ?ng v?t tu tiêu hao',
    badge: 'DU?C',
    color: '#0D9488',
    teams: [
      { id: 'team_duoc_gsp', name: 'Kho Thu?c GSP', code: 'GSP' },
      { id: 'team_duoc_vaccine', name: 'Kho L?nh Vaccine', code: 'VAC' },
      { id: 'team_duoc_vtyt', name: 'V?t Tu Y T? Tiêu Hao', code: 'VTYT' }
    ]
  },
  {
    id: 'dept_qlda',
    name: 'Ban QLDA & Thi Công C?i T?o',
    code: 'QLDA-SVH',
    unit: 'Công tru?ng SVH & STN',
    managerId: 'user_nghia_qlda',
    description: 'Giám sát thi công, bàn giao v?t tu 4 bên và qu?n lý ti?n d? 4 tháng',
    badge: 'QLDA',
    color: '#2563EB',
    teams: [
      { id: 'team_qlda_thicong', name: 'T? Thi Công Xây D?ng', code: 'TC' },
      { id: 'team_qlda_giamsat', name: 'T? Giám Sát K? Thu?t', code: 'GS' }
    ]
  }
];

export const USERS = [
  // 1. ADMIN TOÀN H? TH?NG
  {
    id: 'user_admin',
    username: 'admin',
    password: '123',
    name: 'Qu?n Tr? Viên H? Th?ng',
    role: 'ADMIN',
    departmentId: 'all',
    teamId: 'all',
    title: 'Qu?n Tr? Viên C?p Cao',
    unit: 'Phòng CNTT & Qu?n Tr? H? Th?ng',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    badge: 'Admin H? Th?ng',
    phone: '0913 888 999',
    email: 'admin@thanhvumedic.vn',
    dob: '1980-01-01',
    hometown: 'Cà Mau'
  },
  // 2. BAN LÃNH Ð?O (Toàn quy?n giám sát các phòng ban)
  {
    id: 'user_lanhdao',
    username: 'lanhdao',
    password: '123',
    name: 'ThS.BS Nguy?n Thanh Vu',
    role: 'LEADERSHIP',
    departmentId: 'all',
    teamId: 'all',
    title: 'Ch? T?ch HÐQT / Ban Lãnh Ð?o',
    unit: 'Ban Lãnh Ð?o Toàn Vi?n',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
    badge: 'Ban Lãnh Ð?o',
    phone: '0913 777 888',
    email: 'lanhdao@thanhvumedic.vn',
    dob: '1975-10-15',
    hometown: 'Cà Mau'
  },
  // 3. TRU?NG PHÒNG PTKH: Hu?nh Tru?ng Thanh Tâm (Qu?n lý toàn b? MKT / CSKH / H? tr?)
  {
    id: 'user_tam_ptkh',
    username: 'thanhtam',
    password: '123',
    name: 'Hu?nh Tru?ng Thanh Tâm',
    role: 'MANAGER',
    departmentId: 'dept_ptkh',
    teamId: 'all', // Qu?n lý toàn b? các b? ph?n con c?a phòng PTKH
    title: 'Tru?ng phòng Phát Tri?n Khách Hàng',
    unit: 'Phòng Phát Tri?n Khách Hàng • CS3',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80',
    badge: 'Tru?ng phòng',
    phone: '0945 112 233',
    email: 'thanhtam.ptkh@thanhvumedic.vn',
    dob: '1986-06-20',
    hometown: 'Cà Mau'
  },
  // 4. NHÂN VIÊN PHÒNG PTKH - B? PH?N CSKH
  {
    id: 'user_mai_ptkh',
    username: 'tuyetmai',
    password: '123',
    name: 'CN. Nguy?n Th? Tuy?t Mai',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_cskh',
    title: 'Chuyên viên CSKH & Ti?p Nh?n',
    unit: 'B? ph?n CSKH • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên CSKH',
    phone: '0918 445 566',
    email: 'mai.ntt@thanhvumedic.vn',
    dob: '1992-04-15',
    hometown: 'B?c Liêu'
  },
  // 5. NHÂN VIÊN PHÒNG PTKH - B? PH?N MARKETING
  {
    id: 'user_nam_ptkh',
    username: 'hoangnam',
    password: '123',
    name: 'ThS. Lê Hoàng Nam',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_mkt',
    title: 'Chuyên viên Marketing & Truy?n Thông',
    unit: 'B? ph?n Marketing • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên MKT',
    phone: '0909 778 899',
    email: 'nam.lh@thanhvumedic.vn',
    dob: '1990-11-30',
    hometown: 'C?n Tho'
  },
  // 6. NHÂN VIÊN PHÒNG PTKH - B? PH?N H? TR?
  {
    id: 'user_khang_ptkh',
    username: 'minhkhang',
    password: '123',
    name: 'CN. Tr?n Minh Khang',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    teamId: 'team_hotro',
    title: 'Chuyên viên H? Tr? & Hu?ng D?n Khách',
    unit: 'B? ph?n H? Tr? • Phòng PTKH',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên H? Tr?',
    phone: '0939 123 789',
    email: 'khang.tm@thanhvumedic.vn',
    dob: '1994-08-10',
    hometown: 'Cà Mau'
  },
  // 7. TRU?NG PHÒNG DU?C
  {
    id: 'user_minh_duoc',
    username: 'minhhn',
    password: '123',
    name: 'DS.CKI Nguy?n Van Minh',
    role: 'MANAGER',
    departmentId: 'dept_duoc',
    teamId: 'all',
    title: 'Tru?ng Kho Du?c CS3',
    unit: 'Kho Du?c & VTYT • CS3',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
    badge: 'Tru?ng phòng',
    phone: '0933 667 788',
    email: 'minh.duoc@thanhvumedic.vn',
    dob: '1982-08-12',
    hometown: 'Cà Mau'
  },
  // 8. CH? HUY TRU?NG QLDA
  {
    id: 'user_nghia_qlda',
    username: 'nghiath',
    password: '123',
    name: 'KS. Truong H?u Nghia',
    role: 'MANAGER',
    departmentId: 'dept_qlda',
    teamId: 'all',
    title: 'Ch? Huy Tru?ng Ban QLDA',
    unit: 'Ban QLDA C?i T?o SVH-STN',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    badge: 'Ch? huy tru?ng',
    phone: '0977 123 456',
    email: 'nghia.kpd@thanhvumedic.vn',
    dob: '1988-03-25',
    hometown: 'TP. H? Chí Minh'
  }
];

export const INITIAL_TASKS = [
  // --- CÔNG VI?C PHÒNG PHÁT TRI?N KHÁCH HÀNG (dept_ptkh) ---
  {
    id: 'PTKH-101',
    departmentId: 'dept_ptkh',
    teamId: 'team_cskh',
    title: 'Chu?n b? tài li?u & báo cáo ti?p dón Ðoàn ki?m tra S? Y T? Cà Mau',
    description: 'T?ng h?p s? li?u khám ch?a b?nh BHYT, quy trình dón ti?p b?nh nhân VIP t?i CS3 và h? so dánh giá ch?t lu?ng d?ch v? tru?c 14:00 t?i H?i tru?ng B.',
    priority: 'P1', // P1: Kh?n, P2: Quan tr?ng, P3: Tiêu chu?n
    status: 'in_progress', // in_progress | pending_approval | completed
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-06T15:00:00.000Z',
    category: 'Báo cáo & Ki?m tra',
    checklist: [
      { id: 'chk_1', text: 'In ?n 15 b? tài li?u thuy?t minh co s? v?t ch?t CS3', done: true },
      { id: 'chk_2', text: 'Ki?m tra máy chi?u, âm thanh và b?ng dón t?i H?i tru?ng B', done: true },
      { id: 'chk_3', text: 'Rà soát danh sách nhân s? tr?c l? tân và dón ti?p VIP', done: false },
      { id: 'chk_4', text: 'Trình ký Giám d?c duy?t slide t?ng k?t tru?c gi? h?p', done: false }
    ],
    comments: [
      { id: 'cmt_1', userId: 'user_tam_ptkh', text: 'Ðã b? sung thêm b?ng d?i chi?u khám s?c kh?e doàn doanh nghi?p tháng 10.', time: '08:45' }
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
    title: 'Ðàm phán h?p d?ng khám s?c kh?e d?nh k? Cty Th?y S?n Minh Phú (1.200 CBCNV)',
    description: 'Kh?o sát nhu c?u khám luu d?ng t?i Nhà máy Ch? bi?n Th?y s?n Giá Rai. Ðóng gói b?ng giá uu dãi xét nghi?m sinh hóa và ch?p X-Quang ph?i k? thu?t s?.',
    priority: 'P2',
    status: 'pending_approval',
    requiresApproval: true,
    approvalStatus: 'PENDING',
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_mai_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-08T17:00:00.000Z',
    category: 'Khám Ðoàn Doanh Nghi?p',
    checklist: [
      { id: 'chk_201', text: 'L?p báo giá gói khám tiêu chu?n & nâng cao', done: true },
      { id: 'chk_202', text: 'Lên l?ch di?u d?ng xe khám luu d?ng và k? thu?t viên', done: true },
      { id: 'chk_203', text: 'So?n th?o h?p d?ng nguyên t?c b?o lãnh thanh toán', done: true }
    ],
    comments: [
      { id: 'cmt_201', userId: 'user_mai_ptkh', text: 'Em dã ch?t du?c th?i gian khám d?t 1 vào ngày 12/11 t?i, g?i Tru?ng phòng phê duy?t ?!', time: '10:15' }
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
    title: 'Ký k?t h?p tác b?o lãnh vi?n phí tr?c ti?p B?o hi?m B?o Vi?t & PVI CS3',
    description: 'Th?ng nh?t quy trình cà th? b?o lãnh n?i trú/ngo?i trú không dùng ti?n m?t qua c?ng k?t n?i di?n t? B?nh vi?n Thanh Vu Medic.',
    priority: 'P2',
    status: 'in_progress',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-10T11:30:00.000Z',
    category: 'B?o Hi?m Y T?',
    checklist: [
      { id: 'chk_301', text: 'Tích h?p k?t n?i API c?ng tra c?u quy?n l?i ch? th?', done: true },
      { id: 'chk_302', text: 'T?p hu?n quy trình ti?p dón b?o lãnh cho nhân viên thu ngân CS3', done: false }
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
    title: 'Chi?n d?ch truy?n thông Gói T?m Soát Ð?t Qu? & Tim M?ch S?m Tháng 11',
    description: 'Tri?n khai b?ng standee, t? roi t?i s?nh t?ng tr?t CS3 và ch?y chi?n d?ch ti?p c?n trên Zalo OA b?nh vi?n.',
    priority: 'P3',
    status: 'completed',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tam_ptkh',
    approverId: 'user_tam_ptkh',
    dueDate: '2026-11-04T17:00:00.000Z',
    category: 'Marketing & D?ch V?',
    checklist: [
      { id: 'chk_401', text: 'Thi?t k? ?n ph?m chu?n nh?n di?n Thanh Vu Medic', done: true },
      { id: 'chk_402', text: 'In ?n 2.000 t? g?p và 5 standee d?t t?i các khoa khám', done: true }
    ],
    comments: [
      { id: 'cmt_401', userId: 'user_tam_ptkh', text: 'Chi?n d?ch ch?y r?t t?t, lu?ng b?nh nhân dang ký gói tang 35%.', time: '16:00' }
    ],
    progress: 100,
    cost: 12000000,
    createdAt: '2026-10-28T08:00:00.000Z',
    updatedAt: '2026-11-04T16:00:00.000Z'
  },

  // --- CÔNG VI?C KHOA DU?C & V?T TU Y T? (dept_duoc) ---
  {
    id: 'DUOC-201',
    departmentId: 'dept_duoc',
    teamId: 'team_duoc_vaccine',
    title: 'Ki?m kê d?nh k? & th?m d?nh nhi?t d? kho l?nh b?o qu?n Vaccine GSP',
    description: 'Xu?t d? li?u bi?u d? c?m bi?n nhi?t d? t? d?ng (2-8 d? C) 30 ngày qua và d?i soát t?n kho th?c t? t?i CS3.',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_minh_duoc',
    creatorId: 'user_minh_duoc',
    approverId: 'user_admin',
    dueDate: '2026-11-07T16:00:00.000Z',
    category: 'GSP & Kho L?nh',
    checklist: [
      { id: 'chk_501', text: 'Ki?m tra pin d? phòng máy ghi nhi?t ?m t? d?ng Testo', done: true },
      { id: 'chk_502', text: 'Ð?i chi?u s? lô h?n dùng 45 danh m?c vaccine tiêm ch?ng', done: false }
    ],
    comments: [],
    progress: 50,
    cost: 0,
    createdAt: '2026-11-05T08:00:00.000Z',
    updatedAt: '2026-11-06T09:00:00.000Z'
  },

  // --- CÔNG VI?C BAN QLDA C?I T?O (dept_qlda) ---
  {
    id: 'QLDA-301',
    departmentId: 'dept_qlda',
    teamId: 'team_qlda_giamsat',
    title: 'Nghi?m thu bàn giao h? th?ng ?ng c?p gió tuoi áp l?c âm Phòng M? CS3',
    description: 'Ðo ki?m t?c d? gió, d? s?ch h?t b?i HEPA Filter phòng m? s? 1 & 2 tru?c khi dua vào v?n hành ph?u thu?t.',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_nghia_qlda',
    creatorId: 'user_nghia_qlda',
    approverId: 'user_admin',
    dueDate: '2026-11-09T17:00:00.000Z',
    category: 'K? Thu?t Công Trình',
    checklist: [
      { id: 'chk_601', text: 'Ch?y th? nghi?m liên t?c 72 gi? không t?i', done: true },
      { id: 'chk_602', text: 'L?p biên b?n nghi?m thu k? thu?t 4 bên', done: false }
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
    title: '?? Phân công công vi?c m?i',
    content: 'ThS.BS Nguy?n Thanh Vu dã giao vi?c "Chu?n b? tài li?u & báo cáo ti?p dón Ðoàn ki?m tra S? Y T? Cà Mau" cho b?n.',
    taskId: 'PTKH-101',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif_init_2',
    recipientId: 'user_tam_ptkh',
    senderId: 'user_mai_ptkh',
    type: 'approval_request',
    title: '? Ð? xu?t c?n phê duy?t',
    content: 'CN. Nguy?n Th? Tuy?t Mai dã g?i d? xu?t phê duy?t h?p d?ng khám Minh Phú (1.200 CBCNV).',
    taskId: 'PTKH-102',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'notif_init_3',
    recipientId: 'user_mai_ptkh',
    senderId: 'user_tam_ptkh',
    type: 'task_assigned',
    title: '?? Phân công công vi?c m?i',
    content: 'Hu?nh Tru?ng Thanh Tâm dã phân công nhi?m v? "Khám s?c kh?e Minh Phú" cho b?n.',
    taskId: 'PTKH-102',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'notif_init_4',
    recipientId: 'user_lanhdao',
    senderId: 'user_tam_ptkh',
    type: 'approval_request',
    title: '??? Báo cáo trình Ban Lãnh Ð?o phê duy?t',
    content: 'Phòng PTKH trình ký duy?t slide t?ng k?t và k? ho?ch ti?p doàn S? Y T?.',
    taskId: 'PTKH-101',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];


