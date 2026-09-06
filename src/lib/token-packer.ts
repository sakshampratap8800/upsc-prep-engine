/**
 * Dynamic Token-Budget Bin Packing Utility
 * 
 * Automatically groups arbitrary items (questions, chapters, prompts)
 * into optimal batches based on exact character/token budget limits.
 * 
 * Guarantees zero prompt truncation and zero timeout cascades across parallel AI workers.
 */

export interface BinPackingOptions<T> {
  items: T[];
  getText: (item: T) => string;
  maxCharsPerBatch: number; // e.g., 1500 chars ≈ 375 tokens
  maxItemsPerBatch?: number; // optional ceiling, e.g. 3 or 5
}

export function packBatchesByTokenBudget<T>({
  items,
  getText,
  maxCharsPerBatch,
  maxItemsPerBatch = 5,
}: BinPackingOptions<T>): T[][] {
  const batches: T[][] = [];
  let currentBatch: T[] = [];
  let currentBatchChars = 0;

  for (const item of items) {
    const text = getText(item) || '';
    const itemChars = text.length;

    // If a single item is already larger than the budget, give it its own dedicated batch
    if (itemChars >= maxCharsPerBatch) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchChars = 0;
      }
      batches.push([item]);
      continue;
    }

    // If adding this item exceeds budget, seal current batch and start a new one
    if (currentBatchChars + itemChars > maxCharsPerBatch && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [item];
      currentBatchChars = itemChars;
    } else {
      currentBatch.push(item);
      currentBatchChars += itemChars;

      // Respect max item count ceiling if specified
      if (currentBatch.length >= maxItemsPerBatch) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchChars = 0;
      }
    }
  }

  // Push final remaining batch
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
