// Ensure required array fields have defaults for campaign objects from Firestore
export function mapCampaignFromDb(data, id) {
  return {
    ...data,
    id,
    milestones: data.milestones || [],
    media:      data.media      || [],
    channels:   data.channels   || [],
  };
}
