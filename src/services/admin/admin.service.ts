import prisma from "../../config/db";
import logger from "../../libs/logger";
import { AppError } from "../../utils/error";

export type AdminRange = "1h" | "6h" | "24h" | "7d";

export interface AdminNode {
  id: string;
  name: string | null;
  machineId: string | null;
  region: string | null;
  status: string;
  agentVersion: string | null;
  totalCpu: number;
  totalMemoryMb: number;
  allocatableCpu: number | null;
  allocatableMemoryMb: number | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  runningJobs: number;
  reservedCpu: number;
  reservedMemoryMb: number;
}

export type AdminActivityType =
  | "job_created"
  | "job_started"
  | "job_completed"
  | "job_failed"
  | "job_cancelled"
  | "worker_registered";

export interface AdminActivityEvent {
  id: string;
  type: AdminActivityType;
  at: string;
  jobId?: string;
  jobType?: string;
  jobStatus?: string;
  nodeId?: string;
  nodeName?: string;
}

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
  range: {
    key: AdminRange;
    label: string;
    startsAt: string;
    endsAt: string;
    bucketSeconds: number;
  };
  jobWindow: {
    submitted: number;
    completed: number;
    failed: number;
    cancelled: number;
    terminal: number;
    successRate: number | null;
    failureRate: number | null;
  };
  jobAnalytics: {
    duration: {
      medianSeconds: number | null;
      p95Seconds: number | null;
      sampleSize: number;
    } | null;
    topErrors: Array<{ message: string; count: number }> | null;
    volume: Array<{
      bucket: string;
      submitted: number;
      completed: number;
      failed: number;
    }> | null;
  };
  resourceTelemetry: {
    available: boolean;
    lastSampleAt: string | null;
    points: Array<{
      bucket: string;
      cpuPercent: number;
      memoryPercent: number;
    }>;
  } | null;
  /** Null means the fleet query failed; an empty array means there are no nodes. */
  nodes: AdminNode[] | null;
  /** Null means the activity query failed; an empty array means there is no recorded activity. */
  activity: AdminActivityEvent[] | null;
  partialErrors: Array<{ section: string; message: string }>;
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

