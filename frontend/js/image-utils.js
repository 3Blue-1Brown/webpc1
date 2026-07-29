/**
 * image-utils.js — Bộ chuyển đổi đường dẫn ảnh Google Drive tối giản & chính xác
 */

/**
 * Trích xuất File ID từ mọi định dạng link Google Drive
 */
function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)|\/d\/([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1] || match[2] || match[3] || null;
  return null;
}

/**
 * Chuyển đổi link bất kỳ sang đường dẫn hiển thị ảnh trực tiếp từ Google Drive CDN
 */
function convertImageUrl(rawUrl) {
  if (!rawUrl) return '';
  const url = rawUrl.split(/[,\n]/)[0].trim();
  if (!url) return '';

  // 1. Giữ nguyên nếu là dữ liệu Base64 hoặc ảnh upload nội bộ
  if (url.startsWith('data:image/')) return url;
  if (url.startsWith('uploads/')) return '/' + url;
  if (url.startsWith('/uploads/')) return url;

  // 2. Chuyển đổi link Google Drive sang CDN trực tiếp
  const driveId = extractDriveId(url);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // 3. Tự thêm giao thức https:// nếu thiếu
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return 'https://' + url;
  }

  return url;
}

/**
 * Lấy toàn bộ danh sách URL đã chuyển đổi
 */
function getAllImageUrls(rawUrl) {
  if (!rawUrl) return [];
  return rawUrl.split(/[,\n]/).map(u => u.trim()).filter(Boolean).map(convertImageUrl);
}

/**
 * Bộ xử lý lỗi tự động cho ảnh Google Drive khi bị cản trở Referrer hoặc CDN
 */
function handleImgError(img) {
  if (!img) return;
  img.referrerPolicy = 'no-referrer'; // Tắt Referer header tránh bị Google ngăn chặn

  const rawUrl = img.dataset.rawUrl || img.src || '';
  const attempt = parseInt(img.dataset.attempt || '0') + 1;
  img.dataset.attempt = attempt;

  const driveId = extractDriveId(rawUrl);

  if (driveId && attempt === 1) {
    // Thử cổng thumbnail dự phòng
    img.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
    return;
  }

  if (driveId && attempt === 2) {
    // Thử cổng uc export dự phòng
    img.src = `https://drive.google.com/uc?export=view&id=${driveId}`;
    return;
  }

  // Nếu tất cả cổng đều không tải được -> Đổi sang ảnh placeholder
  img.src = '/placeholder.png';
  img.style.opacity = '0.7';
  img.title = 'Không thể tải ảnh. Vui lòng kiểm tra quyền chia sẻ file Google Drive (cần chọn "Bất kỳ ai có liên kết")';
}

function convertGoogleDriveLink(url) {
  return convertImageUrl(url);
}
