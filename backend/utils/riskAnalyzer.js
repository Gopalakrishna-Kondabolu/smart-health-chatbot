const criticalKeywords = [
  "chest pain",
  "breathless",
  "difficulty breathing",
  "heart pain",
  "heart attack",
  "severe headache",
  "bleeding",
  "unconscious",
  "high fever",
  "stroke"
];

export const isHighRisk = (message) => {
  return criticalKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
};
