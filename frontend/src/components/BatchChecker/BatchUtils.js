export const parseOCRData = (data) => {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const defaultBatchStats = () => ({
  total: 0,
  unsorted: 0,
  needs_crop_input: 0,
  ready_for_ocr: 0,
  ocr_finished: 0,
  checked: 0,
  confirmed: 0,
  verified: 0,
});
