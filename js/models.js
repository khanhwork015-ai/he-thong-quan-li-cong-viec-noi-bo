/**
 * THANH VŨ MEDIC CS3 - DATA MODELS & MULTI-DEPARTMENT ARCHITECTURE
 * Cấu trúc thực thể hỗ trợ mở rộng không giới hạn phòng ban (Multi-tenant ready)
 */

export const DEPARTMENTS = [
  {
    id: 'dept_ptkh',
    name: 'Phòng Phát Triển Khách Hàng',
    code: 'PTKH-CS3',
    unit: 'Cơ Sở 3 (Cà Mau)',
    managerId: 'user_tuan_ptkh',
    description: 'Chăm sóc khách hàng, khám sức khỏe doanh nghiệp, bảo hiểm và phát triển thị trường y tế',
    badge: 'CS3',
    color: '#D6A52A' // Primary Gold Stitch
  },
  {
    id: 'dept_duoc',
    name: 'Kho Dược & Vật Tư Y Tế',
    code: 'DUOC-CS3',
    unit: 'Cơ Sở 3 (Cà Mau)',
    managerId: 'user_minh_duoc',
    description: 'Quản lý kho thuốc GSP, kho lạnh vaccine và cung ứng vật tư tiêu hao',
    badge: 'DƯỢC',
    color: '#0D9488'
  },
  {
    id: 'dept_qlda',
    name: 'Ban QLDA & Thi Công Cải Tạo',
    code: 'QLDA-SVH',
    unit: 'Công trường SVH & STN',
    managerId: 'user_nghia_qlda',
    description: 'Giám sát thi công, bàn giao vật tư 4 bên và quản lý tiến độ 4 tháng',
    badge: 'QLDA',
    color: '#2563EB'
  }
];

