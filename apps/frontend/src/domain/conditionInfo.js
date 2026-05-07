// apps/frontend/src/domain/conditionInfo.js

export const CONDITION_INFO = {
  Atelectasis: {
    koName: "무기폐",
    englishName: "Atelectasis",
    shortDescription:
      "폐의 일부가 충분히 펴지지 않거나 허탈된 상태를 의미합니다.",
    clinicalMeaning:
      "수술 후, 장시간 누워 있는 상태, 기관지 폐쇄, 점액 마개 등에서 관찰될 수 있으며 산소 교환 저하와 연결될 수 있습니다.",
    xrayHint:
      "흉부 X-ray에서는 폐용적 감소, 선상 음영, 기관/횡격막 위치 변화 같은 간접 소견과 함께 판단합니다.",
    productNote:
      "Grad-CAM이 폐 하엽이나 선상 음영 주변을 강조한다면 실제 영상 소견과 함께 확인할 필요가 있습니다.",
  },
  Cardiomegaly: {
    koName: "심비대",
    englishName: "Cardiomegaly",
    shortDescription:
      "심장 그림자가 정상보다 커 보이는 상태를 의미합니다.",
    clinicalMeaning:
      "심부전, 고혈압성 심장질환, 심근질환 등과 관련될 수 있지만 촬영 자세와 흡기 정도에 따라서도 크게 보일 수 있습니다.",
    xrayHint:
      "일반적으로 심흉곽비 증가, 심장 윤곽 확대, 폐혈관 음영 변화 등을 함께 확인합니다.",
    productNote:
      "모델 결과가 양성이라면 심장 크기뿐 아니라 AP/PA 촬영 조건과 환자 자세를 함께 고려해야 합니다.",
  },
  Consolidation: {
    koName: "폐경화",
    englishName: "Consolidation",
    shortDescription:
      "폐포 공간이 공기 대신 액체, 염증성 삼출물 등으로 채워져 음영이 증가한 상태를 의미합니다.",
    clinicalMeaning:
      "폐렴, 흡인, 출혈 등과 관련될 수 있으며 발열, 기침, 염증 수치 등 임상 정보와 함께 해석해야 합니다.",
    xrayHint:
      "국소적 또는 엽성 음영 증가, 공기기관지음영 등이 단서가 될 수 있습니다.",
    productNote:
      "Consolidation은 클래스 불균형과 병변 형태 다양성 때문에 확률만으로 단정하지 말고 Grad-CAM 위치와 원본 영상을 같이 확인해야 합니다.",
  },
  Edema: {
    koName: "폐부종",
    englishName: "Edema",
    shortDescription:
      "폐 조직 또는 폐포 주변에 체액이 증가한 상태를 의미합니다.",
    clinicalMeaning:
      "심부전, 체액 과다, 신장 기능 저하 등과 관련될 수 있으며 호흡곤란 여부와 함께 판단합니다.",
    xrayHint:
      "폐혈관 울혈, 간질성 음영 증가, 양측성 흐린 음영, Kerley B line 등이 함께 보일 수 있습니다.",
    productNote:
      "모델이 양측 폐야의 확산성 음영을 강조하는지 확인하면 결과 해석에 도움이 됩니다.",
  },
  "Pleural Effusion": {
    koName: "흉막삼출",
    englishName: "Pleural Effusion",
    shortDescription:
      "폐와 흉벽 사이의 흉막 공간에 액체가 고인 상태를 의미합니다.",
    clinicalMeaning:
      "심부전, 감염, 악성 질환, 염증성 질환 등 다양한 원인과 관련될 수 있습니다.",
    xrayHint:
      "늑골횡격막각 둔화, 반월상 음영, 하부 폐야 음영 증가가 주요 단서가 될 수 있습니다.",
    productNote:
      "Grad-CAM이 폐 하부나 늑골횡격막각 주변을 강조한다면 원본 영상에서 삼출 소견을 확인해야 합니다.",
  },
};

export const CONDITION_ORDER = [
  "Atelectasis",
  "Cardiomegaly",
  "Consolidation",
  "Edema",
  "Pleural Effusion",
];

export function getConditionInfo(label) {
  return CONDITION_INFO[label] || {
    koName: label || "알 수 없음",
    englishName: label || "Unknown",
    shortDescription: "등록된 설명이 없습니다.",
    clinicalMeaning: "추가 설명이 필요한 항목입니다.",
    xrayHint: "원본 영상과 모델 결과를 함께 확인해야 합니다.",
    productNote: "AI 결과는 참고 정보이며, 최종 판단은 의료 전문가의 판독이 필요합니다.",
  };
}

export function getRiskLevel(probability, threshold, predicted) {
  if (!predicted) return "낮음";
  if (probability >= Math.max(0.8, threshold + 0.2)) return "높음";
  if (probability >= Math.max(0.6, threshold)) return "중간";
  return "관찰 필요";
}
