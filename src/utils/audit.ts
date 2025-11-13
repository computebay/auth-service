import prisma from "../config/db";

export const logAudit = async (
  userId: string | null,
  eventType: string,
  meta: any,
) => {
  try {
    await prisma.auditLogs.create({
      data: {
        userId,
        eventType,
        meta,
      },
    });
  } catch (error) {}
};