export const USERS = [
  // 1. ADMIN TOÀN HỆ THỐNG
  {
    id: 'user_tam_admin',
    name: 'Sếp Tâm',
    role: 'ADMIN',
    departmentId: 'all', // Toàn quyền chuyển đổi và giám sát mọi phòng ban
    title: 'Tổng Giám Đốc / Chủ Tịch HĐQT',
    unit: 'Tập đoàn Y tế Thanh Vũ Medic',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    badge: 'Admin Hệ Thống',
    phone: '0913 888 999',
    email: 'septam@thanhvumedic.vn',
    dob: '1978-05-18',
    hometown: 'Cà Mau',
    pin: '1234'
  },
  // 2. TRƯỞNG PHÒNG PTKH (Theo đúng thiết kế Google Stitch)
  {
    id: 'user_tuan_ptkh',
    name: 'BS.CKI Trần Minh Tuấn',
    role: 'MANAGER',
    departmentId: 'dept_ptkh',
    title: 'Trưởng phòng PTKH',
    unit: 'Phòng Phát Triển Khách Hàng • CS3',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80',
    badge: 'Trưởng phòng',
    phone: '0945 112 233',
    email: 'tuan.tm@thanhvumedic.vn',
    dob: '1985-09-22',
    hometown: 'Cà Mau'
  },
  // 3. NHÂN VIÊN PHÒNG PTKH 1
  {
    id: 'user_mai_ptkh',
    name: 'CN. Nguyễn Thị Tuyết Mai',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    title: 'Chuyên viên Khám Đoàn & CSKH',
    unit: 'Phòng PTKH • CS3',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên',
    phone: '0918 445 566',
    email: 'mai.ntt@thanhvumedic.vn',
    dob: '1992-04-15',
    hometown: 'Bạc Liêu'
  },
  // 4. NHÂN VIÊN PHÒNG PTKH 2
  {
    id: 'user_nam_ptkh',
    name: 'ThS. Lê Hoàng Nam',
    role: 'MEMBER',
    departmentId: 'dept_ptkh',
    title: 'Chuyên viên Bảo Hiểm & Hợp Tác',
    unit: 'Phòng PTKH • CS3',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80',
    badge: 'Chuyên viên',
    phone: '0909 778 899',
    email: 'nam.lh@thanhvumedic.vn',
    dob: '1990-11-30',
    hometown: 'Cần Thơ'
  },
  // 5. TRƯỞNG PHÒNG DƯỢC (Minh chứng mở rộng phòng ban)
  {
    id: 'user_minh_duoc',
    name: 'DS.CKI Nguyễn Văn Minh',
    role: 'MANAGER',
    departmentId: 'dept_duoc',
    title: 'Trưởng Kho Dược CS3',
    unit: 'Kho Dược & VTYT • CS3',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
    badge: 'Trưởng phòng',
    phone: '0933 667 788',
    email: 'minh.duoc@thanhvumedic.vn',
    dob: '1982-08-12',
    hometown: 'Cà Mau'
  },
  // 6. CHỈ HUY TRƯỞNG QLDA (Minh chứng mở rộng công trường)
  {
    id: 'user_nghia_qlda',
    name: 'KS. Trương Hữu Nghĩa',
    role: 'MANAGER',
    departmentId: 'dept_qlda',
    title: 'Chỉ Huy Trưởng Ban QLDA',
    unit: 'Ban QLDA Cải Tạo SVH-STN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
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
    title: 'Chuẩn bị tài liệu & báo cáo tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau',
    description: 'Tổng hợp số liệu khám chữa bệnh BHYT, quy trình đón tiếp bệnh nhân VIP tại CS3 và hồ sơ đánh giá chất lượng dịch vụ trước 14:00 tại Hội trường B.',
    priority: 'P1', // P1: Khẩn, P2: Quan trọng, P3: Tiêu chuẩn
    status: 'review', // todo | in_progress | review | done
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-06',
    category: 'Sở Y Tế',
    progress: 90,
    cost: 5000000,
    subtasks: [
      { id: 'st-1', title: 'In ấn 15 bộ báo cáo tiến độ tuần 43', completed: true },
      { id: 'st-2', title: 'Kiểm tra màn hình chiếu tại Hội trường B CS3', completed: true },
      { id: 'st-3', title: 'Xin chữ ký duyệt của Giám đốc cơ sở', completed: false }
    ],
    comments: [
      { id: 'cm-1', userId: 'user_tuan_ptkh', content: 'Chị Mai nhớ chuẩn bị thêm bảng tổng kết khảo sát hài lòng nhé.', createdAt: '2026-11-05T08:30:00' }
    ]
  },
  {
    id: 'PTKH-102',
    departmentId: 'dept_ptkh',
    title: 'Triển khai hợp đồng khám sức khỏe định kỳ Tập đoàn Thủy sản Minh Phú',
    description: 'Điều phối 3 xe cấp cứu, 12 bác sĩ và 18 điều dưỡng tổ chức lấy mẫu máu và chụp X-quang phổi lưu động cho đợt 1 (1.200 công nhân).',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-12',
    category: 'Khám Đoàn',
    progress: 65,
    cost: 145000000,
    subtasks: [
      { id: 'st-4', title: 'Chốt danh sách nhân sự tham gia khám lưu động', completed: true },
      { id: 'st-5', title: 'Kiểm chuẩn xe chụp X-quang kỹ thuật số', completed: true },
      { id: 'st-6', title: 'Gửi kết quả xét nghiệm lên cổng tra cứu điện tử', completed: false }
    ],
    comments: []
  },
  {
    id: 'PTKH-103',
    departmentId: 'dept_ptkh',
    title: 'Đối soát hồ sơ chi trả Bảo hiểm Y tế tư nhân tháng 10 với Manulife & Prudential',
    description: 'Đối chiếu 342 ca bảo lãnh viện phí ngoại trú và nội trú tại CS3, hoàn tất chứng từ chuyển khoản bồi thường đúng quy định.',
    priority: 'P2',
    status: 'todo',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-15',
    category: 'Bảo Hiểm',
    progress: 20,
    cost: 0,
    subtasks: [
      { id: 'st-7', title: 'Trích xuất dữ liệu từ phần mềm viện phí HIS', completed: true },
      { id: 'st-8', title: 'Kiểm tra chữ ký số bác sĩ điều trị', completed: false }
    ],
    comments: []
  },
  {
    id: 'PTKH-104',
    departmentId: 'dept_ptkh',
    title: 'Hoàn tất báo cáo giao ban tuần 43 gửi Ban Giám Đốc trước 16:30',
    description: 'Tổng hợp chỉ số doanh thu khám đoàn, số lượt bệnh nhân mới và đánh giá hiệu quả kênh tư vấn Zalo OA phòng khám.',
    priority: 'P1',
    status: 'review',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-05',
    category: 'Giao Ban',
    progress: 95,
    cost: 0,
    subtasks: [
      { id: 'st-9', title: 'Tổng hợp số liệu từ 3 nhóm chuyên viên', completed: true },
      { id: 'st-10', title: 'Trưởng phòng ký xác nhận', completed: false }
    ],
    comments: []
  },
  {
    id: 'PTKH-105',
    departmentId: 'dept_ptkh',
    title: 'Khảo sát mức độ hài lòng người bệnh ngoại trú khu CS3 tháng 10',
    description: 'Thu thập 450 phiếu khảo sát điện tử qua QR Code tại quầy thanh toán viện phí và khoa xét nghiệm.',
    priority: 'P3',
    status: 'done',
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-03',
    category: 'CSKH',
    progress: 100,
    cost: 1500000,
    subtasks: [],
    comments: []
  },
  {
    id: 'PTKH-106',
    departmentId: 'dept_ptkh',
    title: 'Thiết kế ấn phẩm truyền thông: Gói Tầm Soát Ung Thư Sớm 2026',
    description: 'Phối hợp phòng Marketing in 2.000 tờ rơi và dựng 4 standee đặt tại sảnh chờ tầng 1 và tầng 2.',
    priority: 'P2',
    status: 'done',
    assigneeId: 'user_nam_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-02',
    category: 'Truyền Thông',
    progress: 100,
    cost: 8500000,
    subtasks: [],
    comments: []
  },
  {
    id: 'PTKH-107',
    departmentId: 'dept_ptkh',
    title: 'Tổ chức chương trình khám tầm soát huyết áp & đường huyết miễn phí Phường 5',
    description: 'Hỗ trợ Hội Người Cao Tuổi TP Cà Mau thực hiện chương trình an sinh xã hội, kết hợp giới thiệu thẻ khám gia đình Thanh Vũ Care.',
    priority: 'P2',
    status: 'in_progress',
    assigneeId: 'user_mai_ptkh',
    creatorId: 'user_tuan_ptkh',
    dueDate: '2026-11-18',
    category: 'Cộng Đồng',
    progress: 40,
    cost: 12000000,
    subtasks: [],
    comments: []
  },

  // --- CÔNG VIỆC CỦA KHO DƯỢC (dept_duoc) - Để kiểm chứng cô lập dữ liệu ---
  {
    id: 'DUOC-201',
    departmentId: 'dept_duoc',
    title: 'Kiểm định nhiệt độ kho lạnh bảo quản vaccine và huyết thanh CS3',
    description: 'Duy trì chuẩn GSP, kiểm tra hệ thống phát điện tự động và cảm biến nhiệt độ cảnh báo SMS.',
    priority: 'P1',
    status: 'in_progress',
    assigneeId: 'user_minh_duoc',
    creatorId: 'user_tam_admin',
    dueDate: '2026-11-08',
    category: 'GSP Kho Dược',
    progress: 80,
    cost: 25000000,
    subtasks: [],
    comments: []
  },

  // --- CÔNG VIỆC BAN QLDA (dept_qlda) - Để kiểm chứng cô lập dữ liệu ---
  {
    id: 'QLDA-301',
    departmentId: 'dept_qlda',
    title: 'Nghiệm thu dầm sàn tầng 1 - Cải tạo Cơ sở Phan Ngọc Hiển (SVH cũ)',
    description: 'Đối chiếu bản vẽ thiết kế kết cấu S-03 với nhà thầu Khang Phú Định (KPD). Đạt 100% cốt thép dầm sàn.',
    priority: 'P1',
    status: 'review',
    assigneeId: 'user_nghia_qlda',
    creatorId: 'user_tam_admin',
    dueDate: '2026-11-06',
    category: 'Nghiệm Thu',
    progress: 90,
    cost: 450000000,
    subtasks: [],
    comments: []
  }
];
