/**
 * Dữ liệu cho 6 giao diện Nimbus (mẫu 05-10), gọi từ trình duyệt qua google.script.run.getDashboardData().
 * Thay dữ liệu mẫu bằng dữ liệu từ Google Sheet của bạn.
 */

/** Thông tin người đang truy cập (email chỉ có khi deploy "Execute as: User accessing the web app"). */
function getCurrentUser_() {
  let email = '';
  try { email = Session.getActiveUser().getEmail(); } catch (e) {}
  return { name: email ? email.split('@')[0] : 'Khách', email: email || 'Chưa đăng nhập' };
}

/** Dữ liệu mẫu cho trang Tổng quan - thay bằng dữ liệu từ Google Sheet của bạn. */
function getDashboardData() {
  // Ví dụ đọc từ Sheet:
  // const sh = SpreadsheetApp.openById('ID_SHEET').getSheetByName('Orders');
  // const values = sh.getDataRange().getValues();
  return {
    user: getCurrentUser_(),
    stats: [
      { k: 'Doanh thu', v: '128,4 tr', d: '+12,5%', up: true, icon: 'i-money' },
      { k: 'Đơn hàng', v: '1.284', d: '+8,2%', up: true, icon: 'i-cart' },
      { k: 'Lượt truy cập', v: '24.810', d: '-3,1%', up: false, icon: 'i-eye' },
      { k: 'Tỷ lệ chuyển đổi', v: '4,6%', d: '+0,9%', up: true, icon: 'i-target' }
    ],
    chart: [
      { m: 'T1', v: 42 }, { m: 'T2', v: 58 }, { m: 'T3', v: 51 }, { m: 'T4', v: 74 },
      { m: 'T5', v: 69 }, { m: 'T6', v: 88 }, { m: 'T7', v: 81 }, { m: 'T8', v: 96 },
      { m: 'T9', v: 90 }, { m: 'T10', v: 112 }, { m: 'T11', v: 104 }, { m: 'T12', v: 126 }
    ],
    feed: [
      { t: 'Nguyễn An vừa tạo đơn hàng #1048', time: '5 phút trước' },
      { t: 'Khách hàng mới: Công ty Minh Phát', time: '32 phút trước' },
      { t: 'Báo cáo tháng 10 đã sẵn sàng', time: '2 giờ trước' },
      { t: 'Trần Bình cập nhật dự án Website', time: 'Hôm qua' }
    ],
    rows: [
      { id: '#1048', name: 'Công ty Minh Phát', amount: '12.500.000', status: 'Hoàn tất' },
      { id: '#1047', name: 'Lê Hoàng Nam', amount: '3.200.000', status: 'Đang xử lý' },
      { id: '#1046', name: 'Cửa hàng An Khang', amount: '8.900.000', status: 'Hoàn tất' },
      { id: '#1045', name: 'Phạm Thu Hà', amount: '1.150.000', status: 'Đã hủy' },
      { id: '#1044', name: 'Công ty Sao Việt', amount: '21.000.000', status: 'Đang xử lý' }
    ]
  };
}
