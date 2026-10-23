import prisma from "../../config/db";
import logger from "../../libs/logger";
import { AppError } from "../../utils/error";

export interface AdminStats {
  machines: {
    total: number;
    active: number;
    pending: number;
    unhealthy: number;
    offline: number;
    /** Distinct machines that currently have at least one RUNNING job. */
    runningJobs: number;
  };
  jobs: {
    total: number;
    running: number;
    queued: number;
    scheduled: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  users: {
    total: number;
    submitters: number;
    contributors: number;
    admins: number;
  };
  generatedAt: string;
}

interface MachineRow {
  total: number;
  active: number;
  pending: number;
  unhealthy: number;
  offline: number;
}

interface MachineRunningRow {
  count: number;
}

interface JobRow {
  total: number;
  running: number;
  queued: number;
  scheduled: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface UserRow {
  total: number;
  submitters: number;
  contributors: number;
  admins: number;
}

/**
 * Admin overview aggregates data owned by three services, all of which share
 * the same PostgreSQL instance but live in separate schemas. The queries are
 * scoped to the specific schema so service boundaries stay explicit.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const [machineRows, machineRunningRows, jobRows, userRows] =
      await Promise.all([
        prisma.$queryRaw<MachineRow[]>`
          SELECT
            COUNT(*)::int AS "total",
            COUNT(*) FILTER (WHERE "status" = 'HEALTHY')::int AS "active",
            COUNT(*) FILTER (WHERE "status" = 'REGISTERED')::int AS "pending",
            COUNT(*) FILTER (WHERE "status" = 'UNHEALTHY')::int AS "unhealthy",
            COUNT(*) FILTER (WHERE "status" IN ('OFFLINE', 'DRAINING'))::int AS "offline"
          FROM scheduler."Node"
        `,
        prisma.$queryRaw<MachineRunningRow[]>`
          SELECT COUNT(DISTINCT "assignedNodeId")::int AS "count"
          FROM jobs.jobs
          WHERE "status" = 'RUNNING' AND "assignedNodeId" IS NOT NULL
        `,
        prisma.$queryRaw<JobRow[]>`
          SELECT
            COUNT(*)::int AS "total",
            COUNT(*) FILTER (WHERE "status" = 'RUNNING')::int AS "running",
            COUNT(*) FILTER (WHERE "status" = 'QUEUED')::int AS "queued",
            COUNT(*) FILTER (WHERE "status" = 'SCHEDULED')::int AS "scheduled",
            COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completed",
            COUNT(*) FILTER (WHERE "status" = 'FAILED')::int AS "failed",
            COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelled"
          FROM jobs.jobs
        `,
        prisma.$queryRaw<UserRow[]>`
          SELECT
            COUNT(*)::int AS "total",
            COUNT(*) FILTER (WHERE "accountType" = 'DEVELOPER')::int AS "submitters",
            COUNT(*) FILTER (WHERE "accountType" = 'CONTRIBUTOR')::int AS "contributors",
            COUNT(*) FILTER (WHERE "role" = 'ADMIN')::int AS "admins"
          FROM auth."User"
        `,
      ]);

    const machines = machineRows[0] ?? {
      total: 0,
      active: 0,
      pending: 0,
      unhealthy: 0,
      offline: 0,
    };
    const jobs = jobRows[0] ?? {
      total: 0,
      running: 0,
      queued: 0,
      scheduled: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    const users = userRows[0] ?? {
      total: 0,
      submitters: 0,
      contributors: 0,
      admins: 0,
    };

    return {
      machines: {
        ...machines,
        runningJobs: machineRunningRows[0]?.count ?? 0,
      },
      jobs,
      users,
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError(
      "Failed to load admin statistics",
      500,
      "ADMIN_STATS_FAILED",
    );
  }
};