interface WindowRow {
  submitted: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface NodeRow {
  id: string;
  name: string | null;
  machineId: string | null;
  region: string | null;
  status: string;
  agentVersion: string | null;
  totalCpu: number;
  totalMemoryMb: number;
  allocatableCpu: number | null;
  allocatableMemoryMb: number | null;
  lastHeartbeatAt: Date | null;
  createdAt: Date;
}

interface NodeUsageRow {
  nodeId: string;
  runningJobs: number;
  reservedCpu: number;
  reservedMemoryMb: number;
}

interface RecentJobRow {
  id: string;
  status: string;
  jobType: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
}

interface RecentNodeRow {
  id: string;
  name: string | null;
  machineId: string | null;
  createdAt: Date;
}

interface DurationRow {
  medianSeconds: number | null;
  p95Seconds: number | null;
  sampleSize: number;
}

interface ErrorRow {
  message: string;
  count: number;
}

interface BucketRow {
  bucket: Date;
  count: number;
}

interface ResourcePointRow {
  bucket: Date;
  cpuPercent: number;
  memoryPercent: number;
}

interface ResourceLatestRow {
  lastSampleAt: Date | null;
}

const RANGE_CONFIG: Record<
  AdminRange,
  { label: string; hours: number; bucketSeconds: number }
> = {
  "1h": { label: "Last 1 hour", hours: 1, bucketSeconds: 300 },
  "6h": { label: "Last 6 hours", hours: 6, bucketSeconds: 1800 },
  "24h": { label: "Last 24 hours", hours: 24, bucketSeconds: 3600 },
  "7d": { label: "Last 7 days", hours: 168, bucketSeconds: 21600 },
};

function resolveRange(input: unknown): {
  key: AdminRange;
  label: string;
  hours: number;
  bucketSeconds: number;
} {
  const key = (
    typeof input === "string" && input in RANGE_CONFIG ? input : "24h"
  ) as AdminRange;
  const config = RANGE_CONFIG[key] ?? RANGE_CONFIG["24h"];
  return { key, ...config };
}

function mergeVolumeSeries(
  since: Date,
  now: Date,
  bucketSeconds: number,
  submitted: BucketRow[],
  completed: BucketRow[],
  failed: BucketRow[],
) {
  const bucketMs = bucketSeconds * 1000;
  const firstBucket = Math.floor(since.getTime() / bucketMs) * bucketMs;
  const bucketCount = Math.max(
    1,
    Math.floor((now.getTime() - firstBucket) / bucketMs) + 1,
  );
  const submittedMap = new Map(
    submitted.map((row) => [row.bucket.getTime(), row.count]),
  );
  const completedMap = new Map(
    completed.map((row) => [row.bucket.getTime(), row.count]),
  );
  const failedMap = new Map(
    failed.map((row) => [row.bucket.getTime(), row.count]),
  );

  return Array.from({ length: bucketCount }, (_, index) => {
    const time = firstBucket + index * bucketMs;
    return {
      bucket: new Date(time).toISOString(),
      submitted: submittedMap.get(time) ?? 0,
      completed: completedMap.get(time) ?? 0,
      failed: failedMap.get(time) ?? 0,
    };
  });
}

function buildActivity(
  jobs: RecentJobRow[],
  nodes: RecentNodeRow[],
): AdminActivityEvent[] {
  const events: AdminActivityEvent[] = [];

  for (const job of jobs) {
    const base = {
      jobId: job.id,
      jobType: job.jobType,
      jobStatus: job.status,
    };
    events.push({
      id: `${job.id}:created`,
      type: "job_created",
      at: job.createdAt.toISOString(),
      ...base,
    });
    if (job.startedAt) {
      events.push({
        id: `${job.id}:started`,
        type: "job_started",
        at: job.startedAt.toISOString(),
        ...base,
      });
    }
    if (job.status === "COMPLETED" && job.completedAt) {
      events.push({
        id: `${job.id}:completed`,
        type: "job_completed",
        at: job.completedAt.toISOString(),
        ...base,
      });
    } else if (job.status === "FAILED" && job.failedAt) {
      events.push({
        id: `${job.id}:failed`,
        type: "job_failed",
        at: job.failedAt.toISOString(),
        ...base,
      });
    } else if (job.status === "CANCELLED" && job.cancelledAt) {
      events.push({
        id: `${job.id}:cancelled`,
        type: "job_cancelled",
        at: job.cancelledAt.toISOString(),
        ...base,
      });
    }
  }

  for (const node of nodes) {
    events.push({
      id: `${node.id}:registered`,
      type: "worker_registered",
      at: node.createdAt.toISOString(),
      nodeId: node.id,
      nodeName: node.name ?? node.machineId ?? node.id,
    });
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Admin overview aggregates data owned by three services, all of which share
 * the same PostgreSQL instance but live in separate schemas. The queries are
 * scoped to the specific schema so service boundaries stay explicit.
 *
 * Core counts are required. Optional operational panels use allSettled so a
 * failed fleet/activity/analytics query does not hide healthy core metrics.
 */
export const getAdminStats = async (
  rangeInput?: unknown,
): Promise<AdminStats> => {
  const range = resolveRange(rangeInput);
  const now = new Date();
  const since = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
  const partialErrors: Array<{ section: string; message: string }> = [];

  try {
    const [machineRows, machineRunningRows, jobRows, userRows, windowRows] =
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
        prisma.$queryRaw<WindowRow[]>`
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= ${since})::int AS "submitted",
            COUNT(*) FILTER (
              WHERE "status" = 'COMPLETED' AND "completedAt" >= ${since}
            )::int AS "completed",
            COUNT(*) FILTER (
              WHERE "status" = 'FAILED' AND "failedAt" >= ${since}
            )::int AS "failed",
            COUNT(*) FILTER (
              WHERE "status" = 'CANCELLED' AND "cancelledAt" >= ${since}
            )::int AS "cancelled"
          FROM jobs.jobs
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
    const windowCounts = windowRows[0] ?? {
      submitted: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    const terminal =
      windowCounts.completed + windowCounts.failed + windowCounts.cancelled;
    const resolvedTerminal = windowCounts.completed + windowCounts.failed;

    const fleetResult = await Promise.allSettled([
      prisma.$queryRaw<NodeRow[]>`
        SELECT
          "id",
          "name",
          "machineId",
          "region",
          "status",
          "agentVersion",
          "totalCpu",
          "totalMemoryMb",
          "allocatableCpu",
          "allocatableMemoryMb",
          "lastHeartbeatAt",
          "createdAt"
        FROM scheduler."Node"
        ORDER BY
          CASE "status"
            WHEN 'HEALTHY' THEN 0
            WHEN 'UNHEALTHY' THEN 1
            WHEN 'REGISTERED' THEN 2
            ELSE 3
          END,
          COALESCE("name", "id")
      `,
      prisma.$queryRaw<NodeUsageRow[]>`
        SELECT
          "assignedNodeId" AS "nodeId",
          COUNT(*)::int AS "runningJobs",
          COALESCE(
            SUM(COALESCE((resources->>'cpu')::numeric, 0)),
            0
          )::int AS "reservedCpu",
          COALESCE(
            SUM(
              COALESCE(
                NULLIF(resources->>'memoryMB', '')::numeric,
                NULLIF(resources->>'memoryMb', '')::numeric,
                0
              )
            ),
            0
          )::int AS "reservedMemoryMb"
        FROM jobs.jobs
        WHERE "status" = 'RUNNING' AND "assignedNodeId" IS NOT NULL
        GROUP BY "assignedNodeId"
      `,
    ]);

    let nodes: AdminNode[] | null = null;
    if (fleetResult[0].status === "fulfilled") {
      const nodeRows = fleetResult[0].value;
      const usage =
        fleetResult[1].status === "fulfilled" ? fleetResult[1].value : [];
      if (fleetResult[1].status === "rejected") {
        logger.error(
          { err: fleetResult[1].reason },
          "Admin worker reservation query failed",
        );
        partialErrors.push({
          section: "fleet",
          message: "Worker resource reservations are temporarily unavailable.",
        });
      }
      const usageByNode = new Map(usage.map((row) => [row.nodeId, row]));
      nodes = nodeRows.map((node) => {
        const used = usageByNode.get(node.id);
        return {
          id: node.id,
          name: node.name,
          machineId: node.machineId,
          region: node.region,
          status: node.status,
          agentVersion: node.agentVersion,
          totalCpu: node.totalCpu,
          totalMemoryMb: node.totalMemoryMb,
          allocatableCpu: node.allocatableCpu,
          allocatableMemoryMb: node.allocatableMemoryMb,
          lastHeartbeatAt: node.lastHeartbeatAt?.toISOString() ?? null,
          createdAt: node.createdAt.toISOString(),
          runningJobs: used?.runningJobs ?? 0,
          reservedCpu: used?.reservedCpu ?? 0,
          reservedMemoryMb: used?.reservedMemoryMb ?? 0,
        };
      });
    } else {
      logger.error(
        { err: fleetResult[0].reason },
        "Admin worker fleet query failed",
      );
      partialErrors.push({
        section: "fleet",
        message: "Worker fleet data is temporarily unavailable.",
      });
    }

    const activityResult = await Promise.allSettled([
      prisma.$queryRaw<RecentJobRow[]>`
        SELECT
          "id",
          "status",
          "jobType",
          "createdAt",
          "startedAt",
          "completedAt",
          "failedAt",
          "cancelledAt"
        FROM jobs.jobs
        ORDER BY
          COALESCE("completedAt", "failedAt", "cancelledAt", "startedAt", "createdAt") DESC
        LIMIT 25
      `,
      prisma.$queryRaw<RecentNodeRow[]>`
        SELECT "id", "name", "machineId", "createdAt"
        FROM scheduler."Node"
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
    ]);

    let activity: AdminActivityEvent[] | null = null;
    if (
      activityResult[0].status === "fulfilled" &&
      activityResult[1].status === "fulfilled"
    ) {
      activity = buildActivity(activityResult[0].value, activityResult[1].value);
    } else {
      logger.error(
        {
          jobs:
            activityResult[0].status === "rejected"
              ? activityResult[0].reason
              : undefined,
          nodes:
            activityResult[1].status === "rejected"
              ? activityResult[1].reason
              : undefined,
        },
        "Admin activity query failed",
      );
      partialErrors.push({
        section: "activity",
        message: "Recent activity is temporarily unavailable.",
      });
    }

    const [durationResult, errorsResult, volumeResult, resourceResult] =
      await Promise.allSettled([
        prisma.$queryRaw<DurationRow[]>`
          WITH durations AS (
            SELECT EXTRACT(
              EPOCH FROM (
                COALESCE("completedAt", "failedAt", "cancelledAt") - "startedAt"
              )
            ) AS seconds
            FROM jobs.jobs
            WHERE "startedAt" IS NOT NULL
              AND COALESCE("completedAt", "failedAt", "cancelledAt") IS NOT NULL
              AND COALESCE("completedAt", "failedAt", "cancelledAt") > "startedAt"
          )
          SELECT
            percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds)::float8 AS "medianSeconds",
            percentile_cont(0.95) WITHIN GROUP (ORDER BY seconds)::float8 AS "p95Seconds",
            COUNT(*)::int AS "sampleSize"
          FROM durations
        `,
        prisma.$queryRaw<ErrorRow[]>`
          SELECT "error" AS "message", COUNT(*)::int AS "count"
          FROM jobs.jobs
          WHERE "status" = 'FAILED'
            AND "error" IS NOT NULL
            AND btrim("error") <> ''
          GROUP BY "error"
          ORDER BY "count" DESC, "message" ASC
          LIMIT 5
        `,
        Promise.all([
          prisma.$queryRaw<BucketRow[]>`
            SELECT
              to_timestamp(
                floor(extract(epoch from "createdAt") / ${range.bucketSeconds}) * ${range.bucketSeconds}
              ) AS "bucket",
              COUNT(*)::int AS "count"
            FROM jobs.jobs
            WHERE "createdAt" >= ${since}
            GROUP BY 1
            ORDER BY 1
          `,
          prisma.$queryRaw<BucketRow[]>`
            SELECT
              to_timestamp(
                floor(extract(epoch from "completedAt") / ${range.bucketSeconds}) * ${range.bucketSeconds}
              ) AS "bucket",
              COUNT(*)::int AS "count"
            FROM jobs.jobs
            WHERE "status" = 'COMPLETED' AND "completedAt" >= ${since}
            GROUP BY 1
            ORDER BY 1
          `,
          prisma.$queryRaw<BucketRow[]>`
            SELECT
              to_timestamp(
                floor(extract(epoch from "failedAt") / ${range.bucketSeconds}) * ${range.bucketSeconds}
              ) AS "bucket",
              COUNT(*)::int AS "count"
            FROM jobs.jobs
            WHERE "status" = 'FAILED' AND "failedAt" >= ${since}
            GROUP BY 1
            ORDER BY 1
          `,
        ]),
        Promise.all([
          prisma.$queryRaw<ResourcePointRow[]>`
            SELECT
              to_timestamp(
                floor(extract(epoch from snapshot."recordedAt") / ${range.bucketSeconds}) * ${range.bucketSeconds}
              ) AS "bucket",
              AVG(
                COALESCE(
                  100.0 * snapshot."usedCpu" / NULLIF(node."totalCpu", 0),
                  0
                )
              )::float8 AS "cpuPercent",
              AVG(
                COALESCE(
                  100.0 * snapshot."usedMemoryMb" / NULLIF(node."totalMemoryMb", 0),
                  0
                )
              )::float8 AS "memoryPercent"
            FROM scheduler."NodeCapacitySnapshot" snapshot
            INNER JOIN scheduler."Node" node ON node."id" = snapshot."nodeId"
            WHERE snapshot."recordedAt" >= ${since}
            GROUP BY 1
            ORDER BY 1
          `,
          prisma.$queryRaw<ResourceLatestRow[]>`
            SELECT MAX("recordedAt") AS "lastSampleAt"
            FROM scheduler."NodeCapacitySnapshot"
          `,
        ]),
      ]);

    const duration =
      durationResult.status === "fulfilled"
        ? {
            medianSeconds: durationResult.value[0]?.medianSeconds ?? null,
            p95Seconds: durationResult.value[0]?.p95Seconds ?? null,
            sampleSize: durationResult.value[0]?.sampleSize ?? 0,
          }
        : null;
    if (durationResult.status === "rejected") {
      logger.error(
        { err: durationResult.reason },
        "Admin execution duration query failed",
      );
      partialErrors.push({
        section: "analytics",
        message: "Execution duration analytics are temporarily unavailable.",
      });
    }

    const topErrors =
      errorsResult.status === "fulfilled" ? errorsResult.value : null;
    if (errorsResult.status === "rejected") {
      logger.error(
        { err: errorsResult.reason },
        "Admin failure reason query failed",
      );
      partialErrors.push({
        section: "analytics",
        message: "Failure reason analytics are temporarily unavailable.",
      });
    }

    let volume = null;
    if (volumeResult.status === "fulfilled") {
      volume = mergeVolumeSeries(
        since,
        now,
        range.bucketSeconds,
        volumeResult.value[0],
        volumeResult.value[1],
        volumeResult.value[2],
      );
    } else {
      logger.error(
        { err: volumeResult.reason },
        "Admin execution volume query failed",
      );
      partialErrors.push({
        section: "analytics",
        message: "Execution volume analytics are temporarily unavailable.",
      });
    }

    let resourceTelemetry = null;
    if (resourceResult.status === "fulfilled") {
      const [points, latest] = resourceResult.value;
      resourceTelemetry = {
        available: points.length > 0,
        lastSampleAt: latest[0]?.lastSampleAt?.toISOString() ?? null,
        points: points.map((point) => ({
          bucket: point.bucket.toISOString(),
          cpuPercent: point.cpuPercent,
          memoryPercent: point.memoryPercent,
        })),
      };
    } else {
      logger.error(
        { err: resourceResult.reason },
        "Admin resource telemetry query failed",
      );
      partialErrors.push({
        section: "resource",
        message: "Resource telemetry is temporarily unavailable.",
      });
    }

    return {
      machines: {
        ...machines,
        runningJobs: machineRunningRows[0]?.count ?? 0,
      },
      jobs,
      users,
      range: {
        key: range.key,
        label: range.label,
        startsAt: since.toISOString(),
        endsAt: now.toISOString(),
        bucketSeconds: range.bucketSeconds,
      },
      jobWindow: {
        ...windowCounts,
        terminal,
        successRate:
          resolvedTerminal > 0 ? windowCounts.completed / resolvedTerminal : null,
        failureRate:
          resolvedTerminal > 0 ? windowCounts.failed / resolvedTerminal : null,
      },
      jobAnalytics: {
        duration,
        topErrors,
        volume,
      },
      resourceTelemetry,
      nodes,
      activity,
      partialErrors,
      generatedAt: now.toISOString(),
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
