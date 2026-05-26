-- SecuAccessPro — SQLite initial schema
-- Equivalent to Hibernate hbm2ddl.auto=create
-- Tables ordered by FK dependencies (parents first)
-- Author: Dr Hamid MADANI drmdh@msn.com

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. permissions (no FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  description TEXT,
  category  TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- ============================================================
-- 2. permission_categories (no FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS permission_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  "order"     REAL DEFAULT 0,
  system      INTEGER DEFAULT 0,
  createdAt   TEXT,
  updatedAt   TEXT
);
CREATE INDEX IF NOT EXISTS idx_permcat_order_name ON permission_categories("order", name);

-- ============================================================
-- 3. roles (no FK — permissions stored as JSON array of IDs)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT DEFAULT '[]',
  createdAt   TEXT,
  updatedAt   TEXT
);

-- ============================================================
-- 4. users (roles stored as JSON array of IDs)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  firstName   TEXT NOT NULL,
  lastName    TEXT NOT NULL,
  phone       TEXT,
  status      TEXT DEFAULT 'active',
  lastLoginAt TEXT,
  roles       TEXT DEFAULT '[]',
  createdAt   TEXT,
  updatedAt   TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- 5. counters (no FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS counters (
  id  TEXT PRIMARY KEY,
  seq REAL DEFAULT 0
);

-- ============================================================
-- 6. settings (no FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id        TEXT PRIMARY KEY,
  key       TEXT NOT NULL UNIQUE,
  value     TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT
);

-- ============================================================
-- 7. activities (FK → users)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  description        TEXT,
  icon               TEXT,
  color              TEXT,
  capacity           REAL,
  currentOccupancy   REAL DEFAULT 0,
  schedule           TEXT DEFAULT '[]',
  ticketValidityMode TEXT DEFAULT 'single_use',
  ticketDuration     REAL,
  price              REAL NOT NULL DEFAULT 0,
  currency           TEXT DEFAULT 'DA',
  status             TEXT DEFAULT 'active',
  sortOrder          REAL DEFAULT 0,
  createdBy          TEXT REFERENCES users(id),
  createdAt          TEXT,
  updatedAt          TEXT
);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- ============================================================
-- 8. subscription_plans (no FK — activities embedded as JSON)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL,
  duration    REAL,
  activities  TEXT DEFAULT '[]',
  price       REAL NOT NULL,
  currency    TEXT DEFAULT 'DA',
  isActive    INTEGER DEFAULT 1,
  createdAt   TEXT,
  updatedAt   TEXT
);
CREATE INDEX IF NOT EXISTS idx_subplans_active ON subscription_plans(isActive);

-- ============================================================
-- 9. rfid_tags (FK → clients, users — but clients not yet created)
--    client is nullable so we defer the FK check via no FK constraint here;
--    SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we use
--    a pragmatic approach: store the ID, no hard FK.
-- ============================================================
CREATE TABLE IF NOT EXISTS rfid_tags (
  id            TEXT PRIMARY KEY,
  tagId         TEXT NOT NULL UNIQUE,
  status        TEXT DEFAULT 'available',
  assignedAt    TEXT,
  deactivatedAt TEXT,
  notes         TEXT,
  client        TEXT,
  assignedBy    TEXT REFERENCES users(id),
  createdAt     TEXT,
  updatedAt     TEXT
);
CREATE INDEX IF NOT EXISTS idx_rfidtags_status ON rfid_tags(status);
CREATE INDEX IF NOT EXISTS idx_rfidtags_client ON rfid_tags(client);

-- ============================================================
-- 10. clients (FK → rfid_tags, users)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id             TEXT PRIMARY KEY,
  clientNumber   TEXT UNIQUE,
  clientType     TEXT NOT NULL,
  firstName      TEXT NOT NULL,
  lastName       TEXT NOT NULL,
  phone          TEXT,
  email          TEXT,
  dateOfBirth    TEXT,
  gender         TEXT,
  photo          TEXT,
  faceDescriptor TEXT DEFAULT '[]',
  address        TEXT,
  wilaya         TEXT,
  qrCode         TEXT UNIQUE,
  status         TEXT DEFAULT 'active',
  notes          TEXT,
  rfidTagId      TEXT REFERENCES rfid_tags(id),
  createdBy      TEXT NOT NULL REFERENCES users(id),
  createdAt      TEXT,
  updatedAt      TEXT
);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(clientType);

