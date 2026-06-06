export const ROLES = {
  ADMIN: "admin",
  OFFICER: "officer",
  VENDOR: "vendor",
  APPROVER: "approver"
};

export function hasRole(user, roles) {
  return Boolean(user && roles.includes(user.role));
}

export function canManageProcurement(user) {
  return hasRole(user, [ROLES.ADMIN, ROLES.OFFICER]);
}

export function canApprove(user) {
  return hasRole(user, [ROLES.ADMIN, ROLES.APPROVER]);
}

export function canViewOperations(user) {
  return hasRole(user, [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER]);
}
