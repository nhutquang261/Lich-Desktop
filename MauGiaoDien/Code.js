/**
 * MAU GIAO DIEN - Google Apps Script web app
 * 12 mau giao dien hien dai, Sidebar ben trai thu gon / mo rong, chia 3 bo:
 *   Nova   (01-04, 11)  4 kieu sidebar tren cung 1 trang noi dung mau + 1 mau cho App nhieu module (nhom, ghim, tim nhanh Ctrl+K)   -> Nova*.html
 *   Cua toi (12)  tong hop thiet ke cua app QuanLyTaiChinh (menu 3 cap, thanh icon, 8 giao dien, mau chu dao, co chu) -> Rieng*.html
 *   Nimbus (05-10)  6 giao dien dashboard day du (Tong quan, Don hang, Khach hang, Bao cao, Cai dat) -> Nimbus*.html + NimbusData.js
 * Truy cap: <URL web app>?mau=<khoa hoac so>, vi du ?mau=nova-glass hoac ?mau=02. Khong co ?mau -> trang chon mau (Chon.html).
 */

var BO = {
  Nova: 'Nova — 4 kiểu sidebar trên cùng một trang nội dung mẫu, và 1 mẫu cho app nhiều module',
  'Của tôi': 'Của tôi — tổng hợp thiết kế giao diện của app QuanLyTaiChinh trong 1 mẫu',
  Nimbus: 'Nimbus — 6 giao diện dashboard đầy đủ: Tổng quan, Đơn hàng, Khách hàng, Báo cáo, Cài đặt'
};

// Bang dinh tuyen DUY NHAT: so, khoa (tham so ?mau=), file HTML, bo, ten hien thi, mo ta. Trang chon mau va tieu de tab doc tu day.
var MAU = [
  { so: '01', khoa: 'nova-sang', file: 'NovaSang', bo: 'Nova', ten: 'Sáng – SaaS', mota: 'Nền sáng, sidebar trắng, nhấn màu indigo. Gọn gàng, quen thuộc như các công cụ quản trị chuyên nghiệp.' },
  { so: '02', khoa: 'nova-glass', file: 'NovaGlass', bo: 'Nova', ten: 'Tối – Glass', mota: 'Nền tối có quầng sáng mờ, sidebar và thẻ bằng kính mờ, nhấn gradient tím – xanh.' },
  { so: '03', khoa: 'nova-noi', file: 'NovaNoi', bo: 'Nova', ten: 'Nổi – Bo góc', mota: 'Sidebar nổi tách khỏi mép, bo tròn mềm mại, mục đang chọn dạng viên thuốc xanh ngọc.' },
  { so: '04', khoa: 'nova-rail', file: 'NovaRail', bo: 'Nova', ten: 'Hai lớp – Rail + Panel', mota: 'Thanh icon tối cố định kèm panel menu theo nhóm. Thu gọn là ẩn panel, chỉ còn thanh icon.' },
  { so: '05', khoa: 'nimbus-light', file: 'NimbusLight', bo: 'Nimbus', ten: 'Light', mota: 'Sáng, thoáng, điểm nhấn indigo.' },
  { so: '06', khoa: 'nimbus-dark', file: 'NimbusDark', bo: 'Nimbus', ten: 'Dark', mota: 'Tối, phẳng, sắc nét, điểm nhấn xanh ngọc.' },
  { so: '07', khoa: 'nimbus-aurora', file: 'NimbusAurora', bo: 'Nimbus', ten: 'Aurora', mota: 'Kính mờ, nền chuyển màu, sidebar nổi.' },
  { so: '08', khoa: 'nimbus-ocean', file: 'NimbusOcean', bo: 'Nimbus', ten: 'Ocean', mota: 'Nội dung sáng, sidebar xanh navy đậm tương phản, nhấn xanh dương.' },
  { so: '09', khoa: 'nimbus-sunset', file: 'NimbusSunset', bo: 'Nimbus', ten: 'Sunset', mota: 'Nền kem ấm, bo góc lớn mềm mại, nhấn cam đất.' },
  { so: '11', khoa: 'nova-module', file: 'NovaModule', bo: 'Nova', ten: 'Nhiều module', mota: 'App có 24 module / 6 nhóm: nhóm gập – mở, mục ghim, tìm nhanh Ctrl K; thu gọn còn 1 icon mỗi nhóm, rê chuột ra menu con (flyout).' },
  { so: '12', khoa: 'rieng', file: 'Rieng', bo: 'Của tôi', ten: 'QuanLyTaiChinh', mota: 'Tổng hợp thiết kế riêng: menu 3 cấp (đầu mục gạch → nhóm cha có icon → module chỉ chữ), thanh icon thu gọn có flyout + dấu gạch mờ, 8 giao diện (Mặc định, Sáng, Tối, Dark, Aurora, Ocean, Sunset, Mono), 21 màu chủ đạo, 4 cỡ chữ.' },
  { so: '10', khoa: 'nimbus-mono', file: 'NimbusMono', bo: 'Nimbus', ten: 'Mono', mota: 'Đen trắng tối giản kiểu biên tập, viền đậm, bóng cứng.' }
];

/**
 * Diem vao khi truy cap web app.
 */
function doGet(e) {
  var tim = String((e && e.parameter && e.parameter.mau) || '');
  var mau = MAU.filter(function (m) { return m.khoa === tim || m.so === tim; })[0];
  var template = HtmlService.createTemplateFromFile(mau ? mau.file : 'Chon');
  // Moi scriptlet <?= ?> chi chay o file trang cap cao nay (file include khong duoc evaluate): link can URL trong file include thi gan bang JS tu window.APP_BASE
  template.baseUrl = ScriptApp.getService().getUrl(); // link doi mau phai target="_top" + URL tuyet doi (iframe cua HtmlService)
  template.MAU = MAU;
  template.BO = BO;
  return template.evaluate()
    .setTitle(mau ? 'Mẫu ' + mau.so + ' · ' + mau.bo + ' ' + mau.ten : 'Chọn mẫu giao diện')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Cho phep gop noi dung tu file HTML/CSS/JS khac vao trang (noi dung gop vao KHONG duoc chua <? ?>).
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