-- ============================================================
-- 11. client_accesses (FK → clients, subscription_plans, activities, users)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_accesses (
  id             TEXT PRIMARY KEY,
  accessType     TEXT NOT NULL,
  totalQuota     REAL,
  remainingQuota REAL,
  startDate      TEXT NOT NULL,
  endDate        TEXT,
  status         TEXT DEFAULT 'active',
  client         TEXT NOT NULL REFERENCES clients(id),
  plan           TEXT REFERENCES subscription_plans(id),
  activity       TEXT NOT NULL REFERENCES activities(id),
  createdBy      TEXT NOT NULL REFERENCES users(id),
  createdAt      TEXT,
  updatedAt      TEXT
);
CREATE INDEX IF NOT EXISTS idx_caccess_client_activity ON client_accesses(client, activity);
CREATE INDEX IF NOT EXISTS idx_caccess_client_status ON client_accesses(client, status);
CREATE INDEX IF NOT EXISTS idx_caccess_status ON client_accesses(status);

-- ============================================================
-- 12. tickets (FK → clients, client_accesses, activities, users)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id            TEXT PRIMARY KEY,
  ticketNumber  TEXT UNIQUE,
  ticketType    TEXT DEFAULT 'standard',
  qrCode        TEXT UNIQUE,
  clientName    TEXT NOT NULL,
  activityName  TEXT NOT NULL,
  validityMode  TEXT NOT NULL,
  validUntil    TEXT,
  status        TEXT DEFAULT 'active',
  scannedAt     TEXT,
  amount        REAL NOT NULL DEFAULT 0,
  currency      TEXT DEFAULT 'DA',
  printCount    REAL DEFAULT 0,
  client        TEXT NOT NULL REFERENCES clients(id),
  clientAccess  TEXT NOT NULL REFERENCES client_accesses(id),
  activity      TEXT NOT NULL REFERENCES activities(id),
  sourceClient  TEXT REFERENCES clients(id),
  scannedBy     TEXT REFERENCES users(id),
  createdBy     TEXT NOT NULL REFERENCES users(id),
  createdAt     TEXT,
  updatedAt     TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_validuntil ON tickets(validUntil);

-- ============================================================
-- 13. scan_logs (FK → tickets, clients, activities, users)
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_logs (
  id          TEXT PRIMARY KEY,
  scanMethod  TEXT DEFAULT 'webcam',
  result      TEXT NOT NULL,
  denyReason  TEXT,
  quotaBefore REAL,
  quotaAfter  REAL,
  isReentry   INTEGER DEFAULT 0,
  timestamp   TEXT,
  ticket      TEXT REFERENCES tickets(id),
  client      TEXT REFERENCES clients(id),
  activity    TEXT REFERENCES activities(id),
  scannedBy   TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_scanlogs_client ON scan_logs(client);
CREATE INDEX IF NOT EXISTS idx_scanlogs_timestamp ON scan_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scanlogs_result ON scan_logs(result);

-- ============================================================
-- 14. auditlogs (FK → users)
-- ============================================================
CREATE TABLE IF NOT EXISTS auditlogs (
  id         TEXT PRIMARY KEY,
  userName   TEXT NOT NULL,
  userRole   TEXT NOT NULL,
  action     TEXT NOT NULL,
  module     TEXT NOT NULL,
  resource   TEXT DEFAULT '',
  resourceId TEXT DEFAULT '',
  details    TEXT,
  ipAddress  TEXT DEFAULT '',
  status     TEXT DEFAULT 'success',
  timestamp  TEXT,
  userId     TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON auditlogs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_module_ts ON auditlogs(module, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_ts ON auditlogs(userId, timestamp DESC);

-- ============================================================
-- 15. lockers (FK → clients, rfid_tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS lockers (
  id             TEXT PRIMARY KEY,
  number         REAL NOT NULL UNIQUE,
  zone           TEXT NOT NULL,
  status         TEXT DEFAULT 'available',
  rfidLockId     TEXT,
  lastAssignedAt TEXT,
  currentClient  TEXT REFERENCES clients(id),
  currentTag     TEXT REFERENCES rfid_tags(id),
  createdAt      TEXT,
  updatedAt      TEXT
);
CREATE INDEX IF NOT EXISTS idx_lockers_zone ON lockers(zone);
CREATE INDEX IF NOT EXISTS idx_lockers_status ON lockers(status);

-- ============================================================
-- 16. locker_events (FK → lockers, clients, rfid_tags, users)
-- ============================================================
CREATE TABLE IF NOT EXISTS locker_events (
  id          TEXT PRIMARY KEY,
  eventType   TEXT NOT NULL,
  notes       TEXT,
  timestamp   TEXT,
  locker      TEXT NOT NULL REFERENCES lockers(id),
  client      TEXT REFERENCES clients(id),
  rfidTag     TEXT REFERENCES rfid_tags(id),
  performedBy TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_lockevt_locker ON locker_events(locker);
CREATE INDEX IF NOT EXISTS idx_lockevt_timestamp ON locker_events(timestamp DESC);
