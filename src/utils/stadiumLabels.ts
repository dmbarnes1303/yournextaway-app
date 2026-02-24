// src/utils/stadiumLabels.ts

export function areaLabel(area: string) {
  switch (area) {
    case "central":
      return "City centre";
    case "district":
      return "Stadium district";
    case "suburb":
      return "Outer area";
    case "remote":
      return "Out of town";
    default:
      return "Stadium area";
  }
}

export function lateRiskLabel(risk: string) {
  switch (risk) {
    case "easy":
      return "Easy late return";
    case "moderate":
      return "Late return possible";
    case "risky":
      return "Check late transport";
    default:
      return "";
  }
}
