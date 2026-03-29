export type PolicyAckId =
  | "copy_prompt"
  | "export_project"
  | "byo_api"
  | "local_workflow";

export type PolicyActionType =
  | "copy_prompt"
  | "export_project"
  | "save_api_key"
  | "enable_local_workflow";

type PolicyAckRecord = {
  policyId: PolicyAckId;
  version: string;
  acceptedAt: string;
  userId: string | null;
};

type PolicyActionRecord = {
  actionType: PolicyActionType;
  confirmedPolicyVersion: string;
  createdAt: string;
  userId: string | null;
};

const ACK_STORAGE_KEY = "sp_policy_ack_v1";
const ACTION_LOG_STORAGE_KEY = "sp_policy_action_log_v1";

const POLICY_ACK_VERSIONS: Record<PolicyAckId, string> = {
  copy_prompt: "copy-prompt-risk-v1",
  export_project: "export-project-risk-v1",
  byo_api: "byo-api-risk-v1",
  local_workflow: "local-workflow-risk-v1"
};

function actorKey(userId: string | null | undefined) {
  const trimmed = String(userId || "").trim();
  return trimmed || "guest";
}

function safeParse<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function getPolicyAckVersion(policyId: PolicyAckId) {
  return POLICY_ACK_VERSIONS[policyId];
}

export function hasPolicyAck(userId: string | null | undefined, policyId: PolicyAckId) {
  const records = safeParse<PolicyAckRecord>(ACK_STORAGE_KEY);
  const currentVersion = getPolicyAckVersion(policyId);
  return records.some((item) =>
    item &&
    item.policyId === policyId &&
    item.version === currentVersion &&
    actorKey(item.userId) === actorKey(userId)
  );
}

export function acknowledgePolicy(userId: string | null | undefined, policyId: PolicyAckId) {
  const records = safeParse<PolicyAckRecord>(ACK_STORAGE_KEY);
  const next: PolicyAckRecord = {
    policyId,
    version: getPolicyAckVersion(policyId),
    acceptedAt: new Date().toISOString(),
    userId: String(userId || "").trim() || null
  };
  const filtered = records.filter((item) => !(item && item.policyId === policyId && actorKey(item.userId) === actorKey(userId)));
  filtered.push(next);
  safeWrite(ACK_STORAGE_KEY, filtered.slice(-50));
  return next;
}

export function logPolicyAction(
  userId: string | null | undefined,
  actionType: PolicyActionType,
  policyId: PolicyAckId
) {
  const logs = safeParse<PolicyActionRecord>(ACTION_LOG_STORAGE_KEY);
  logs.push({
    actionType,
    confirmedPolicyVersion: getPolicyAckVersion(policyId),
    createdAt: new Date().toISOString(),
    userId: String(userId || "").trim() || null
  });
  safeWrite(ACTION_LOG_STORAGE_KEY, logs.slice(-120));
}
