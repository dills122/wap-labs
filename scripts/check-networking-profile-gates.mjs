#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "docs/waves/network-profile-gates.json");
const workItemsPath = path.join(root, "docs/waves/WORK_ITEMS.md");
const architecturePath = path.join(root, "docs/waves/TECHNICAL_ARCHITECTURE.md");
const decisionRecordPath = path.join(
  root,
  "docs/waves/NETWORK_PROFILE_DECISION_RECORD.md"
);

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fail(message) {
  console.error(`Network profile gate check failed: ${message}`);
  process.exit(1);
}

function parseTicketStatuses(workItems) {
  const statuses = new Map();
  const lines = workItems.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^### (T0-\d+)\b/);
    if (!heading) {
      continue;
    }
    const id = heading[1];
    for (let j = i + 1; j < Math.min(i + 16, lines.length); j += 1) {
      const status = lines[j].match(/`Status`:\s*`([^`]+)`/);
      if (status) {
        statuses.set(id, status[1]);
        break;
      }
    }
  }
  return statuses;
}

const config = JSON.parse(read(configPath));
const workItems = read(workItemsPath);
const architecture = read(architecturePath);
const decisionRecord = read(decisionRecordPath);
const ticketStatuses = parseTicketStatuses(workItems);

if (!decisionRecord.includes("Ticket: `T0-14`")) {
  fail("decision record is missing T0-14 marker");
}

if (!architecture.includes("docs/waves/NETWORK_PROFILE_DECISION_RECORD.md")) {
  fail("TECHNICAL_ARCHITECTURE.md must link NETWORK_PROFILE_DECISION_RECORD.md");
}

if (!architecture.includes(config.currentProfile) || !architecture.includes(config.targetProfile)) {
  fail("TECHNICAL_ARCHITECTURE.md must reference both current and target profiles");
}

const t014Status = ticketStatuses.get("T0-14");
if (!t014Status) {
  fail("T0-14 status missing from WORK_ITEMS.md");
}

for (const ticket of config.requiredForPromotion) {
  if (!ticketStatuses.has(ticket)) {
    fail(`required ticket ${ticket} missing from WORK_ITEMS.md`);
  }
}

for (const file of config.contractFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    fail(`missing contract file: ${file}`);
  }
}

for (const [profile, lanes] of Object.entries(config.fixtureLanes)) {
  for (const lane of lanes) {
    const fullPath = path.join(root, lane);
    if (!fs.existsSync(fullPath)) {
      fail(`missing fixture lane path for ${profile}: ${lane}`);
    }
  }
}

const unresolvedPromotionBlocks = config.requiredForPromotion.filter(
  (ticket) => ticketStatuses.get(ticket) !== "done"
);

if (config.currentProfile === "gateway-bridged" && unresolvedPromotionBlocks.length === 0) {
  fail("all promotion gates are done; currentProfile should no longer remain gateway-bridged");
}

console.log(
  `Network profile gate check OK (current=${config.currentProfile}, target=${config.targetProfile}, blockedBy=${unresolvedPromotionBlocks.join(",") || "none"})`
);
