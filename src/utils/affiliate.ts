import { AffiliateProfile, AffiliatePortalSummary, UserInfo } from "@/types";

export function findAffiliateForUser(
  affiliates: AffiliateProfile[],
  userInfo?: Partial<UserInfo>
) {
  if (!userInfo) return undefined;

  return affiliates.find((affiliate) => {
    const sameUserId = Boolean(userInfo.id && affiliate.userId === userInfo.id);
    const samePhone = Boolean(userInfo.phone && affiliate.phone === userInfo.phone);
    return sameUserId || samePhone;
  });
}

export function findAffiliateByReferrer(
  affiliates: AffiliateProfile[],
  referrerId?: string
) {
  if (!referrerId) return undefined;
  return affiliates.find((affiliate) => affiliate.userId === referrerId);
}

export function getAffiliateRoleLabel(profile?: AffiliateProfile) {
  if (!profile) return "Khách hàng thông thường";
  return (
    profile.levelName ||
    (profile.role === "PRESIDENT"
      ? "Chủ tịch hội"
      : profile.role === "BRANCH_LEADER"
        ? "Chi hội trưởng"
        : "Khách hàng thông thường")
  );
}

export function getAffiliateRoleDescription(profile?: AffiliateProfile) {
  if (!profile) {
    return "Tài khoản mua hàng tiêu chuẩn, không có quyền quản lý tuyến hội.";
  }

  if (profile.role === "PRESIDENT") {
    return "Quản lý các Chi hội trưởng trực thuộc, hàng gối đầu và hoa hồng tuyến.";
  }

  if (profile.role === "BRANCH_LEADER") {
    return "Giới thiệu khách mua hàng, theo dõi tuyến cấp trên và hoa hồng trực tiếp.";
  }

  return "Tài khoản mua hàng tiêu chuẩn.";
}

export function getAffiliateCommissionLabel(profile?: AffiliateProfile) {
  if (!profile) return "Hoa hồng";
  return (
    profile.commissionLabel ||
    (profile.role === "PRESIDENT" ? "Hoa hồng quản lý" : "Hoa hồng trực tiếp")
  );
}

export function getAffiliateHierarchyPath(
  profile?: AffiliateProfile,
  parent?: AffiliateProfile
) {
  if (!profile) return [];
  const ownLevel = getAffiliateRoleLabel(profile);
  const commissionLabel = getAffiliateCommissionLabel(profile);

  if (profile.role === "PRESIDENT") {
    return [ownLevel, commissionLabel];
  }

  return parent
    ? [getAffiliateRoleLabel(parent), ownLevel, commissionLabel]
    : [ownLevel, commissionLabel];
}

export function getAffiliateCommissionPoints(
  profile?: AffiliateProfile,
  portal?: AffiliatePortalSummary
) {
  if (!profile) {
    return {
      approvedCommission: 0,
      pendingCommission: 0,
      commissionRate: 0,
      commissionBaseSales: 0,
      totalCommission: 0,
      points: 0,
    };
  }

  const pendingCommission = (portal?.commissions || [])
    .filter(
      (commission) =>
        commission.beneficiaryId === profile.userId &&
      commission.status === "pending"
    )
    .reduce((sum, commission) => sum + commission.amount, 0);
  const approvedCommission = profile.walletBalance || 0;
  const commissionRate =
    profile.role === "PRESIDENT"
      ? profile.overridingCommissionRate || 0
      : profile.directCommissionRate || 0;
  const commissionBaseSales = profile.totalSales || 0;
  const salesBasedCommission = (commissionBaseSales * commissionRate) / 100;
  const totalCommission = salesBasedCommission || approvedCommission + pendingCommission;

  return {
    approvedCommission,
    pendingCommission,
    commissionRate,
    commissionBaseSales,
    totalCommission,
    points: Math.floor(totalCommission / 1000),
  };
}
