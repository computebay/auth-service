import { Router } from "express";
import * as orgController from "./org.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/", (req, res) => {
  res.send("org api is up");
});

/**
 * @desc Create new organization
 * @route POST /api/v1/orgs
 * @auth Required (JWT)
 * @body { name }
 */
router.post("/", authenticate, orgController.createOrg);

/**
 * @desc Get user's organizations
 * @route GET /api/v1/orgs/list/mine
 * @auth Required (JWT)
 */
router.get("/list/mine", authenticate, orgController.listUserOrgs);

/**
 * @desc Get organization by ID
 * @route GET /api/v1/orgs/:orgId
 */
router.get("/:orgId", orgController.getOrg);

/**
 * @desc Update organization
 * @route PATCH /api/v1/orgs/:orgId
 * @auth Required (JWT)
 * @body { name? }
 */
router.patch("/:orgId", authenticate, orgController.updateOrg);

/**
 * @desc Delete organization
 * @route DELETE /api/v1/orgs/:orgId
 * @auth Required (JWT)
 */
router.delete("/:orgId", authenticate, orgController.deleteOrg);

/**
 * @desc Add member to organization
 * @route POST /api/v1/orgs/:orgId/members
 * @auth Required (JWT)
 * @body { userId, role }
 */
router.post("/:orgId/members", authenticate, orgController.addMember);

/**
 * @desc Remove member from organization
 * @route DELETE /api/v1/orgs/:orgId/members/:memberId
 * @auth Required (JWT)
 */
router.delete(
  "/:orgId/members/:memberId",
  authenticate,
  orgController.removeMember,
);

/**
 * @desc Update member role
 * @route PATCH /api/v1/orgs/:orgId/members/:memberId
 * @auth Required (JWT)
 * @body { role }
 */
router.patch(
  "/:orgId/members/:memberId",
  authenticate,
  orgController.updateMemberRoleHandler,
);

export default router;
