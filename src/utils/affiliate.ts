import { AffiliateProfile, AffiliatePortalSummary, UserInfo } from "@/types";

function getTierLevel(profile?: AffiliateProfile): 1 | 2 | 3 {
  return profile?.tierLevel || (profile?.role === "PRESIDENT" ? 1 : 2);
}

function getPortalTierConfig(profile?: AffiliateProfile, portal?: AffiliatePortalSummary) {
  const tierLevel = getTierLevel(profile);
  return portal?.commissionSettings?.tiers?.find((tier) => tier.tierLevel === tierLevel);
}

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

export function getAffiliateRoleLabel(profile?: AffiliateProfile, portal?: AffiliatePortalSummary) {
  if (!profile) return "Khách hàng thông thường";
  const tierConfig = getPortalTierConfig(profile, portal);
  return (
    profile.levelName ||
    tierConfig?.levelName ||
    (profile.role === "PRESIDENT"
      ? "Chủ tịch hội"
      : profile.role === "BRANCH_LEADER"
        ? "Chi hội trưởng"
        : "Khách hàng thông thường")
  );
}

export function getAffiliateRoleDescription(profile?: AffiliateProfile, portal?: AffiliatePortalSummary) {
  if (!profile) {
    return "Tài khoản mua hàng tiêu chuẩn, không có quyền quản lý tuyến hội.";
  }

  const tierConfig = getPortalTierConfig(profile, portal);
  if (tierConfig?.description) return tierConfig.description;

  if (profile.role === "PRESIDENT") {
    return "Quản lý các Chi hội trưởng trực thuộc, hàng gối đầu và hoa hồng tuyến.";
  }

  if (profile.role === "BRANCH_LEADER") {
    return "Giới thiệu khách mua hàng, theo dõi tuyến cấp trên và hoa hồng trực tiếp.";
  }

  return "Tài khoản mua hàng tiêu chuẩn.";
}

export function getAffiliateCommissionLabel(profile?: AffiliateProfile, portal?: AffiliatePortalSummary) {
  if (!profile) return "Hoa hồng";
  const tierConfig = getPortalTierConfig(profile, portal);
  return (
    profile.commissionLabel ||
    tierConfig?.commissionLabel ||
    (profile.role === "PRESIDENT" ? "Hoa hồng quản lý" : "Hoa hồng trực tiếp")
  );
}

export function getAffiliateHierarchyPath(
  profile?: AffiliateProfile,
  parent?: AffiliateProfile,
  portal?: AffiliatePortalSummary
) {
  if (!profile) return [];
  const ownLevel = getAffiliateRoleLabel(profile, portal);
  const commissionLabel = getAffiliateCommissionLabel(profile, portal);

  if (profile.role === "PRESIDENT") {
    return [ownLevel, commissionLabel];
  }

  return parent
    ? [getAffiliateRoleLabel(parent, portal), ownLevel, commissionLabel]
    : [ownLevel, commissionLabel];
}

export function getAffiliateCommissionRate(
  profile?: AffiliateProfile,
  portal?: AffiliatePortalSummary
) {
  if (!profile) return 0;
  const tierConfig = getPortalTierConfig(profile, portal);
  if (portal?.commissionSettings && portal.commissionSettings.allowPersonalOverride === false) {
    return tierConfig?.rate || 0;
  }
  return profile.role === "PRESIDENT"
    ? profile.overridingCommissionRate || profile.directCommissionRate || tierConfig?.rate || 0
    : profile.directCommissionRate || tierConfig?.rate || 0;
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
  const commissionRate = getAffiliateCommissionRate(profile, portal);
  const commissionBaseSales = profile.totalSales || 0;
  const salesBasedCommission = (commissionBaseSales * commissionRate) / 100;
  const totalCommission = salesBasedCommission || approvedCommission + pendingCommission;
  const pointValue = Math.max(1, Number(portal?.commissionSettings?.pointValue || 1000));

  return {
    approvedCommission,
    pendingCommission,
    commissionRate,
    commissionBaseSales,
    totalCommission,
    points: Math.floor(totalCommission / pointValue),
  };
}
