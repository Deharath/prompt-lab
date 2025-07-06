export const formatSentiment = (value: any) => {
  let sentimentObj: Record<string, unknown> | null = null;

  if (typeof value === 'object' && value !== null) {
    sentimentObj = value as Record<string, unknown>;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        sentimentObj = parsed as Record<string, unknown>;
      }
    } catch {
      // If parsing fails, treat as plain string
    }
  }

  if (sentimentObj && 'label' in sentimentObj && 'confidence' in sentimentObj) {
    const label = sentimentObj.label as string;
    const confidence = sentimentObj.confidence as number;
    return {
      formattedValue: `${label.charAt(0).toUpperCase()}${label.slice(
        1,
      )} (${(confidence * 100).toFixed(1)}%)`,
      unit: '',
    };
  } else if (sentimentObj && 'compound' in sentimentObj) {
    const compound = sentimentObj.compound as number;
    const label =
      compound > 0.1 ? 'positive' : compound < -0.1 ? 'negative' : 'neutral';
    return {
      formattedValue: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
      unit: '',
    };
  } else if (typeof value === 'number') {
    const label =
      value > 0.1 ? 'positive' : value < -0.1 ? 'negative' : 'neutral';
    return {
      formattedValue: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
      unit: '',
    };
  } else {
    return {
      formattedValue: typeof value === 'string' ? value : String(value),
      unit: '',
    };
  }
};

export const formatNumber = (key: string, value: number) => {
  let formattedValue: string | number = value;
  let unit = '';

  if (
    key.includes('score') ||
    key.includes('precision') ||
    key.includes('recall') ||
    key === 'f_score'
  ) {
    if (value >= 0 && value <= 1) {
      formattedValue = `${(value * 100).toFixed(1)}%`;
    } else {
      formattedValue = value.toFixed(3);
    }
  } else if (key.includes('flesch') || key === 'smog') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      formattedValue = 'N/A';
      unit = '';
    } else {
      formattedValue = numValue.toFixed(1);
      unit = key === 'flesch_reading_ease' ? '/100' : '';
    }
  } else if (key.includes('count')) {
    formattedValue = Math.round(value);
  } else if (key === 'response_time_ms') {
    formattedValue = `${value.toFixed(0)}ms`;
  } else if (key === 'estimated_cost_usd') {
    formattedValue = `$${value.toFixed(4)}`;
  } else {
    formattedValue = value.toFixed(2);
  }

  return { formattedValue, unit };
};

export const formatObject = (key: string, value: object) => {
  let formattedValue: string | number = '';
  let unit = '';

  if (key === 'keywords' && typeof value === 'object') {
    const kw = value as Record<string, unknown>;
    if ('foundCount' in kw && 'missingCount' in kw) {
      formattedValue = `${(kw.foundCount as number) || 0}/$ {
        ((kw.foundCount as number) || 0) + ((kw.missingCount as number) || 0)
      } found`;
      unit =
        'matchPercentage' in kw && typeof kw.matchPercentage === 'number'
          ? `(${(kw.matchPercentage || 0).toFixed(1)}%)`
          : '';
    } else {
      formattedValue = JSON.stringify(value);
    }
  } else if (key === 'is_valid_json' && typeof value === 'object') {
    const json = value as Record<string, unknown>;
    if ('isValid' in json) {
      formattedValue = json.isValid ? 'Valid' : 'Invalid';
      unit = json.isValid ? '✅' : '❌';
    } else {
      formattedValue = JSON.stringify(value);
    }
  } else if (key === 'sentiment_detailed') {
    const sentiment = value as Record<string, unknown>;
    if (
      'label' in sentiment &&
      'confidence' in sentiment &&
      'positive' in sentiment &&
      'negative' in sentiment &&
      'neutral' in sentiment
    ) {
      const label = sentiment.label as string;
      const confidence = sentiment.confidence as number;
      const positive = sentiment.positive as number;
      const negative = sentiment.negative as number;
      const neutral = sentiment.neutral as number;

      formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(
        1,
      )} ${(confidence * 100).toFixed(1)}%`;
      unit = `(Pos: ${(positive * 100).toFixed(0)}%, Neg: ${(
        negative * 100
      ).toFixed(0)}%, Neu: ${(neutral * 100).toFixed(0)}%)`;
    } else if ('compound' in sentiment) {
      const compound = sentiment.compound as number;
      const label =
        compound > 0.1 ? 'positive' : compound < -0.1 ? 'negative' : 'neutral';
      formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      unit = `(${compound.toFixed(3)})`;
    } else {
      formattedValue = JSON.stringify(value);
    }
  } else {
    formattedValue = JSON.stringify(value, null, 2);
  }

  return { formattedValue, unit };
};
