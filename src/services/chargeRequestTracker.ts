export type ChargeRequestStatus =
  | "pending_reserve"
  | "reserved"
  | "compensating"
  | "finalized"
  | "rolled_back"
  | "failed";

export type ChargeRequestRecord = {
  requestKey: string;
  status: ChargeRequestStatus;
  entryId: string | null;
  error: string | null;
};

export type ChargeRequestTracker = {
  begin: (requestKey: string) => boolean;
  markReserved: (requestKey: string, entryId: string) => void;
  pickCompensationEntry: (requestKey: string) => string | null;
  markFinalized: (requestKey: string) => void;
  markRolledBack: (requestKey: string) => void;
  markFailed: (requestKey: string, error: string) => void;
  get: (requestKey: string) => ChargeRequestRecord | null;
};

export function createChargeRequestTracker(): ChargeRequestTracker {
  const records = new Map<string, ChargeRequestRecord>();

  return {
    begin(requestKey: string) {
      const key = String(requestKey || "").trim();
      if (!key) return false;
      if (records.has(key)) return false;
      records.set(key, {
        requestKey: key,
        status: "pending_reserve",
        entryId: null,
        error: null,
      });
      return true;
    },
    markReserved(requestKey: string, entryId: string) {
      const row = records.get(requestKey);
      if (!row) return;
      row.status = "reserved";
      row.entryId = entryId;
      row.error = null;
    },
    pickCompensationEntry(requestKey: string) {
      const row = records.get(requestKey);
      if (!row) return null;
      if (row.status !== "reserved" || !row.entryId) return null;
      row.status = "compensating";
      row.error = null;
      return row.entryId;
    },
    markFinalized(requestKey: string) {
      const row = records.get(requestKey);
      if (!row) return;
      row.status = "finalized";
      row.error = null;
    },
    markRolledBack(requestKey: string) {
      const row = records.get(requestKey);
      if (!row) return;
      row.status = "rolled_back";
      row.error = null;
    },
    markFailed(requestKey: string, error: string) {
      const row = records.get(requestKey);
      if (!row) return;
      row.status = "failed";
      row.error = String(error || "unknown_error");
    },
    get(requestKey: string) {
      return records.get(requestKey) ?? null;
    },
  };
}
