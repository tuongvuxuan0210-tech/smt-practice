/* Dữ liệu: chủ đề, lịch tuần, ngân hàng bài tập */
const TOPICS = {
  cad: { name: 'CAD/BOM', color: '#1f5fbf', tool: 't-cad' },
  lib: { name: 'Thư viện linh kiện', color: '#0f7d7d', tool: null },
  pnp: { name: 'OpenPnP (máy ảo)', color: '#6b3fa0', tool: null },
  opt: { name: 'Tối ưu line', color: '#b8620b', tool: null },
  aoi: { name: 'AOI', color: '#1d8048', tool: 't-aoi' },
  rev: { name: 'Ôn tập', color: '#5d6964', tool: null }
};

/* getDay(): 0 = CN, 1 = T2 ... 6 = T7 */
const SCHEDULE = {
  1: { topic: 'cad', what: 'Chuyển CAD/BOM sang dữ liệu PCB: gốc tọa độ, góc xoay, mặt Bottom, panel, fiducial', time: '30–45 phút', tools: 'KiCad, Excel, tab CAD → Mount' },
  2: { topic: 'lib', what: 'Tạo component data cho 5–10 package từ datasheet', time: '30 phút', tools: 'Datasheet, sổ tay' },
  3: { topic: 'pnp', what: 'Dựng hoặc chạy job, xử lý lỗi fiducial và nhận dạng', time: '45 phút', tools: 'OpenPnP ở chế độ mô phỏng' },
  4: { topic: 'opt', what: 'Cân bằng takt, bố trí feeder, setup dùng chung', time: '30–45 phút', tools: 'Excel / Python' },
  5: { topic: 'aoi', what: 'Phán định ảnh lỗi, teaching ngưỡng, viết bài kiểm tra OpenCV', time: '30–45 phút', tools: 'Tab Teaching AOI, Phán định ảnh, OpenCV' },
  6: { topic: 'rev', what: 'Sổ tay lỗi tuần, viết lại quy trình máy thật từ trí nhớ', time: '30 phút', tools: 'Sổ tay' },
  0: { topic: null, what: 'Nghỉ, hoặc bù buổi bị lỡ', time: 'Tùy', tools: '' }
};

