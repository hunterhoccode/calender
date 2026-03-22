// Convert snake_case DB row to camelCase app object
export function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
      ? toCamelCase(value)
      : Array.isArray(value) && key === 'milestones'
        ? value.map(toCamelCase)
        : value;
  }
  return result;
}

// Convert camelCase app object to snake_case for DB
export function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}

// Map campaign from DB row to app shape
export function mapCampaignFromDb(row) {
  if (!row) return null;
  const campaign = toCamelCase(row);
  // Ensure milestones is always an array
  if (!campaign.milestones) campaign.milestones = [];
  // Ensure media is always an array
  if (!campaign.media) campaign.media = [];
  // Ensure channels is always an array
  if (!campaign.channels) campaign.channels = [];
  return campaign;
}

// Map campaign to DB row for insert/update
export function mapCampaignToDb(campaign) {
  const { id, milestones, createdAt, updatedAt, ...rest } = campaign;
  const dbRow = toSnakeCase(rest);
  // Remove UI-only fields
  delete dbRow.brand;
  return dbRow;
}

// Map brand from DB row
export function mapBrandFromDb(row) {
  return toCamelCase(row);
}

// Map milestone from DB row
export function mapMilestoneFromDb(row) {
  return toCamelCase(row);
}
