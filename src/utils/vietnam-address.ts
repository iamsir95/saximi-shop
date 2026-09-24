export const VIETNAM_PROVINCES_2025 = [
  "Tuyên Quang",
  "Cao Bằng",
  "Lai Châu",
  "Lào Cai",
  "Thái Nguyên",
  "Điện Biên",
  "Lạng Sơn",
  "Sơn La",
  "Phú Thọ",
  "Bắc Ninh",
  "Quảng Ninh",
  "Hà Nội",
  "Hải Phòng",
  "Hưng Yên",
  "Ninh Bình",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Trị",
  "Huế",
  "Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đắk Lắk",
  "Hồ Chí Minh",
  "Đồng Nai",
  "Tây Ninh",
  "Cần Thơ",
  "Vĩnh Long",
  "Đồng Tháp",
  "Cà Mau",
  "An Giang",
];

export interface VietnamAddressParts {
  streetAddress?: string;
  ward?: string;
  province?: string;
}

export function buildVietnamAddress({
  streetAddress,
  ward,
  province,
}: VietnamAddressParts) {
  return [streetAddress, ward, province]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