const BANK = [
  ['CAD-01','cad','Cơ bản','Xuất file Pick&Place từ một project mẫu KiCad; đọc hiểu các cột Ref / Val / Package / X / Y / Rot / Side','KiCad','Giải thích đúng mọi cột, đơn vị và gốc tọa độ'],
  ['CAD-02','cad','Cơ bản','Đổi gốc tọa độ từ gốc CAD sang góc dưới-trái board (hoặc theo fiducial 1)','Excel / tab CAD → Mount (mức Dễ)','≥ 90% đúng'],
  ['CAD-03','cad','Trung bình','Lật tọa độ linh kiện mặt Bottom và quy đổi góc xoay','Excel / tab CAD → Mount (mức Vừa)','≥ 90% đúng'],
  ['CAD-04','cad','Trung bình','Quy đổi góc CAD sang góc máy theo hướng linh kiện trong tape (chip, SOT-23, SOIC, QFP)','Tab CAD → Mount','≥ 90% đúng trong 3 lượt liên tiếp'],
  ['CAD-05','cad','Trung bình','So BOM với CAD: tìm Ref thiếu, thừa, sai package, linh kiện DNP','Tab CAD → Mount (mức Vừa)','Tìm đủ toàn bộ lỗi cài sẵn'],
  ['CAD-06','cad','Nâng cao','Nhân panel theo step X/Y, khai báo bad mark cho từng board con','Tab CAD → Mount (mức Khó)','≥ 90% đúng'],
  ['CAD-07','cad','Cơ bản','Chọn 2–3 fiducial: kiểm tra vị trí chéo nhau, khoảng cách, vùng trống quanh mark','KiCad','Giải thích được lý do chọn'],
  ['LIB-01','lib','Cơ bản','Tạo component data cho chip 0402 / 0603 / 1206: kích thước body, độ dày, nozzle, tape 8 mm, pitch 2/4 mm','Sổ tay + datasheet','Đủ thông số, chọn nozzle hợp lý'],
  ['LIB-02','lib','Cơ bản','SOT-23 / SOT-223: kích thước lead, góc tape, cách nhận dạng','Sổ tay + datasheet','Đủ thông số'],
  ['LIB-03','lib','Trung bình','QFP / QFN: pitch, số lead mỗi cạnh, chọn nhận dạng lead hay body, tốc độ đặt','Sổ tay + datasheet','Đủ thông số, giải thích được lựa chọn'],
  ['LIB-04','lib','Nâng cao','BGA: ball pitch, ma trận ball, nhận dạng ball, giảm tốc độ đặt, kiểm tra coplanarity','Sổ tay + datasheet','Đủ thông số'],
  ['LIB-05','lib','Nâng cao','Connector / linh kiện cao: feeder tray hoặc stick, nozzle đặc biệt, chiều cao tránh va chạm','Sổ tay + datasheet','Đủ thông số'],
  ['LIB-06','lib','Trung bình','Lấy datasheet một IC thật bất kỳ và điền đầy đủ component data như trên NPM','Datasheet','Hoàn thành trong 15 phút'],
  ['PNP-01','pnp','Cơ bản','Chạy job demo ở chế độ mô phỏng, ghi lại trình tự: fiducial → pick → vision → place','OpenPnP','Chạy hết job, ghi đủ các bước'],
  ['PNP-02','pnp','Cơ bản','Tạo package và footprint mới, gán nozzle tip phù hợp','OpenPnP','Package dùng được trong job'],
  ['PNP-03','pnp','Trung bình','Tạo board mới từ file centroid của CAD-01 và chạy job','OpenPnP + KiCad','Job chạy hết, không lỗi'],
  ['PNP-04','pnp','Nâng cao','Làm lệch board / feeder trong mô phỏng, chỉnh fiducial và vision để máy chạy lại được','OpenPnP','Chạy được sau khi cố ý làm lệch'],
  ['PNP-05','pnp','Trung bình','Cấu hình strip feeder: pitch, hướng tape, auto setup','OpenPnP','Feeder pick đúng 10 lần liên tiếp'],
  ['OPT-01','opt','Nâng cao','Chia ~200 điểm đặt cho 2 máy (head 16 nozzle cho chip, head 3 nozzle cho IC), cân bằng takt','Excel / Python','Chênh lệch takt ≤ 5%'],
  ['OPT-02','opt','Trung bình','Xếp feeder theo bank / slot (tape 8/12/16/24 mm chiếm số slot khác nhau), linh kiện dùng nhiều đặt gần vùng đặt','Excel','Không trùng slot, có lý do sắp xếp'],
  ['OPT-03','opt','Nâng cao','Làm setup dùng chung cho 3 model để giảm số lần thay feeder khi chuyển model','Excel','Giảm ≥ 30% số feeder phải thay'],
  ['OPT-04','opt','Cơ bản','Tính takt lý thuyết từ CPH và số điểm đặt, so với takt thực, giải thích chênh lệch','Excel','Tính đúng, nêu được ≥ 3 nguyên nhân'],
  ['AOI-01','aoi','Cơ bản','Phán định ảnh: lỗi thật hay false call, gọi đúng tên lỗi theo IPC-A-610 class 2','Tab Phán định ảnh + bộ ảnh lỗi PCB công khai','≥ 11/12 ảnh đúng'],
  ['AOI-02','aoi','Trung bình','Teaching: chỉnh ngưỡng từng loại kiểm tra cho một model','Tab Teaching AOI','0 lỗi lọt, false call ≤ 1% số điểm'],
  ['AOI-03','aoi','Trung bình','OpenCV: kiểm tra thiếu linh kiện bằng so sánh với ảnh mẫu','Python + OpenCV','Phát hiện đúng trên 10 ảnh thử'],
  ['AOI-04','aoi','Nâng cao','OpenCV: đo lệch X/Y và góc xoay bằng template matching','Python + OpenCV','Sai số ≤ 2 pixel'],
  ['AOI-05','aoi','Nâng cao','OpenCV: phát hiện cầu thiếc giữa các lead IC (ngưỡng + đếm vùng liên thông)','Python + OpenCV','Phát hiện đúng trên 10 ảnh thử'],
  ['AOI-06','aoi','Trung bình','Kiểm tra cực tính diode, tụ tantalum, IC (dấu pin 1)','Tab Phán định ảnh / OpenCV','Không bỏ sót'],
  ['AOI-07','aoi','Nâng cao','Ôn lý thuyết 3D laser line scan: đặt ngưỡng chiều cao cho lifted lead, tombstone, linh kiện bị nghiêng','Sổ tay','Viết được bảng ngưỡng cho 5 loại linh kiện'],
  ['REV-01','rev','Cơ bản','Sổ tay lỗi tuần: 3 lỗi đã gặp, nguyên nhân, cách xử lý trên máy thật','Sổ tay','Đủ 3 lỗi'],
  ['REV-02','rev','Cơ bản','Viết lại từ trí nhớ quy trình làm chương trình NPM: PCB data → component data → bố trí feeder → tối ưu → chuyển xuống máy','Sổ tay','Không thiếu bước'],
  ['REV-03','rev','Cơ bản','Viết lại từ trí nhớ quy trình teaching AOI Parmi: nhập CAD → căn fiducial → gán thư viện → chỉnh ngưỡng → chạy thử, xử lý false call','Sổ tay','Không thiếu bước']
].map(([code, topic, level, task, tools, pass]) => ({ code, topic, level, task, tools, pass }));
