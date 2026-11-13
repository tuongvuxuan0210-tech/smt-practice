# SMT Practice

Ứng dụng web luyện kỹ năng lập trình máy gắp SMT (Panasonic NPM) và AOI (Parmi) mỗi ngày, không cần máy thật.

**Dùng ngay:** https://tuongvuxuan0210-tech.github.io/smt-practice/

## Có gì trong app

| Tab | Nội dung |
|---|---|
| Hôm nay | Bài theo lịch tuần, bài gợi ý tiếp theo, đồng hồ buổi học, chuỗi ngày luyện, lịch 28 ngày |
| Nhật ký | Ghi và sửa từng buổi học; xuất CSV (mở bằng Excel), sao lưu / khôi phục JSON |
| Bài tập | 32 bài theo 6 chủ đề: CAD/BOM, thư viện linh kiện, OpenPnP, tối ưu line, AOI, ôn tập |
| CAD → Mount | Đề ngẫu nhiên: đổi gốc tọa độ, lật mặt Bottom, góc tape, đối chiếu BOM, tọa độ panel; chấm từng ô |
| Teaching AOI | Xem phân bố đo của 20 board OK, đặt ngưỡng, chạy lot 50 board có lỗi cài sẵn và độ trôi quá trình |
| Phán định ảnh | 12 ảnh mỗi lượt: OK (false call) hay lỗi gì |
| Lộ trình | Các khối của môi trường giả lập, công cụ miễn phí cần cài, lịch tuần |

Mỗi đề / lot có mã số, nhập lại mã để làm lại đúng đề đó. Kết quả từ công cụ lưu thẳng vào nhật ký.

## Dữ liệu

Nhật ký lưu trong `localStorage` của trình duyệt, không gửi đi đâu. Đổi máy hoặc xóa dữ liệu trình duyệt sẽ mất, nên hãy dùng **Sao lưu JSON** định kỳ.

## Chạy ở máy

Không cần build. Mở `index.html` bằng trình duyệt, hoặc:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## Cấu trúc

```
index.html   giao diện, các tab
style.css    giao diện
data.js      chủ đề, lịch tuần, ngân hàng bài tập (sửa ở đây để thêm bài)
tools.js     3 công cụ luyện: CAD → Mount, Teaching AOI, Phán định ảnh
app.js       điều hướng, nhật ký, trang Hôm nay, đồng hồ
```

## Lưu ý

Quy ước gốc tọa độ, góc mặt Bottom và góc trong tape là giả định của bài tập; máy và phần mềm thật có quy ước riêng. Dữ liệu AOI là mô phỏng thống kê, không phải thuật toán của Panasonic hay Parmi.
