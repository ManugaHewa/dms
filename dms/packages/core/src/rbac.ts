export type Role = "VOLUNTEER" | "ACCOUNTANT" | "ADMIN";

export function requireRole(allowed: Role[]) {
  return (req: any, res: any, next: any) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
