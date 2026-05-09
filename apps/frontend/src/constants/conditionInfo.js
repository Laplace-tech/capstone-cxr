// apps/frontend/src/constants/conditionInfo.js

const CONDITION_INFO = {
  Atelectasis: {
    displayName: '무기폐',
    tone: 'amber',
    summary: '폐 일부가 충분히 팽창하지 않은 상태를 의미합니다.',
    productNote:
      '저환기나 수술 후 변화와 연관될 수 있어, 임상 증상과 함께 영상의 분포를 확인하는 것이 중요합니다.',
  },
  Cardiomegaly: {
    displayName: '심비대',
    tone: 'rose',
    summary: '심장 음영이 커져 보이는 소견입니다.',
    productNote:
      '심부전, 만성 심장질환과 연관 가능성이 있으므로 추가 영상 소견과 환자 상태를 함께 확인해야 합니다.',
  },
  Consolidation: {
    displayName: '경결',
    tone: 'orange',
    summary: '폐 실질이 염증이나 액체로 차 보이는 소견입니다.',
    productNote:
      '폐렴 등과 관련될 수 있으나 중첩 구조물 영향도 받을 수 있어 다른 임상 정보와 함께 해석해야 합니다.',
  },
  Edema: {
    displayName: '폐부종',
    tone: 'violet',
    summary: '폐 내 체액 증가를 시사하는 소견입니다.',
    productNote:
      '심부전과 연관될 수 있으므로 심장 크기, 흉수 여부, 환자 호흡 상태와 함께 판단하는 것이 좋습니다.',
  },
  'Pleural Effusion': {
    displayName: '흉수',
    tone: 'cyan',
    summary: '흉막강에 액체가 고여 보이는 소견입니다.',
    productNote:
      '양측성 여부, 양의 정도, 동반된 무기폐 또는 심비대 소견과 함께 해석하면 도움이 됩니다.',
  },
};

export function getConditionInfo(name) {
  return (
    CONDITION_INFO[name] ?? {
      displayName: name,
      tone: 'slate',
      summary: '모델이 해당 병변 가능성을 추정한 결과입니다.',
      productNote: '최종 판단은 전문의 판독 및 임상 맥락과 함께 확인되어야 합니다.',
    }
  );
}

export function formatConditionTitle(name) {
  const info = getConditionInfo(name);
  return `${info.displayName} · ${name}`;
}

export function formatPositiveLabels(labels = []) {
  if (!labels.length) return '현재 양성으로 분류된 주요 병변은 없습니다.';

  return labels
    .map((label) => getConditionInfo(label).displayName)
    .join(', ');
}
